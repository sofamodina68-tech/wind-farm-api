import {
  UniqueConstraintError,
  ForeignKeyConstraintError,
  ValidationError as SequelizeValidationError,
} from 'sequelize';
import {
  AppError,
  BadRequestError,
  ValidationError,
  NotFoundError,
  ConflictError,
} from '../errors/AppError.js';
import { config } from '../config/index.js';

const STATUS_MAP = {
  BAD_REQUEST: 400,
  VALIDATION_ERROR: 422,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  PAYLOAD_TOO_LARGE: 413,
  INVALID_JSON: 400,
  BAD_GATEWAY: 502,
  GATEWAY_TIMEOUT: 504,
  INTERNAL_ERROR: 500,
};

export function errorHandler(err, req, res, _next) {
  if (res.headersSent) return _next(err);

  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Внутренняя ошибка сервера';
  let details;

  if (err instanceof UniqueConstraintError) {
    statusCode = 409;
    code = 'CONFLICT';
    message = 'Нарушение уникальности: запись с такими данными уже существует';
    details = err.errors?.map((e) => ({
      field: e.path,
      message: e.message,
    }));
  } else if (err instanceof ForeignKeyConstraintError) {
    statusCode = 404;
    code = 'NOT_FOUND';
    message = 'Связанная запись не найдена';
  } else if (err instanceof SequelizeValidationError) {
    statusCode = 422;
    code = 'VALIDATION_ERROR';
    message = 'Данные не прошли валидацию';
    details = err.errors?.map((e) => ({
      field: e.path,
      message: e.message,
    }));
  } else if (err instanceof AppError) {
    code = err.code;
    statusCode = STATUS_MAP[err.code] ?? 500;
    message = err.message;
    details = err.details;
  } else if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    code = 'INVALID_JSON';
    message = 'Тело запроса не является корректным JSON';
  } else if (err.type === 'entity.too.large') {
    statusCode = 413;
    code = 'PAYLOAD_TOO_LARGE';
    message = 'Тело запроса превышает допустимый размер';
  }

  const logLevel = statusCode >= 500 ? 'ERROR' : 'WARN';
  console.error(
    `[${logLevel}] reqId=${req.id} code=${code} ${err.message}${
      statusCode >= 500 ? `\n${err.stack}` : ''
    }`,
  );

  const body = {
    error: {
      code,
      message:
        statusCode >= 500 && config.nodeEnv === 'production'
          ? 'Внутренняя ошибка сервера'
          : message,
      requestId: req.id,
    },
  };

  if (details) body.error.details = details;

  res.status(statusCode).json(body);
}