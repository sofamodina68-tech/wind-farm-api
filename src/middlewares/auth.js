import jwt from 'jsonwebtoken';
import process from 'node:process';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;

/**
 * Проверяет access-токен и кладёт пользователя в req.user.
 * Без токена или с невалидным — 401.
 */
export function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Требуется авторизация',
        requestId: req.id,
      },
    });
  }

  const token = header.slice('Bearer '.length).trim();
  try {
    const payload = jwt.verify(token, ACCESS_SECRET);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      technicianId: payload.technicianId ?? null,
    };
    return next();
  } catch {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Недействительный или истёкший токен',
        requestId: req.id,
      },
    });
  }
}

/**
 * Проверяет, что роль пользователя входит в разрешённый список.
 * 403, если роль не подходит.
 */
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Требуется авторизация',
          requestId: req.id,
        },
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Недостаточно прав для выполнения операции',
          requestId: req.id,
        },
      });
    }

    return next();
  };
}