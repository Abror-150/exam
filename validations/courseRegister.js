const Joi = require("joi");

const courseRegisterSchema = Joi.object({
  learningCenterId: Joi.number().integer().min(1).required(),
  branchId: Joi.number().integer().min(1).required(),
});

module.exports = { courseRegisterSchema };
