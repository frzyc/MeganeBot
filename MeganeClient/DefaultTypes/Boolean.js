const Type = require("./Type")
const joi = require("@hapi/joi")
module.exports = class Boolean extends Type {
    constructor(client) {
        super(client, "boolean")
        this.truthy = new Set()
        this.falsy = new Set()
    }
    static schema = joi.boolean()
        .truthy(["true", "t", "yes", "y", "on", "enable", "enabled", "1", "+"])
        .falsy(["false", "f", "no", "n", "off", "disable", "disabled", "0", "-"])
        .insensitive()
    validate(value) {
        return this.schema.validate(value)
    }

    parse(value) {
        return value
    }
}