const { body, validationResult } = require('express-validator');

// Runs after the rule chains below and turns any failures into a single,
// consistent 400 response — instead of routes hitting a raw Mongoose
// ValidationError and returning a 500 with an internal error message.
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// Indian mobile numbers: optional +91, then 10 digits starting 6-9.
// Loosened slightly (allows a plain 10-digit or +country code) since
// Twilio numbers used in testing may differ — adjust if you support
// international users.
const phoneRule = body('phone')
  .trim()
  .matches(/^\+?[0-9]{10,15}$/)
  .withMessage('Enter a valid phone number');

exports.validateRegister = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  phoneRule,
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('Enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('bloodGroup').optional({ values: 'falsy' }).isIn(['A+','A-','B+','B-','AB+','AB-','O+','O-']).withMessage('Invalid blood group'),
  body('medicalInfo').optional({ values: 'falsy' }).trim().isLength({ max: 500 }).withMessage('Medical info too long'),
  handleValidation,
];

exports.validateLogin = [
  phoneRule,
  body('password').notEmpty().withMessage('Password is required'),
  handleValidation,
];

exports.validateLocation = [
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  handleValidation,
];

exports.validateProfileUpdate = [
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('bloodGroup').optional({ values: 'falsy' }).isIn(['A+','A-','B+','B-','AB+','AB-','O+','O-']).withMessage('Invalid blood group'),
  body('medicalInfo').optional({ values: 'falsy' }).trim().isLength({ max: 500 }).withMessage('Medical info too long'),
  handleValidation,
];

exports.validateEmergencyTrigger = [
  body('type').isIn(['medical', 'accident', 'fire', 'crime', 'natural_disaster', 'other']).withMessage('Invalid emergency type'),
  body('severity').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid severity'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('description').optional({ values: 'falsy' }).trim().isLength({ max: 1000 }).withMessage('Description too long'),
  handleValidation,
];

exports.validateContact = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  phoneRule,
  body('relation').optional({ values: 'falsy' }).trim().isLength({ max: 50 }),
  handleValidation,
];

exports.validateMessage = [
  body('text').trim().isLength({ min: 1, max: 1000 }).withMessage('Message must be 1-1000 characters'),
  handleValidation,
];

exports.validateCheckIn = [
  body('durationMinutes').isInt({ min: 1, max: 180 }).withMessage('Duration must be between 1 and 180 minutes'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('label').optional({ values: 'falsy' }).trim().isLength({ max: 100 }).withMessage('Label too long'),
  handleValidation,
];

exports.validateCheckInExtend = [
  body('additionalMinutes').isInt({ min: 1, max: 180 }).withMessage('Extension must be between 1 and 180 minutes'),
  handleValidation,
];

exports.validateDonorStatus = [
  body('isDonor').isBoolean().withMessage('isDonor must be true or false'),
  body('lastDonationDate').optional({ values: 'falsy' }).isISO8601().withMessage('Invalid date format'),
  handleValidation,
];

exports.validateSetVerified = [
  body('isVerified').isBoolean().withMessage('isVerified must be true or false'),
  handleValidation,
];

exports.validateRating = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  handleValidation,
];
