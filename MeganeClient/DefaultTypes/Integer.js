const Type = require("./Type")
const joi = require("@hapi/joi")
module.exports = class Integer extends Type {
    constructor(client) {
        super(client, "integer")
    }
    static schema = joi.number().integer().label("integer")
    validate(value, msg, arg) {
        let schema = Integer.schema
        if (typeof arg ==="object" && typeof arg.min ==="number") schema = schema.min(arg.min)
        if (typeof arg ==="object" && typeof arg.max ==="number") schema = schema.max(arg.max)
        return schema.validate(value)
    }

    parse(value) {
        return value
    }
}
