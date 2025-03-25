const Joi = require("joi");

const subjectSchema = Joi.object({
  name: Joi.string().min(3).max(50).required().messages({
    "string.empty": "Fan nomi bo‘sh bo‘lishi mumkin emas.",
    "string.min": "Fan nomi kamida 3 ta belgidan iborat bo‘lishi kerak.",
    "string.max": "Fan nomi 50 ta belgidan oshmasligi kerak.",
    "any.required": "Fan nomi majburiy maydon.",
  }),
  img: Joi.string().uri().required().messages({
    "string.empty": "Rasm URL bo‘sh bo‘lishi mumkin emas.",
    "string.uri": "Rasm URL formatda bo‘lishi kerak.",
    "any.required": "Rasm URL majburiy maydon.",
  }),
});

module.exports = { subjectSchema };
