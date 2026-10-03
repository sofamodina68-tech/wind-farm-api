export class AppError extends Error {
  constructor(code, message, details) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    if (details) this.details = details;
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Ресурс не найден') {
    super('NOT_FOUND', message);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Конфликт данных') {
    super('CONFLICT', message);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Некорректные данные запроса', details = []) {
    super('VALIDATION_ERROR', message, details);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Некорректный запрос', details = []) {
    super('BAD_REQUEST', message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Требуется авторизация') {
    super('UNAUTHORIZED', message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Недостаточно прав для выполнения операции') {
    super('FORBIDDEN', message);
  }
}

export class ExternalServiceError extends AppError {
  constructor(code, message) {
    super(code, message);
  }
}