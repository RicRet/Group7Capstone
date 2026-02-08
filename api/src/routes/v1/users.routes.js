import { Router } from 'express';
import { requireSession } from '../../middleware/requireSession.js';

const r = Router();

r.get('/me', requireSession, (req, res) => {
  const profile = req.user || { id: req.session.userId, username: req.session.username };
  res.json({
    userId: profile.id,
    username: profile.username,
    firstName: profile.firstName,
    lastName: profile.lastName,
    avatarUrl: profile.avatarUrl,
    email: profile.email,
    roles: req.session.roles || []
  });
});

export default r;
