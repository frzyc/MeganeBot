const { Type } = require("../")
const joi = require("@hapi/joi")
module.exports = class Float extends Type {
  constructor(client) {
    super(client, "float")
  }
    static schema = joi.number().label("float")
    validate(value, msg, arg) {
      let schema = Float.schema
      if (typeof arg ==="object" && typeof arg.min ==="number") schema = schema.min(arg.min)
      if (typeof arg ==="object" && typeof arg.max ==="number") schema = schema.max(arg.max)
      return schema.validate(value)
    }

    parse(value) {
      return value
    }
}
