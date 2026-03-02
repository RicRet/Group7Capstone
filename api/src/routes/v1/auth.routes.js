import { Router } from 'express';
import { requireSession } from '../../middleware/requireSession.js';
import { validate } from '../../middleware/validate.js';
import { createUser, isEmailAvailable, login } from '../../services/auth.service.js';
import { deleteSession } from '../../services/session.service.js';
import { emailCheckSchema, loginSchema, signupSchema } from '../../validations/auth.schema.js';

const r = Router();

r.post('/signup/check-email', validate(emailCheckSchema), async (req, res) => {
  const ok = await isEmailAvailable(req.body.email);
  res.json({ available: ok });
});

r.post('/signup', validate(signupSchema), async (req, res) => {
  const { username, email, password, firstName, lastName } = req.body;
  const user = await createUser(username, email, password, firstName, lastName);
  if (!user) return res.status(409).json({ error: 'Username or email already exists' });
  res.status(201).json({ message: 'User created successfully'});
});

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
