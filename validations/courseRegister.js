const Joi = require('joi');

const CourseRegistervalidation = Joi.object({
  learningCenterId: Joi.number().integer().min(1).required(),
  branchId: Joi.number().required(),
});

const CourseRegistervalidationPatch = Joi.object({
  learningCenterId: Joi.number().integer(),
  branchId: Joi.number(),
}).min(1);

module.exports = { CourseRegistervalidation, CourseRegistervalidationPatch };
