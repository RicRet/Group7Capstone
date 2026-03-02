import crypto from 'node:crypto';
import { query } from '../db/pg.js';
import { createSession } from './session.service.js';
import { getUserProfile } from './users.service.js';

const normalizeEmail = (email) => (email || '').trim().toLowerCase();
const normalizeText = (val) => (val || '').trim();

// replace with bcrypt/argon2 in real usage
function hash(p) { return crypto.createHash('sha256').update(p).digest('hex'); }

export async function createUser(username, email, password, firstName = null, lastName = null, avatarUrl = null) {
  const normalizedUsername = normalizeText(username);
  const normalizedEmail = normalizeEmail(email);
  const normalizedFirst = firstName ? normalizeText(firstName) : null;
  const normalizedLast = lastName ? normalizeText(lastName) : null;
  // Check if username or email already exists
  const existing = await query(
    'SELECT user_id FROM users.app_user WHERE display_name = $1 OR email = $2',
    [normalizedUsername, normalizedEmail]
  );
  if (existing.length > 0) return null;

  const password_hash = hash(password);
  const inserted = await query(
    `INSERT INTO users.app_user (display_name, email, password_hash, first_name, last_name, avatar_url)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING user_id, display_name, email, first_name, last_name, avatar_url, created_at`,
    [normalizedUsername, normalizedEmail, password_hash, normalizedFirst, normalizedLast, avatarUrl]
  );
  return inserted[0];
}

export async function isEmailAvailable(email) {
  const rows = await query(
    'SELECT 1 FROM users.app_user WHERE email = $1 LIMIT 1',
    [normalizeEmail(email)]
  );
  return rows.length === 0;
}

export async function verifyUser(usernameOrEmail, password) {
  const rows = await query(
    `SELECT user_id as id, display_name, password_hash
     FROM users.app_user
     WHERE display_name = $1 OR email = $1`,
    [usernameOrEmail]
  );
  const user = rows[0];
  if (!user) return null;
  const ok = user.password_hash === hash(password);
  return ok ? { id: user.id, username: user.display_name, roles: user.roles || [] } : null;
}

export async function login(username, password) {
  const user = await verifyUser(username, password);
  if (!user) return null;
  const sid = await createSession(user.id, user.roles, user.username);
  // Pre-warm profile cache for fast subsequent requests
  const profile = await getUserProfile(user.id).catch(() => null);
  return {
    sid,
    user: {
      id: user.id,
      username: user.username,
      roles: user.roles,
      firstName: profile?.firstName,
      lastName: profile?.lastName,
      avatarUrl: profile?.avatarUrl
    }
  };
}
