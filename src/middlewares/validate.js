import { ValidationError } from '../errors/AppError.js';

export function validate(schemas) {
  return (req, res, next) => {
    const errors = [];

    for (const [part, schema] of Object.entries(schemas)) {
      if (!schema) continue;
      const { error, value } = schema.validate(req[part], {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
      });

      if (error) {
        errors.push(
          ...error.details.map((d) => ({
            field: d.path.join('.'),
            message: d.message,
          })),
        );
      } else {
        req[part] = value;
      }
    }

    if (errors.length > 0) {
      return next(new ValidationError('Некорректные данные запроса', errors));
    }
    next();
  };
}