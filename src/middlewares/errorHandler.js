import { AppError } from '../errors/AppError.js';
import { config } from '../config/index.js';

export function errorHandler(err, req, res, _next) {
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;
  const code = isAppError ? err.code : 'INTERNAL_ERROR';

  const logLevel = statusCode >= 500 ? 'ERROR' : 'WARN';
  console.error(
    `[${logLevel}] reqId=${req.id} ${err.message}${
      statusCode >= 500 ? `\n${err.stack}` : ''
    }`,
  );

  const body = {
    error: {
      code,
      message:
        statusCode >= 500 && config.nodeEnv === 'production'
          ? 'Внутренняя ошибка сервера'
          : err.message,
      requestId: req.id,
    },
  };

  if (isAppError && err.details) body.error.details = err.details;

  res.status(statusCode).json(body);
}