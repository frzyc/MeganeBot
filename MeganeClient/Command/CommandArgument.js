const CommandArgumentParseError = require("../Errors/CommandArgumentParseError")
const joi = require("@hapi/joi")
/**
 * A command argument is a "word" after the command. The argument will be retracted from the string and parsed based on its type. The basic unit of an argument is a word without any whitespace.
 * You can also define how many "words" by using the .multiple option.
 */
class CommandArgument {
    /**
     * @typedef {Object} CommandArgumentOptions
     * @property {string} label - Property name of the parsed results in the results object. See {@link CommandArgument#label}.
     * @property {string} [type] - Should corresponding to an existing type, or leave it null for a custom type. See {@link CommandArgument#type}.
     * @property {string} [description] - A description for this argument. See {@link CommandArgument#descriptionString}.
     * @property {number} [max] - The max value. See {@link CommandArgument#max}.
     * @property {number} [min] - The min value. See {@link CommandArgument#min}.
     * @property {*} [default] - The default value. See {@link CommandArgument#default}.
     * @property {integer} [array] - Define how many words this argument uses. See {@link CommandArgument#multiple}
     * @property {function} [validate] - Custom validator. Only when {@link CommandArgumentOptions#type} is null. See {@link CommandArgument#customValidator}.
     * @property {function} [parse] - Custom parser. Only when {@link CommandArgumentOptions#type} is null. See {@link CommandArgument#customParser}.
     */
    static CommandArgumentOptionsSchema = joi.object({
      label: joi.string().required(),
      type: joi.string().lowercase(),
      descriptionString: joi.string(),
      min: joi.number().max(joi.ref("max")),
      max: joi.number().min(joi.ref("min")),
      default: joi.any(),
      array: joi.number().integer().min(0),
      customValidator: joi.func().maxArity(3),
      customParser: joi.func().maxArity(3),
      last: joi.boolean()
    })
      .rename("description", "descriptionString")
      .rename("validate", "customValidator")
      .rename("parse", "customParser")
      .without("type", ["customValidator", "customParser"])
      .xor("type", "customValidator")
      .with("customValidator", "customParser")

    /**
     * Constructor
     * @param {MeganeClient} client
     * @param {CommandArgumentOptions} options
     */
    constructor(client, options) {
      if (!client) throw new Error("The client must be specified for the CommandArgumentOptions.")
      /**
       * A reference to the MeganeClient.
       * @name CommandArgument#client
       * @type {MeganeClient}
       * @readonly
       */
      Object.defineProperty(this, "client", { value: client })

      let result = CommandArgument.CommandArgumentOptionsSchema.validate(options)
      if (result.error) throw result.error
      if (options.type && !client.depot.types.has(result.value.type)) throw new RangeError(`CommandArgumentOptions.type:"${result.value.type}" isn't registered.`)
      Object.assign(this, result.value)

      /**
       * A label to reference the result of this {@link CommandArgument} in the parsed object.
       * @member {string} CommandArgument.label
       */
      /**
       * The description for this {@link CommandArgument}.
       * @member {?string} CommandArgument.descriptionString
       * @private
       */
      /**
       * The min value if {@link CommandArgument#type} is a scaler value, or can be measured by a length.
       * @member {?number} CommandArgument.min
       */
      /**
       * The max value if {@link CommandArgument#type} is a scaler value, or can be measured by a length.
       * @member {?number} CommandArgument.max
       */
      /**
       * The default value for this {@link CommandArgument}.
       * This makes this argument optional.
       * All arguments in {@link Command#args} after this one will need to be optional as well.
       * @member {?Object} CommandArgument.default
       */
      /**
       * The number of values this {@link CommandArgument} parses. This will return the values as an array.
       * The last value of the array will have the remaining string, even if it has multiple words.
       * A value of 0 will convert all the words to an array.
       * If this has a value of 0, it should be the last argument for the {@link Command#args}.
       * Each element of this array will be applied the type validation and parsing individually.
       * @member {?integer} CommandArgument.array 
       */
      /**
       * A customized Validator for a custom type. See {@link Type#validate}.
       * @member {?function} CommandArgument.customValidator
       */
      /**
       * A customized parser for a custom type. See {@link Type#parse}.
       * @member {?function} CommandArgument.customParser
       */
      /**
       * A Whether this is the last argument in the {@link Command#args}.
       * @member {boolean} CommandArgument.last
       */

      /**
       * The {@link Type} for this {@link CommandArgument}. if type is not defined, is is a custom type.
       * @member {Type|"custom"} CommandArgument.type
       */
      this.type = this.type ? client.depot.types.get(this.type) : { id: "custom" }
    }

    /**
     * Validate the {@link Type} of this {@link Argument} against the value/values.
     * @param {string|string[]} value - The value/values to validate.
     * @param {external:Message} msg - The message the value was extracted from.
     * @returns {boolean} - Whether the value is legit.
     */
    async validateType(value, msg) {
      if (typeof value !== "string") return { error: TypeError("type validation is only valid for strings") }
      if (this.customValidator) return await this.customValidator(value, msg, this)
      else return await this.type.validate(value, msg, this)
    }

