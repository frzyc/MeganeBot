const Type = require("./Type")
module.exports = class String extends Type {
    constructor(client) {
        super(client, "string")
    }

    validate(value, msg, arg) {
        return Boolean(value) &&
			(arg.min === null || typeof arg.min === "undefined" || value.length >= arg.min) &&
			(arg.max === null || typeof arg.max === "undefined" || value.length <= arg.max)
    }

    parse(value) {
        return value
    }
}