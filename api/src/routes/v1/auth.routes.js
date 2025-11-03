import { Router } from 'express';
import { requireSession } from '../../middleware/requireSession.js';
import { validate } from '../../middleware/validate.js';
import { login } from '../../services/auth.service.js';
import { deleteSession } from '../../services/session.service.js';
import { loginSchema } from '../../validations/auth.schema.js';

const r = Router();

r.post('/login', validate(loginSchema), async (req, res) => {
  const { username, password } = req.body;
  const data = await login(username, password);
  if (!data) return res.status(401).json({ error: 'Invalid credentials' });
  res.json({ token: data.sid, user: data.user });
});

r.post('/logout', requireSession, async (req, res) => {
  await deleteSession(req.sid);
  res.json({ ok: true });
});


export default r;
