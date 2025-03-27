const Joi = require('joi');

const ResourceValidation = Joi.object({
  name: Joi.string().min(3).required(),
  file: Joi.string().min(3).required(),
  img: Joi.string().uri().required(),
  describtion: Joi.string().min(5),
  link: Joi.string().uri().required(),
  categoryId: Joi.number().integer().required(),
});
module.exports = ResourceValidation;
