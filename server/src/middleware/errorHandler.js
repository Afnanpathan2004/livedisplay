const { logger } = require('../utils/logger');
const { auditLog } = require('../utils/audit');

// Custom error classes for better error handling
class AppError extends Error {
  constructor(message, statusCode, code = null, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND_ERROR');
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Database operation failed', originalError = null) {
    super(message, 500, 'DATABASE_ERROR', originalError?.message);
  }
}

class ExternalServiceError extends AppError {
  constructor(service, message = 'External service unavailable') {
    super(`${service}: ${message}`, 503, 'EXTERNAL_SERVICE_ERROR');
  }
}

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error details
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    body: req.method !== 'GET' ? '[REDACTED]' : undefined,
    query: req.query,
    params: req.params
  };

  // Different logging levels based on error type
  if (error.statusCode >= 500) {
    logger.error('Server Error', errorInfo);
  } else if (error.statusCode >= 400) {
    logger.warn('Client Error', errorInfo);
  } else {
    logger.info('Handled Error', errorInfo);
  }

  // Audit log for security-related errors
  if (error.code === 'AUTHENTICATION_ERROR' || error.code === 'AUTHORIZATION_ERROR') {
    auditLog(
      req.user?.id || 'anonymous',
      'SECURITY_ERROR',
      'authentication',
      null,
      null,
      {
        error: error.message,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.url
      }
    ).catch(auditErr => {
      logger.error('Failed to log security event', { error: auditErr.message });
    });
  }

  // Handle specific error types
  if (err.name === 'CastError') {
    const message = 'Invalid resource ID format';
    error = new ValidationError(message);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} already exists`;
    error = new ConflictError(message);
  }

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(val => val.message);
    error = new ValidationError('Validation failed', errors);
  }

  if (err.name === 'JsonWebTokenError') {
    error = new AuthenticationError('Invalid token');
  }

  if (err.name === 'TokenExpiredError') {
    error = new AuthenticationError('Token expired');
  }

  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    error = new ExternalServiceError('Database', 'Connection failed');
  }

  // PostgreSQL specific errors
  if (err.code === '23505') { // Unique violation
    const field = err.detail?.match(/Key \((.+)\)=/)?.[1] || 'field';
    error = new ConflictError(`${field} already exists`);
  }

  if (err.code === '23503') { // Foreign key violation
    error = new ValidationError('Referenced resource does not exist');
  }

  if (err.code === '23502') { // Not null violation
    const field = err.column || 'field';
    error = new ValidationError(`${field} is required`);
  }

  if (err.code === '42P01') { // Undefined table
    error = new DatabaseError('Database schema error');
  }

  // Default to 500 server error
  if (!error.statusCode) {
    error = new AppError('Something went wrong', 500, 'INTERNAL_ERROR');
  }

  // Send error response
  const response = {
    status: error.status || 'error',
    message: error.message,
    ...(error.code && { code: error.code }),
    ...(error.details && { details: error.details })
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
    response.originalError = err;
  }

  // Include request ID for tracking
  if (req.requestId) {
    response.requestId = req.requestId;
  }

  res.status(error.statusCode || 500).json(response);
};

// 404 handler for undefined routes
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.originalUrl}`);
  next(error);
};

// Async error wrapper to catch async errors
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Global unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection', {
    reason: reason?.message || reason,
    stack: reason?.stack,
    promise: promise.toString()
  });
  
  // Graceful shutdown
  process.exit(1);
});

// Global uncaught exception handler
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    message: error.message,
    stack: error.stack
  });
  
  // Graceful shutdown
  process.exit(1);
});

// Health check error handler
const healthCheckError = (service, error) => {
  logger.error(`Health check failed for ${service}`, {
    service,
    error: error.message,
    stack: error.stack
  });
  
  return {
    service,
    status: 'unhealthy',
    error: error.message,
    timestamp: new Date().toISOString()
  };
};

// Database connection error handler
const dbErrorHandler = (error) => {
  logger.error('Database connection error', {
    error: error.message,
    code: error.code,
    stack: error.stack
  });
  
  // Attempt reconnection logic here if needed
  return new DatabaseError('Database connection failed', error);
};

// Rate limit error handler
const rateLimitHandler = (req, res) => {
  const error = new RateLimitError('Too many requests, please try again later');
  
  logger.warn('Rate limit exceeded', {
    ip: req.ip,
    url: req.url,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  });
  
  res.status(429).json({
    status: 'error',
    message: error.message,
    code: error.code,
    retryAfter: 60 // seconds
  });
};

// Validation error formatter
const formatValidationErrors = (errors) => {
  if (Array.isArray(errors)) {
    return errors.map(err => ({
      field: err.path?.join('.') || 'unknown',
      message: err.message,
      value: err.value
    }));
  }
  
  if (typeof errors === 'object') {
    return Object.keys(errors).map(key => ({
      field: key,
      message: errors[key],
      value: undefined
    }));
  }
  
  return [{ field: 'unknown', message: errors, value: undefined }];
};

// Security error handler
const securityErrorHandler = (type, req, details = {}) => {
  const errorInfo = {
    type,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    url: req.url,
    method: req.method,
    userId: req.user?.id,
    timestamp: new Date().toISOString(),
    ...details
  };
  
  logger.warn('Security event detected', errorInfo);
  
  // Log to security audit trail
  auditLog(
    req.user?.id || 'anonymous',
    'SECURITY_EVENT',
    type,
    null,
    null,
    errorInfo
  ).catch(auditErr => {
    logger.error('Failed to log security event', { error: auditErr.message });
  });
  
  return errorInfo;
};

module.exports = {
  // Error classes
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  ExternalServiceError,
  
  // Middleware
  errorHandler,
  notFoundHandler,
  asyncHandler,
  
  // Specialized handlers
  healthCheckError,
  dbErrorHandler,
  rateLimitHandler,
  formatValidationErrors,
  securityErrorHandler
};
