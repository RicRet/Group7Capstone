import { Router } from 'express';
import { requireSession } from '../../middleware/requireSession.js';
import { updateUserProfile } from '../../services/users.service.js';

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

r.patch('/me', requireSession, async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const { username, firstName, lastName, avatarUrl } = req.body;

    // Build only the fields that were sent
    const fields = {};
    if (username !== undefined) fields.username = username;
    if (firstName !== undefined) fields.firstName = firstName;
    if (lastName !== undefined) fields.lastName = lastName;
    if (avatarUrl !== undefined) fields.avatarUrl = avatarUrl;

    if (Object.keys(fields).length === 0) {
      return res.status(400).json({ message: 'No fields provided to update' });
    }

    const updated = await updateUserProfile(userId, fields);
    if (!updated) return res.status(404).json({ message: 'User not found' });

    // Reflect changes back in session user if present
    if (req.user) {
      Object.assign(req.user, {
        username: updated.username,
        firstName: updated.firstName,
        lastName: updated.lastName,
        avatarUrl: updated.avatarUrl,
      });
    }

    res.json({
      userId: updated.id,
      username: updated.username,
      firstName: updated.firstName,
      lastName: updated.lastName,
      avatarUrl: updated.avatarUrl,
      email: updated.email,
    });
  } catch (err) {
    next(err);
  }
});

export default r;
