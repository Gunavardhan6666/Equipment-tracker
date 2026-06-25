'use strict';

/**
 * Global Express error handler.
 * Must be registered LAST with app.use() — after all routes.
 *
 * Catches errors thrown by:
 *  - route handlers (via next(err))
 *  - async middleware (via express-async-errors or try/catch + next(err))
 *
 * Returns a consistent JSON error shape:
 * {
 *   status:  'error',
 *   message: string,
 *   ...(development only) stack: string
 * }
 */
const errorHandler = (err, _req, res, _next) => {
  // Default to 500 if no status code was set on the error
  const statusCode = err.statusCode || err.status || 500;

  // Log the full error server-side
  if (statusCode >= 500) {
    console.error(`[ERROR ${statusCode}]`, err.message);
    console.error(err.stack);
  } else {
    // 4xx errors are operational — log at lower severity
    console.warn(`[WARN ${statusCode}]`, err.message);
  }

  const response = {
    status: 'error',
    message: err.message || 'An unexpected error occurred.',
  };

  // Expose stack trace only in development
  if (process.env.NODE_ENV === 'development' && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
