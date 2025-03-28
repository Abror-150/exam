const Joi = require('joi');

const subjectSchema = Joi.object({
  name: Joi.string().min(3).max(50).required(),
  img: Joi.string().uri().required(),
});
const subjectPatchValidation = Joi.object({
  name: Joi.string().min(3),
  img: Joi.string().uri(),
});

module.exports = { subjectSchema, subjectPatchValidation };
