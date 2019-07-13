const { Type } = require("../")
const joi = require("@hapi/joi")
module.exports = class String extends Type {
  constructor(client) {
    super(client, "string")
  }

    static schema = joi.string().allow("")
    validate(value, msg, arg) {
      let schema = String.schema
      if (typeof arg ==="object" && typeof arg.min ==="number") schema = schema.min(arg.min)
      if (typeof arg ==="object" && typeof arg.max ==="number") schema = schema.max(arg.max)
      return schema.validate(value)
    }

    parse(value) {
      return value
    }
}
