const Joi = require("joi");

const regionSchema = Joi.object({
  name: Joi.string().min(3).max(50).required().messages({
    "string.empty": "Nomi bo‘sh bo‘lishi mumkin emas.",
    "string.min": "Nomi kamida 3 ta belgidan iborat bo‘lishi kerak.",
    "string.max": "Nomi 50 ta belgidan oshmasligi kerak.",
    "any.required": "Nomi majburiy berish kerak.",
  }),
});

module.exports = { regionSchema };
