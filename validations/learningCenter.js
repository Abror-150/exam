const Joi = require('joi');

const learningCenterValidation = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  phone: Joi.string()
    .pattern(/^\+?\d{9,15}$/)
    .required(),
  img: Joi.string().uri().allow(null).required(),
  regionId: Joi.number().integer().positive().required(),
  address: Joi.string().min(5).max(255).required(),
  // branchNumber: Joi.number().integer(),

  professionsId: Joi.array().items(Joi.number().integer()),
  subjects: Joi.array().items(Joi.number().integer()),
});

const learningCenterValidationPatch = Joi.object({
  name: Joi.string().min(3).max(100),
  phone: Joi.string().pattern(/^\+?\d{9,15}$/),
  img: Joi.string().uri().allow(null),
  regionId: Joi.number().integer().positive(),
  address: Joi.string().min(5).max(255),
  // branchNumber: Joi.number().integer(),

  professionsId: Joi.array().items(Joi.number().integer()),
  subjectsId: Joi.array().items(Joi.number().integer()),
}).min(1);

module.exports = { learningCenterValidation, learningCenterValidationPatch };
