import crypto from 'node:crypto';
import { query } from '../db/pg.js';
import { createSession } from './session.service.js';

// replace with bcrypt/argon2 in real usage
function hash(p) { return crypto.createHash('sha256').update(p).digest('hex'); }

export async function createUser(username, email, password) {
  // Check if username or email already exists
  const existing = await query(
    'SELECT user_id FROM users.app_user WHERE display_name = $1 OR email = $2',
    [username, email]
  );
  if (existing.length > 0) return null;

  const password_hash = hash(password);
  const inserted = await query(
    `INSERT INTO users.app_user (display_name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING user_id, display_name, email, created_at`,
    [username, email, password_hash]
  );
  return inserted[0];
}

export async function verifyUser(username, password) {
  // Example: adjust to your users table
const rows = await query(`
  SELECT user_id as id, password_hash
  FROM users.app_user
  WHERE display_name = $1 OR email = $1`,
  [username]
);
  const user = rows[0];
  if (!user) return null;
  const ok = user.password_hash === hash(password);
  return ok ? { id: user.id, roles: user.roles || [] } : null;
}

export async function login(username, password) {
  const user = await verifyUser(username, password);
  if (!user) return null;
  const sid = await createSession(user.id, user.roles);
  return { sid, user: { id: user.id, roles: user.roles } };
}
