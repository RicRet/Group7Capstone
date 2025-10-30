import crypto from 'node:crypto';
import { query } from '../db/pg.js';
import { createSession } from './session.service.js';

// replace with bcrypt/argon2 in real usage
function hash(p) { return crypto.createHash('sha256').update(p).digest('hex'); }

export async function verifyUser(username, password) {
  // Example: adjust to your users table
  const rows = await query(
    'SELECT id, password_hash, roles FROM users WHERE username = $1',
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
