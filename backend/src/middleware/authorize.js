'use strict';

// ─── requireRole ─────────────────────────────────────────────────────────────
/**
 * Middleware factory: checks that req.user.role is one of the allowed roles.
 * Must be used AFTER verifyToken (requires req.user to be populated).
 *
 * Usage: router.patch('/route', verifyToken, requireRole('admin', 'professor'), controller)
 *
 * @param {...string} roles - Allowed roles (e.g. 'admin', 'professor', 'student')
 * @returns {function} Express middleware
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    // Should never happen if verifyToken runs first, but guard defensively
    return res.status(401).json({
      status:  'error',
      message: 'Authentication required.',
    });
  }

  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      status:  'error',
      message: `Access denied. This action requires one of the following roles: ${roles.join(', ')}.`,
    });
  }

  next();
};

module.exports = { requireRole };
