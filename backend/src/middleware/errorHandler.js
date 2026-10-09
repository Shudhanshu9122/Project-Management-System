const logger = require('../config/logger');
const { AppError } = require('../utils/AppError');


const POSTGRES_CODES = {
  23505: { statusCode: 409, code: 'DUPLICATE_RESOURCE', message: 'A record with these details already exists.' },
  23503: { statusCode: 409, code: 'REFERENCE_VIOLATION', message: 'The referenced record does not exist.' },
  23514: { statusCode: 400, code: 'CHECK_VIOLATION', message: 'The submitted values violate a database constraint.' },
  '22P02': { statusCode: 400, code: 'INVALID_INPUT', message: 'One of the submitted values has an invalid format.' },
};

function mapError(error) {
  if (error instanceof AppError) return error;

  
  if (error.type === 'entity.parse.failed') {
    return AppError.badRequest('INVALID_JSON', 'Request body is not valid JSON.');
  }
  if (error.type === 'entity.too.large') {
    return new AppError(413, 'PAYLOAD_TOO_LARGE', 'Request body is too large.');
  }

  const mapped = POSTGRES_CODES[error.code];
  if (mapped) return new AppError(mapped.statusCode, mapped.code, mapped.message);

  return new AppError(500, 'INTERNAL_ERROR', 'Something went wrong. Please try again later.');
}


function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    next(error);
    return;
  }

  const mapped = mapError(error);
  const context = `${req.method} ${req.originalUrl}`;

  
  
  if (mapped.statusCode >= 500) {
    logger.error(`${context} failed: ${error.message}`, { stack: error.stack });
  } else if (!(error instanceof AppError)) {
    logger.warn(`${context} rejected by ${mapped.code}: ${error.message}`);
  }

  const body = { error: { code: mapped.code, message: mapped.message } };
  if (mapped.details) body.error.details = mapped.details;

  res.status(mapped.statusCode).json(body);
}

module.exports = { errorHandler };
