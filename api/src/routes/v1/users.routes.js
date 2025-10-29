import { Router } from 'express';
import { requireSession } from '../../middleware/requireSession.js';

const r = Router();

r.get('/me', requireSession, (req, res) => {
  res.json({ userId: req.session.userId, roles: req.session.roles || [] });
});

export default r;
