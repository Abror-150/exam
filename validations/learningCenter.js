const Joi = require('joi');

const learningCenterValidation = Joi.object({
  name: Joi.string().min(3).max(100).required(),

  phone: Joi.string()
    .pattern(/^\+?\d{9,15}$/)
    .required(),
  img: Joi.string().uri().required(),
  regionId: Joi.number().integer().positive().required(),

  address: Joi.string().min(5).max(255).required(),

  branchNumber: Joi.number().required(),
});

module.exports = learningCenterValidation;
