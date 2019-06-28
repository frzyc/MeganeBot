const Type = require("./Type")
const joi = require("@hapi/joi")
module.exports = class String extends Type {
    constructor(client) {
        super(client, "string")
    }

    static schema = joi.string()
    validate(value, msg, arg) {
        let schema = this.schema
        if (arg.min) schema.min(arg.min)
        if (arg.max) schema.max(arg.max)
        return schema.validate(value)
    }

    parse(value) {
        return value
    }
}