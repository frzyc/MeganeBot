const CommandArgumentParseError = require("../Errors/CommandArgumentParseError")
class CommandArgument {
    /**
     * @typedef {Object} CommandArgumentOptions
     * @property {string} [type] - Should corresponding to an existing type, or leave it null for a custom type. See {@link CommandArgument#type}.
     * @property {string} label - Property value of the parsed results in the results object. See {@link CommandArgument#label}.
     * @property {string} [description] - A description for this argument. See {@link CommandArgument#descriptionString}.
     * @property {number} [max] - The max value. See {@link CommandArgument#max}.
     * @property {number} [min] - The min value. See {@link CommandArgument#min}.
     * @property {*} [default] - The default value. See {@link CommandArgument#default}.
     * @property {number} [quantity] - Retrieve a set quantitiy of values. Needs to be a whole number. Mutually exclusive from {@link CommandArgument#multiple}|{@link CommandArgument#remaining}. See {@link CommandArgument#quantity}.
     * @property {boolean} [multiple] - Retrieve several values. Mutually exclusive from {@link CommandArgument#quantity}|{@link CommandArgument#remaining}. See {@link CommandArgument#multiple}.
     * @property {boolean} [remaining] - Retrieve the last remaining string of input. Mutually exclusive from {@link CommandArgument#quantity}|{@link CommandArgument#multiple}. See {@link CommandArgument#remaining}.
     * @property {function} [validate] - Custom validator. Only when {@link CommandArgumentOptions#type} is null. See {@link CommandArgument#customValidator}.
     * @property {function} [parse] - Custom parser. Only when {@link CommandArgumentOptions#type} is null. See {@link CommandArgument#customParser}.
     */

    /**
     * Constructor
     * @param {MeganeClient} client
     * @param {CommandArgumentOptions} options
     */
    constructor(client, options) {
        this.constructor.preCheck(client, options)
        /**
         * A reference to the MeganeClient.
         * @name CommandArgument#client
         * @type {MeganeClient}
         * @readonly
         */
        Object.defineProperty(this, "client", { value: client })

        /**
         * A label to reference this {@link CommandArgument} in the parsed object.
         * @type {string}
         */
        this.label = options.label

        /**
         * The {@link Type} for this {@link CommandArgument}.
         * @type {Type|"custom"}
         */
        this.type = options.type ? client.depot.types.get(options.type) : { id: "custom" }//if type is not defined, is is a custom type.

        /**
         * The description for this {@link CommandArgument}.
         * @type {?string}
         */
        this.descriptionString = options.description || null

        /**
         * The min value if {@link CommandArgument#type} is a scaler value, or can be measured by a length.
         * @type {?number}
         */
        this.min = options.min !== undefined ? options.min : null

        /**
         * The max value if {@link CommandArgument#type} is a scaler value, or can be measured by a length.
         * @type {?number}
         */
        this.max = options.max !== undefined ? options.max : null

        /**
         * The default value for this {@link CommandArgument}.
         * This makes this argument optional.
         * All arguments in {@link Command#args} after this one will need to be optional as well.
         * @type {?Object}
         */
        this.default = options.default

        /**
         * The number of values this {@link CommandArgument} parses.
         * This will return the values as an array.
         * @type {?number}
         */
        this.quantity = options.quantity !== undefined ? options.quantity : null

        /**
         * This will keep parsing arguments until the end of the arugment string.
         * This will return the values as an array.
         * Must be the last argument for the {@link Command#args}.
         * only applicable if true.
         * @type {?boolean}
         */
        this.multiple = options.multiple !== undefined ? options.multiple : null

        /**
         * This will dump the remaining argument string into one argument.
         * Must be the last argument for the {@link Command#args}.
         * only applicable if true.
         * @type {?boolean}
         */
        this.remaining = options.remaining !== undefined ? options.remaining : null

        /**
         * A customized Validator for a custom type. See {@link Type#validate}.
         * @type {?function}
         */
        this.customValidator = options.validate || null

        /**
         * A customized parser for a custom type. See {@link Type#parse}.
         * @type {?function}
         */
        this.customParser = options.parse || null
    }

    /**
     * Validate the {@link Type} of this {@link Argument} against the value/values.
     * @param {string|string[]} value - The value/values to validate.
     * @param {external:Message} msg - The message the value was extracted from.
     * @returns {boolean} - Whether the value is legit.
     */
    async validateType(value, msg) {
        if (typeof value !== "string") return TypeError("type validation is only valid for strings")
        if (this.customValidator) return await this.customValidator(value, msg, this)
        else return await this.type.validate(value, msg, this)
    }

    /**
     * validate values individually against the the {@link Type} of this {@link Argument}.
     * @private
     * @param {string[]} values - The values to validate.
     * @param {msg} msg - The message the values were extracted from.
     * @returns {boolean} - Returns true if all valuse are legit.
     */
    async validate(values, msg) {
        if (this.multiple || this.quantity) {
            if (!Array.isArray(values) || (this.quantity && values.length !== this.quantity))
                throw Error(`Failed to validate argument ${this.label}.`)
            for (let value of values) {
                if (!await this.validateType(value, msg))
                    return false
            }
        } else {//remaining or single, both single argument
            return await this.validateType(values, msg)
        }
        return true
    }

