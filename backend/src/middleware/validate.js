const { AppError } = require('../utils/AppError');

const SOURCES = ['params', 'query', 'body'];

function fieldPath(path) {
  return path.length > 0 ? path.join('.') : '_root';
}

/**
 * Validates the requested parts of a request against zod schemas and replaces
 * them with the parsed result, so controllers receive coerced values.
 *
 * Express defines `query` as a getter on the request prototype, which a plain
 * assignment cannot shadow - defineProperty is used instead.
 */
function validate(schemas) {
  return (req, res, next) => {
    const details = [];

    for (const source of SOURCES) {
      const schema = schemas[source];
      if (!schema) continue;

      const result = schema.safeParse(req[source]);
      if (result.success) {
        Object.defineProperty(req, source, {
          value: result.data,
          writable: true,
          configurable: true,
          enumerable: true,
        });
        continue;
      }

      for (const issue of result.error.issues) {
        details.push({ field: fieldPath(issue.path), message: issue.message });
      }
    }

    if (details.length > 0) {
      next(AppError.badRequest('VALIDATION_ERROR', 'Request validation failed.', details));
      return;
    }

    next();
  };
}

module.exports = { validate };
