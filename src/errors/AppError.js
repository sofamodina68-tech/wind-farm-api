export class AppError extends Error {
  constructor(message, { statusCode = 500, code = 'INTERNAL_ERROR' } = {}) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Ресурс не найден') {
    super(message, { statusCode: 404, code: 'NOT_FOUND' });
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Некорректные данные запроса', details = []) {
    super(message, { statusCode: 422, code: 'VALIDATION_ERROR' });
    this.details = details;
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Конфликт данных') {
    super(message, { statusCode: 409, code: 'CONFLICT' });
  }
}