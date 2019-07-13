const { Type } = require("../")
const joi = require("@hapi/joi")
module.exports = class Boolean extends Type {
  constructor(client) {
    super(client, "boolean")
  }
    static truthyArr = ["true", "t", "yes", "y", "on", "enable", "enabled", "1", "+"]
    static falsyArr = ["false", "f", "no", "n", "off", "disable", "disabled", "0", "-"]
    static schema = joi.boolean()
      .truthy(Boolean.truthyArr)
      .falsy(Boolean.falsyArr)
      .insensitive()
    validate(value) {
      return Boolean.schema.validate(value)
    }

    parse(value) {
      return value
    }
}
