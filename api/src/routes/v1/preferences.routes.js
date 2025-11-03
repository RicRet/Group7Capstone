import { Router } from 'express';

const r = Router();

// Placeholder preferences routes
r.get('/', (req, res) => {
  res.status(204).send();
});

export default r;
