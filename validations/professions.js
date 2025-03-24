const Joi = require("joi");

const professionSchema = Joi.object({
  name: Joi.string().min(3).max(100).required().messages({
    "string.base": "Kasb nomi matn bo‘lishi kerak.",
    "string.min": "Kasb nomi kamida 3 ta belgidan iborat bo‘lishi kerak.",
    "string.max": "Kasb nomi 100 ta belgidan oshmasligi kerak.",
    "any.required": "Kasb nomi majburiy maydon."
  }),
  img: Joi.string().uri().required().messages({
    "string.base": "Rasm manzili matn bo‘lishi kerak.",
    "string.uri": "Rasm manzili URL formatida bo‘lishi kerak.",
    "any.required": "Rasm manzili majburiy maydon."
  })
});

module.exports = { professionSchema };