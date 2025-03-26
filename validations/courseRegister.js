<<<<<<< HEAD
const Joi = require('joi');

const CourseRegistervalidation = Joi.object({
  learningCenterId: Joi.number().integer().min(1).required(),
});

module.exports = CourseRegistervalidation;
=======
const Joi = require("joi");

const courseRegisterSchema = Joi.object({
  learningCenterId: Joi.number().integer().min(1).required(),
  branchId: Joi.number().integer().min(1).required(),
});

module.exports = { courseRegisterSchema };
>>>>>>> 46400bdd2d6dde03b75818d4bc3f3166d64603ac
