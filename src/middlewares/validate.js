import { BadRequestError, ValidationError } from '../errors/AppError.js';

export function validate(schemas) {
  return (req, res, next) => {
    const errors = {
      params: [],
      query: [],
      body: [],
    };

    const validated = {};

    for (const [part, schema] of Object.entries(schemas)) {
      if (!schema) continue;

      const { error, value } = schema.validate(req[part], {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
      });

      if (error) {
        errors[part] = error.details.map((d) => ({
          field: d.path.join('.') || part,
          message: d.message,
        }));
      } else {
        validated[part] = value;
      }
    }

    // params и query — это про структуру запроса → 400
    const structuralProblems = [...errors.params, ...errors.query];
    if (structuralProblems.length > 0) {
      return next(
        new BadRequestError('Некорректные параметры запроса', structuralProblems),
      );
    }

    // body — это про данные → 422
    if (errors.body.length > 0) {
      return next(
        new ValidationError('Некорректные данные запроса', errors.body),
      );
    }

    req.validated = validated;
    next();
  };
}