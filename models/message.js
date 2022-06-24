const joi = require('joi');

const messageSchema = joi.object({
    to: joi.string().required().min(1),
    text: joi.string().required().min(1),
    type: joi.string().required().valid('message', 'private_message')
});

module.exports = messageSchema;