    /**
     * @typedef validateReturn
     * @param {*} value - The validated values, the validation might have changed them to an intermediate state.
     * @param {*} error - Any failure to validate will be here.
     */

    /**
     * validate values individually against the the {@link Type} of this {@link Argument}.
     * @private
     * @param {string[]} values - The values to validate.
     * @param {msg} msg - The message the values were extracted from.
     * @returns {validateReturn}
     */
    async validate(values, msg) {
      if (typeof this.array === "number") {
        if (!Array.isArray(values) || (this.array && values.length !== this.array))
          return { error: TypeError("Validate expects an array as values") }
        let result = { value: [] }
        for (let value of values) {
          let r = await this.validateType(value, msg)
          if (r.error) return r
          result.value.push(r.value)
        }
        return result
      } else {//remaining or single, both single argument
        return await this.validateType(values, msg)
      }
    }

    /**
     * Parse the {@link Type} of this {@link Argument} against the value/values.
     * @param {*} value - The value/values to parse. Can be an intermediate value from the validate()
     * @param {external:Message} msg - The message the value was extracted from.
     * @returns {object} - The parsed output.
     */
    async parseType(value, msg) {
      if (this.customParser) return await this.customParser(value, msg, this)
      else return await this.type.parse(value, msg, this)
    }

    /**
     * Parse values individually against the the {@link Type} of this {@link Argument}.
     * @private
     * @param {string[]} values - The values to validate.
     * @param {msg} msg - The message the values were extracted from.
     * @returns {object} - The parsed output.
     */
    async parse(values, msg) {
      if (typeof this.array === "number")
        return await Promise.all(values.map(
          async (value) => await this.parseType(value, msg))
        )
      return await this.parseType(values, msg)
    }

    /**
     * @typedef {Object} SeparatedArgs
     * @private
     * @property {string|string[]} result - The parsed string/strings for this argument
     * @property {string} [remaining] - The remaining part of the argString after the arugments have been extracted.
     */

    /**
     * Separate Arguments from the argstring.
     * @private
     * @param {string} argString - The string to parse the argument from.
     * @returns {SeparatedArgs}
     */
    separateArg(argString) {
      let result
      if (this.array === 0) { //keep parsing until the string is over
        let arr = this.constructor.separateString(argString, 0)
        if (arr !== null && arr.length > 0) {
          result = arr
          argString = null
        }
      } else if (this.array) {//get a fixed number of arguments
        let sep = this.constructor.separateString(argString, this.array, this.last)
        if (sep !== null) {
          if (sep.length === this.array + 1)
            argString = sep.pop()
          result = sep
        }
      } else {//single -> get a single argument
        let sep = this.constructor.separateString(argString, 1, this.last)
        if (sep !== null && sep.length > 0) {
          result = sep[0]
          if (sep.length > 1)
            argString = sep[1]
          else argString = null
        }
      }
      if (typeof result === "undefined" && typeof this.default !== "undefined") {
        result = this.default
      } else if (typeof result === "undefined")
        throw new CommandArgumentParseError(`Failed to separate the tokens at **${this.label}**.`)
      return {
        result: result,
        remaining: argString
      }
    }

    /**
     * Separate argCount of arguments from the argstring. Arguments are separated by spaces.
     * @private
     * @param {String} argString - String to parse arguments from.
     * @param {number} [argCount=1] - The number of argumetns to parse. 0 to parse all the tokens into an array.
     * @param {boolean} [last=false] - Whether the last element in the array will have all remaining argstring
     * @returns {?String[]} - The array of parsed strings.
     * Will have length argCount+1 if there are still argString remaining.
     * Returns null if there is a failure.
     */
    static separateString(argString, argCount = 1, last = false) {
      if (!argString) return null
      const re = /\s*(?:("|')([^]*?)\1|(\S+))\s*/g
      const result = []
      let match = []
      if (argCount === 0) {
        while ((match = re.exec(argString))) {
          if (!match) break
          result.push(match[2] || match[3])
        }
      } else {
        for (let i = argCount; i > (last ? 1 : 0); i--) {
          match = re.exec(argString)
          if (!match) return null
          result.push(match[2] || match[3])
        }
      }
      if ((match && re.lastIndex < argString.length) || last) {
        result.push(argString.substr(re.lastIndex))//push the remaining string in case separating argCount doesn't consume its entirety.
      }
      return result
    }

    /**
     * Get the description of this {@link CommandArgument}.
     * @returns {string} - Will return the description, else returns "No description specified.".
     */
    get description() {
      if (!this.descriptionString) return "No description specified."
      return this.descriptionString
    }

    /**
     * Check if {@link CommandArgument} has a description.
     * @returns {boolean}
     */
    hasDescription() {
      if (this.descriptionString) return true
      return false
    }
}
module.exports = CommandArgument
