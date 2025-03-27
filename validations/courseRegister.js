const Joi = require('joi');

const CourseRegistervalidation = Joi.object({
  learningCenterId: Joi.number().integer().min(1).required(),
  branchId: Joi.number().required(),
});

module.exports = CourseRegistervalidation;
