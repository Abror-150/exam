const Joi = require('joi');

const ResourceValidation = Joi.object({
  name: Joi.string().min(3).required(),
  file: Joi.string().min(3).required().uri(),
  img: Joi.string().uri().required(),
  describtion: Joi.string().min(5),
  link: Joi.string().uri().required(),
  resourceCategoriesId: Joi.number().integer().required(),
});

const ResourcePatchValidation = Joi.object({
  name: Joi.string().min(3).optional().required(),
  file: Joi.string().min(3).optional().required().uri(),
  img: Joi.string().optional().required().uri(),
  describtion: Joi.string().min(5).optional(),
  link: Joi.string().optional().uri(),
  resourceCategoriesId: Joi.number().integer().optional().positive(),
}).min(1);
module.exports = { ResourceValidation, ResourcePatchValidation };
