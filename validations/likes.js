const Joi = require("joi");

const likeSchema = Joi.object({
  learningCenterId: Joi.number().integer().min(1).required().messages({
    "number.integer": "learningCenterId butun son bo‘lishi kerak.",
    "number.min": "learningCenterId kamida 1 bo‘lishi kerak.",
    "any.required": "learningCenterId majburiy maydon."
  }),
});

module.exports = { likeSchema };