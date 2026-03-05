import { keys } from '../cache/keys.js';
import { TTL } from '../cache/policy.js';
import { jsonGet, jsonSet, redis } from '../cache/redis.js';
import { query } from '../db/pg.js';

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------

/** Accept { lat, lon } or GeoJSON Point and return { lon, lat } */
function extractLonLat(geom) {
  if (geom?.type === 'Point') {
    return { lon: geom.coordinates[0], lat: geom.coordinates[1] };
  }
  return { lon: geom.lon, lat: geom.lat };
}

/** Row from Postgres → clean JS object */
function normalizeRow(row) {
  return {
    reminderId:       row.reminder_id,
    userId:           row.user_id,
    label:            row.label,
    destinationGeom:  row.destination_geom,   // GeoJSON from ST_AsGeoJSON
    destinationLabel: row.destination_label,
    remindTime:       row.remind_time,
    daysOfWeek:       row.days_of_week,
    activeFrom:       row.active_from,
    activeUntil:      row.active_until,
    savedRouteId:     row.saved_route_id,
    createdAt:        row.created_at,
    updatedAt:        row.updated_at
  };
}

const SELECT = `
  SELECT
    reminder_id,
    user_id,
    label,
    ST_AsGeoJSON(destination_geom)::json AS destination_geom,
    destination_label,
    remind_time,
    days_of_week,
    active_from,
    active_until,
    saved_route_id,
    created_at,
    updated_at
  FROM users.user_reminder`;

/** Bust the per-user reminder list cache */
async function invalidate(userId) {
  try {
    if (redis?.isOpen) await redis.del(keys.reminders(userId));
  } catch { /* cache failure should never break writes */ }
}

// ---------------------------------------------------------------
// Public service functions
// ---------------------------------------------------------------

export async function listReminders(userId) {
  const cacheKey = keys.reminders(userId);
  const cached = await jsonGet(cacheKey);
  if (cached) return cached;

  const rows = await query(
    `${SELECT} WHERE user_id = $1 ORDER BY remind_time ASC`,
    [userId]
  );
  const result = rows.map(normalizeRow);
  await jsonSet(cacheKey, result, TTL.reminders);
  return result;
}

export async function createReminder(userId, data) {
  const { lon, lat } = extractLonLat(data.destination_geom);

  const rows = await query(
    `INSERT INTO users.user_reminder
       (user_id, label, destination_geom, destination_label, remind_time,
        days_of_week, active_from, active_until, saved_route_id)
     VALUES
       ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography,
        $5, $6, $7::users.day_of_week[], $8, $9, $10)
     RETURNING reminder_id`,
    [
      userId,
      data.label,
      lon, lat,
      data.destination_label  ?? null,
      data.remind_time,
      data.days_of_week,
      data.active_from        ?? null,
      data.active_until       ?? null,
      data.saved_route_id     ?? null
    ]
  );

  await invalidate(userId);
  const full = await query(`${SELECT} WHERE reminder_id = $1`, [rows[0].reminder_id]);
  return normalizeRow(full[0]);
}

export async function updateReminder(userId, reminderId, data) {
  // Verify ownership before touching anything
  const existing = await query(
    'SELECT reminder_id FROM users.user_reminder WHERE reminder_id = $1 AND user_id = $2',
    [reminderId, userId]
  );
  if (existing.length === 0) return null;

  const colMap = {
    label:             'label',
    destination_label: 'destination_label',
    remind_time:       'remind_time',
    active_from:       'active_from',
    active_until:      'active_until',
    saved_route_id:    'saved_route_id'
  };

  const setClauses = [];
  const values = [];
  let idx = 1;

  for (const [key, val] of Object.entries(data)) {
    if (key === 'destination_geom') {
      const { lon, lat } = extractLonLat(val);
      setClauses.push(
        `destination_geom = ST_SetSRID(ST_MakePoint($${idx++}, $${idx++}), 4326)::geography`
      );
      values.push(lon, lat);
    } else if (key === 'days_of_week') {
      setClauses.push(`days_of_week = $${idx++}::users.day_of_week[]`);
      values.push(val);
    } else if (colMap[key]) {
      setClauses.push(`${colMap[key]} = $${idx++}`);
      values.push(val);
    }
  }

  if (setClauses.length === 0) return null;

  values.push(reminderId);
  const rows = await query(
    `UPDATE users.user_reminder
     SET ${setClauses.join(', ')}
     WHERE reminder_id = $${idx}
     RETURNING reminder_id`,
    values
  );
  if (rows.length === 0) return null;

  await invalidate(userId);
  const full = await query(`${SELECT} WHERE reminder_id = $1`, [rows[0].reminder_id]);
  return normalizeRow(full[0]);
}

export async function deleteReminder(userId, reminderId) {
  const rows = await query(
    `DELETE FROM users.user_reminder
     WHERE reminder_id = $1 AND user_id = $2
     RETURNING reminder_id`,
    [reminderId, userId]
  );
  if (rows.length === 0) return false;
  await invalidate(userId);
  return true;
}
