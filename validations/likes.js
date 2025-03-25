const Joi = require('joi');

const likeSchema = Joi.object({
  learningCenterId: Joi.number().integer().min(1).required(),
});

module.exports = { likeSchema };
