const Joi = require('joi');
const branchesValidation = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  phone: Joi.string()
    .pattern(/^\+?\d{9,15}$/)
    .required(),
  img: Joi.string().uri().required(),
  regionId: Joi.number().integer().required(),
  address: Joi.string().min(5).max(500).required(),
  learningCenterId: Joi.number().integer().required(),
  professionsId: Joi.array().items(Joi.number().integer()),
  subjectsId: Joi.array().items(Joi.number().integer()),
});

const validateBranchUpdate = (data) => {
  return branchesValidation
    .fork(Object.keys(data), (schema) => schema.optional())
    .min(1)
    .validate(data);
};
module.exports = { branchesValidation, validateBranchUpdate };
