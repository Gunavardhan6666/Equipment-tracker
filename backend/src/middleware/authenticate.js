'use strict';

const jwt = require('jsonwebtoken');

// ─── verifyToken ─────────────────────────────────────────────────────────────
/**
 * Middleware: reads and verifies the Bearer JWT from the Authorization header.
 * On success, attaches the decoded payload to req.user.
 * On failure, responds with 401 Unauthorized.
 *
 * Usage: router.post('/route', verifyToken, controller)
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status:  'error',
      message: 'Authentication required. Please log in to continue.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, role, full_name, iat, exp }
    next();
  } catch (err) {
    const isExpired = err.name === 'TokenExpiredError';
    return res.status(401).json({
      status:  'error',
      message: isExpired
        ? 'Your session has expired. Please log in again.'
        : 'Invalid authentication token.',
    });
  }
};

module.exports = { verifyToken };
