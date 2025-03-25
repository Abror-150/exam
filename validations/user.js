const Joi = require('joi');

const userValidation = Joi.object({
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  phone: Joi.string()
    .pattern(/^(\+998|998)?(33|55|77|88|90|91|93|94|95|97|98|99)\d{7}$/)
    .required()
    .messages({
      'string.pattern.base':
        'Phone number must be in Uzbekistan format: +998 XX XXX XX XX',
    }),
  password: Joi.string()
    .min(6)
    .max(100)
    .pattern(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    )
    .required()
    .messages({
      'string.pattern.base':
        'Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character',
    }),
  img: Joi.string().uri().optional(),
  role: Joi.string()
    .valid('ADMIN', 'USER', 'SUPER_ADMIN', 'CEO')

    .default('USER'),
  status: Joi.string().optional(),
  lastIp: Joi.string().ip().optional(),
});

const loginValidation = Joi.object({
  firstName: Joi.string().required(),
  password: Joi.string().required(),
});

const otpValidation = Joi.object({
  phone: Joi.string()
    .trim()
    .pattern(/^\+998(33|55|77|88|90|91|93|94|95|97|98|99)\d{7}$/)
    .required()
    .messages({
      'string.pattern.base':
        'Phone number must be in Uzbekistan format: +998 XX XXX XX XX',
      'any.required': 'Phone number is required',
    }),
  otp: Joi.string()
    .trim()
    .pattern(/^\d{4,6}$/)
    .required()
    .messages({
      'string.pattern.base': 'OTP must be a 4 or 6 digit number',
      'any.required': 'OTP is required',
    }),
});

const sendOtpValidation = Joi.object({
  phone: Joi.string()
    .trim()
    .pattern(/^\+998(33|55|77|88|90|91|93|94|95|97|98|99)\d{7}$/)
    .required()
    .messages({
      'string.pattern.base':
        'Phone number must be in Uzbekistan format: +998 XX XXX XX XX',
      'any.required': 'Phone number is required',
    }),
});

const refreshTokenValidation = Joi.object({
  refreshTok: Joi.string().trim().required(),
});

module.exports = {
  userValidation,
  loginValidation,
  otpValidation,
  sendOtpValidation,
  refreshTokenValidation,
};
