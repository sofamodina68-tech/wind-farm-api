import { randomUUID } from 'node:crypto';

export function requestId(req, res, next) {
  req.id = req.headers['x-request-id'] ?? randomUUID().slice(0, 8);
  res.setHeader('X-Request-Id', req.id);
  next();
}