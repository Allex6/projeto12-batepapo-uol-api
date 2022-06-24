const joi = require('joi');

const userSchema = joi.object({
    name: joi.string().required().min(1).max(30),
    lastStatus: joi.number().required()
});

module.exports = userSchema;