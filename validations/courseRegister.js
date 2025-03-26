const Joi = require('joi');

const CourseRegistervalidation = Joi.object({
  learningCenterId: Joi.number().integer().min(1).required(),
});

module.exports = CourseRegistervalidation;
