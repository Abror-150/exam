const Joi = require('joi');

const professionSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  img: Joi.string().uri().required(),
});

const professionPatchValidation = Joi.object({
  name: Joi.string(),
  img: Joi.string(),
}).min(1);

module.exports = { professionSchema, professionPatchValidation };
