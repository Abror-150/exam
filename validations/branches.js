const Joi = require('joi');
const branchesValidation = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  phone: Joi.string()
    .pattern(/^\+?\d{9,15}$/)
    .required(),
  img: Joi.string().uri().required(),
  regionId: Joi.number().integer().required(),
  address: Joi.string().min(5).max(500).required(),
  learningCenterId: Joi.number().integer().required().positive(),
  professionsId: Joi.array().items(Joi.number().integer()),
  subjectId: Joi.array().items(Joi.number().integer()),
});

const branchesValidationPatch = Joi.object({
  name: Joi.string().min(3).max(100),
  phone: Joi.string().pattern(/^\+?\d{9,15}$/),
  img: Joi.string().uri(),
  regionId: Joi.number().integer().positive(),
  address: Joi.string().min(5).max(500),
  learningCenterId: Joi.number().integer().positive(),
  professionId: Joi.array().items(Joi.number().integer()),
  subjectId: Joi.array().items(Joi.number().integer()),
})
  .min(1)
  .unknown(true);

module.exports = { branchesValidation, branchesValidationPatch };
