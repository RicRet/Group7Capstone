import { getSession, touchSession } from '../services/session.service.js';
import { getUserProfile } from '../services/users.service.js';

export async function requireSession(req, res, next) {
  const auth = req.headers.authorization || '';
  const [, sid] = auth.split(' ');
  if (!sid) return res.status(401).json({ error: 'Missing token' });

  const session = await getSession(sid);
  if (!session) return res.status(401).json({ error: 'Expired or invalid' });

  await touchSession(sid);
  req.session = session;
  req.sid = sid;
  // Attach quick-access user profile from cache (fallback to DB)
  if (session.userId) {
    req.user = await getUserProfile(session.userId);
  }
  next();
}
