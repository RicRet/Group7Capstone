import { ZodError } from 'zod';

export function errorHandler(err, _req, res, _next) {
  const code = err.statusCode || err.status || 500;
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'ValidationError', details: err.errors });
  }
  res.status(code).json({ error: err.name || 'Error', message: err.message || 'Internal error' });
}