    /**
     * Parse the {@link Type} of this {@link Argument} against the value/values.
     * @param {string|string[]} value - The value/values to validate.
     * @param {external:Message} msg - The message the value was extracted from.
     * @returns {object} - The parsed output.
     */
    async parseType(value, msg) {
        if (typeof value !== "string") return TypeError("type parsing is only valid for strings")
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
        if (this.multiple || this.quantity) {
            if (!Array.isArray(values) || (this.quantity && values.length !== this.quantity))
                throw Error(`Failed to validate argument ${this.label}.`)
            return await Promise.all(values.map(
                async (value) => await this.parseType(value, msg))
            )
        } else {//remaining or single, both single argument
            return await this.parseType(values, msg)
        }
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
        if (!argString) {//means we ran out of the argument string to parse, but an argument still havent been parsed.
            if (typeof this.default !== "undefined") {//allow for "" and null and 0 and such falsy values
                result = this.default
            } else throw new CommandArgumentParseError(`Ran out of arguments to separate at **${this.label}**.`)
        } else if (this.multiple) {//multiple -> keep parsing until the string is over
            let arr = []
            while (argString) {
                //keep splitting until argString is nothing.
                let sep = this.constructor.separateString(argString, 1)
                if (!sep) break
                if (sep.length > 0)
                    arr.push(sep[0])
                if (sep.length > 1) argString = sep[1]
                else argString = null
            }
            if (arr.length === 0) throw new CommandArgumentParseError(`Failed to separate arguments at **${this.label}**.`)
            result = arr
        } else if (this.remaining) {//remaining -> just give the whole remaining string to the arg
            result = argString
        } else if (this.quantity) {//quantitiy -> get a fixed number of arguments
            result[this.label] = []
            let sep = this.constructor.separateString(argString, this.quantity)
            if (!sep) throw new CommandArgumentParseError(`Cannot separate ${this.quantity} arguments at **${this.label}**.`)
            if (sep.length > this.quantity)
                argString = sep.pop()
            result = sep
        } else {//single -> get a single argument
            let sep = this.constructor.separateString(argString, 1)
            if (!sep || sep.length === 0) throw new CommandArgumentParseError(`Failed to separate arguments at **${this.label}**.`)
            result = sep[0]
            if (sep.length > 1)
                argString = sep[1]
        }
        return {
            result: result,
            remaining: argString
        }
    }

    /**
     * Separate argCount of arguments from the argstring. Arguments are separated by spaces.
     * @private
     * @param {String} argString - String to parse arguments from.
     * @param {number} [argCount=1] - The number of argumetns to parse.
     * @returns {String[]} - The array of parsed strings. Will have length argCount+1 if there are still argString remaining.
     */
    static separateString(argString, argCount = 1) {
        if (!argString) return null
        const re = /\s*(?:("|')([^]*?)\1|(\S+))\s*/g
        const result = []
        let match = []
        while (argCount-- && (match = re.exec(argString))) {
            if (!match) return null
            result.push(match[2] || match[3])
        }
        if (match && re.lastIndex < argString.length) {
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

    /**
     * A helper function to validate the options before the class is created.
     * @private
     * @param {MeganeClient} client
     * @param {CommandArgumentOptions} options
     */
    static preCheck(client, options) {
        if (!client) throw new Error("The client must be specified for the CommandArgumentOptions.")
        if (typeof options !== "object") throw new TypeError("CommandArgumentOptions must be an object.")
        if (!options.label) throw new TypeError("CommandArgumentOptions must have a valid \"label\" string property.")
        if (typeof options.label !== "string") throw new TypeError("CommandArgumentOptions.label must be a string.")
        if (options.description && typeof options.description !== "string") throw new TypeError("CommandArgumentOptions.description must be a string.")
        if (!options.type && !options.validate)
            throw new Error("CommandArgumentOptions must have either \"type\" or \"validate\" specified.")
        if (options.type) {
            if (typeof options.type !== "string") throw new TypeError("CommandArgumentOptions.type must be a string.")
            else options.type = options.type.toLowerCase()
            if (!client.depot.types.has(options.type)) throw new RangeError(`CommandArgumentOptions.type:"${options.type}" isn't registered.`)
        }
        if (options.type) {
            if (options.validate || options.parse)
                throw new Error("CommandArgumentOptions cannot have type and validate|parse.")
        } else {
            if (!options.validate || !options.parse)
                throw new Error("Custom CommandArgumentOptions must have validate and parse functions.")
        }
        if (options.validate && typeof options.validate !== "function")
            throw new TypeError("CommandArgumentOptions.validate must be a function.")
        if (options.parse && typeof options.parse !== "function")
            throw new TypeError("CommandArgumentOptions.parse must be a function.")
        if (!options.type && (!options.validate || !options.parse))
            throw new Error("CommandArgumentOptions must have both validate and parse since it doesn't have a type.")
        if (options.quantity && (!Number.isInteger(options.quantity) || options.quantity <= 0))
            throw new TypeError("quantity must be a positive integer.")
        if (options.multiple && typeof options.multiple !== "boolean")
            throw new TypeError("multiple must be a boolean.")
        if (options.remaining && typeof options.remaining !== "boolean")
            throw new TypeError("remaining must be a boolean.")
        if ([options.multiple, options.quantitiy, options.remaining].reduce((sum, i) => sum + (i ? 1 : 0)) > 1)
            throw new TypeError("multiple and quantity and remaining are mutually exclusive.")
    }
}
module.exports = CommandArgument
