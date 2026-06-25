'use strict';

/**
 * 404 Not Found handler.
 * Must be registered AFTER all routes but BEFORE the error handler.
 * Any request that reaches this middleware did not match any route.
 */
const notFound = (req, _res, next) => {
  const err = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  err.statusCode = 404;
  next(err); // Pass to global errorHandler
};

module.exports = notFound;
