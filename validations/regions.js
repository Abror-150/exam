const Joi = require('joi');

const regionValidation = Joi.object({
  name: Joi.string()
    .min(3)
    .max(100)
    .pattern(/^[a-zA-Z\s]+$/)
    .required(),
});

module.exports = regionValidation;
