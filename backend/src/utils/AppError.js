class AppError extends Error {
  constructor(statusCode, code, message, details) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    
    this.isOperational = true;
  }

  static badRequest(code, message, details) {
    return new AppError(400, code, message, details);
  }

  static unauthorized(code, message) {
    return new AppError(401, code, message);
  }

  static notFound(resource) {
    return new AppError(404, 'NOT_FOUND', `The requested ${resource} was not found.`);
  }

  static conflict(code, message) {
    return new AppError(409, code, message);
  }
}

module.exports = { AppError };
