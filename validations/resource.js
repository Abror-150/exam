const Joi = require('joi');

const ResourceValidation = Joi.object({
  name: Joi.string().min(3).required(),
  file: Joi.string().min(3).required().uri(),
  img: Joi.string().uri().required(),
  describtion: Joi.string().min(5),
  link: Joi.string().uri().required(),
  categoryId: Joi.number().integer().required(),
});

const ResourcePatchValidation = Joi.object({
  name: Joi.string().min(3).optional(),
  file: Joi.string().min(3).optional(),
  img: Joi.string().optional(),
  describtion: Joi.string().min(5).optional(),
  link: Joi.string().optional(),
  categoryId: Joi.number().integer().optional(),
}).min(1);
module.exports = { ResourceValidation, ResourcePatchValidation };
