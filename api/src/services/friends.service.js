import { query } from '../db/pg.js';

const baseSelect = `
  SELECT
    f.user_id,
    f.friend_user_id,
    f.status::text AS status,
    f.requested_by,
    f.created_at,
    f.updated_at,
    u1.display_name AS user1_name,
    u1.first_name AS user1_first,
    u1.last_name AS user1_last,
    u1.email AS user1_email,
    u2.display_name AS user2_name,
    u2.first_name AS user2_first,
    u2.last_name AS user2_last,
    u2.email AS user2_email
  FROM users.app_friends f
  JOIN users.app_user u1 ON u1.user_id = f.user_id
  JOIN users.app_user u2 ON u2.user_id = f.friend_user_id
`;

function normalizePair(a, b) {
  if (a === b) throw new Error('Cannot add yourself as a friend');
  return a < b ? [a, b] : [b, a];
}

function normalizeEdge(row, currentUserId) {
  if (!row) return null;
  const amFirst = row.user_id === currentUserId;
  const otherId = amFirst ? row.friend_user_id : row.user_id;
  const otherName = amFirst ? row.user2_name : row.user1_name;
  const otherFirst = amFirst ? row.user2_first : row.user1_first;
  const otherLast = amFirst ? row.user2_last : row.user1_last;
  const otherEmail = amFirst ? row.user2_email : row.user1_email;
  const direction = row.status === 'pending'
    ? (row.requested_by === currentUserId ? 'outgoing' : 'incoming')
    : 'accepted';

  return {
    userId: otherId,
    username: otherName,
    firstName: otherFirst,
    lastName: otherLast,
    email: otherEmail,
    status: row.status,
    direction,
    requestedBy: row.requested_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function ensureUserExists(userId) {
  const rows = await query('SELECT 1 FROM users.app_user WHERE user_id = $1', [userId]);
  return rows.length > 0;
}

async function fetchRelationshipRows(currentUserId) {
  return query(
    `${baseSelect}
     WHERE f.user_id = $1 OR f.friend_user_id = $1
     ORDER BY f.updated_at DESC`,
    [currentUserId]
  );
}

async function fetchEdge(userId, friendUserId) {
  const rows = await query(
    `${baseSelect} WHERE f.user_id = $1 AND f.friend_user_id = $2`,
    [userId, friendUserId]
  );
  return rows[0];
}

export async function listFriendships(currentUserId) {
  const rows = await fetchRelationshipRows(currentUserId);
  const normalized = rows.map((r) => normalizeEdge(r, currentUserId)).filter(Boolean);

  const accepted = normalized.filter((f) => f.status === 'accepted');
  const incoming = normalized.filter((f) => f.status === 'pending' && f.direction === 'incoming');
  const outgoing = normalized.filter((f) => f.status === 'pending' && f.direction === 'outgoing');

  return { accepted, incoming, outgoing };
}

export async function searchForUsers(term, currentUserId) {
  const like = `%${term.toLowerCase()}%`;
  const matches = await query(
    `SELECT user_id, display_name, first_name, last_name, email
     FROM users.app_user
     WHERE (
        LOWER(display_name) LIKE $1
        OR LOWER(email) LIKE $1
        OR LOWER(COALESCE(first_name, '')) LIKE $1
        OR LOWER(COALESCE(last_name, '')) LIKE $1
        OR LOWER(CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, ''))) LIKE $1
     )
       AND user_id <> $2
     ORDER BY display_name ASC
     LIMIT 20`,
    [like, currentUserId]
  );

  const relationships = await fetchRelationshipRows(currentUserId);
  const relationshipMap = new Map();
  relationships.forEach((row) => {
    const otherId = row.user_id === currentUserId ? row.friend_user_id : row.user_id;
    relationshipMap.set(otherId, row);
  });

  return matches.map((u) => {
    const rel = relationshipMap.get(u.user_id);
    let relationship = 'none';
    if (rel) {
      if (rel.status === 'accepted') relationship = 'accepted';
      else if (rel.requested_by === currentUserId) relationship = 'pending_out';
      else relationship = 'pending_in';
    }
    return {
      userId: u.user_id,
      username: u.display_name,
      firstName: u.first_name,
      lastName: u.last_name,
      email: u.email,
      relationship
    };
  });
}

export async function sendFriendRequest(actorId, targetUserId) {
  const targetExists = await ensureUserExists(targetUserId);
  if (!targetExists) return { state: 'not-found' };

  const [userId, friendUserId] = normalizePair(actorId, targetUserId);
  const existing = await query(
    'SELECT status::text AS status, requested_by FROM users.app_friends WHERE user_id = $1 AND friend_user_id = $2',
    [userId, friendUserId]
  );

  if (existing.length) {
    const row = existing[0];
    if (row.status === 'blocked') return { state: 'blocked' };
    if (row.status === 'accepted') {
      const edge = await fetchEdge(userId, friendUserId);
      return { state: 'already-friends', friendship: normalizeEdge(edge, actorId) };
    }
    // Pending: if the other party requested, accepting fulfills the request
    if (row.status === 'pending') {
      if (row.requested_by === actorId) {
        const edge = await fetchEdge(userId, friendUserId);
        return { state: 'pending', friendship: normalizeEdge(edge, actorId) };
      }
      await query(
        `UPDATE users.app_friends
         SET status = 'accepted', updated_at = now()
         WHERE user_id = $1 AND friend_user_id = $2`,
        [userId, friendUserId]
      );
      const edge = await fetchEdge(userId, friendUserId);
      return { state: 'accepted', friendship: normalizeEdge(edge, actorId) };
    }
  }

  await query(
    `INSERT INTO users.app_friends (user_id, friend_user_id, status, requested_by)
     VALUES ($1, $2, 'pending', $3)`,
    [userId, friendUserId, actorId]
  );
  const edge = await fetchEdge(userId, friendUserId);
  return { state: 'pending', friendship: normalizeEdge(edge, actorId) };
}

export async function acceptFriendRequest(actorId, requesterId) {
  const [userId, friendUserId] = normalizePair(actorId, requesterId);
  const existing = await query(
    'SELECT status::text AS status, requested_by FROM users.app_friends WHERE user_id = $1 AND friend_user_id = $2',
    [userId, friendUserId]
  );
  if (!existing.length) return { state: 'not-found' };

  const row = existing[0];
  if (row.status !== 'pending') return { state: 'not-pending' };
  if (row.requested_by === actorId) return { state: 'already-requested' };

  await query(
    `UPDATE users.app_friends
     SET status = 'accepted', updated_at = now()
     WHERE user_id = $1 AND friend_user_id = $2`,
    [userId, friendUserId]
  );
  const edge = await fetchEdge(userId, friendUserId);
  return { state: 'accepted', friendship: normalizeEdge(edge, actorId) };
}
