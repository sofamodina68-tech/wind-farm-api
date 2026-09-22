import { NotFoundError } from '../errors/AppError.js';

export function notFound(req, res, next) {
  next(new NotFoundError(`Маршрут ${req.method} ${req.originalUrl} не найден`));
}