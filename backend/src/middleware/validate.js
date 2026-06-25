'use strict';

const { validationResult } = require('express-validator');

/**
 * Reusable middleware that reads express-validator results.
 * Slot this AFTER your validator chains in any route definition.
 * Returns 422 with a structured error array if any validation fails.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: 'error',
      message: 'Validation failed. Check the errors array for details.',
      errors: errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
        value: e.value,
      })),
    });
  }
  next();
};

module.exports = validate;
