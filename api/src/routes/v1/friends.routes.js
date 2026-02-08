import { Router } from 'express';
import { requireSession } from '../../middleware/requireSession.js';
import { validate } from '../../middleware/validate.js';
import { acceptFriendRequest, listFriendships, searchForUsers, sendFriendRequest } from '../../services/friends.service.js';
import { friendRequestSchema, friendRespondSchema, friendSearchSchema } from '../../validations/friends.schema.js';

const r = Router();

r.use(requireSession);

r.get('/', async (req, res) => {
  const data = await listFriendships(req.session.userId);
  res.json(data);
});

r.get('/search', validate(friendSearchSchema), async (req, res) => {
  const results = await searchForUsers(req.query.q, req.session.userId);
  res.json({ results });
});

r.post('/requests', validate(friendRequestSchema), async (req, res) => {
  const { userId: targetId } = req.body;
  if (targetId === req.session.userId) return res.status(400).json({ error: 'Cannot add yourself' });

  const result = await sendFriendRequest(req.session.userId, targetId);
  if (result.state === 'not-found') return res.status(404).json({ error: 'User not found' });
  if (result.state === 'blocked') return res.status(403).json({ error: 'Request blocked' });

  const status = result.state === 'pending' ? 201 : 200;
  res.status(status).json({ state: result.state, friendship: result.friendship });
});

r.post('/requests/:userId/accept', validate(friendRespondSchema), async (req, res) => {
  const targetId = req.params.userId;
  if (targetId === req.session.userId) return res.status(400).json({ error: 'Cannot accept yourself' });

  const result = await acceptFriendRequest(req.session.userId, targetId);
  if (result.state === 'not-found') return res.status(404).json({ error: 'No request from that user' });
  if (result.state === 'not-pending') return res.status(400).json({ error: 'Request is not pending' });
  if (result.state === 'already-requested') return res.status(400).json({ error: 'You sent this request' });

  res.json({ state: result.state, friendship: result.friendship });
});

export default r;
