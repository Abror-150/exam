const Joi = require('joi');

const ResourceCategoryValidation = Joi.object({
  name: Joi.string().min(3).max(25).required(),
  img: Joi.string().uri().required(),
});

const ResourceCategoryValidationPatch = Joi.object({
  name: Joi.string(),
  img: Joi.string(),
}).min(1);

module.exports = {
  ResourceCategoryValidation,
  ResourceCategoryValidationPatch,
};
