const joi = require("@hapi/joi")
/**
 * A base type, for other types to build on top of.
 * The reason why there is a separate validate() and parse() function is that
 * sometimes it is less expensive to validation args rather than parse it.
 * When a command is executed, it will firstly validate all the args first, before parsing all the values.
 * If we can detect a validation error before parsing, we can eliminate the overhead of parsing the previous
 * arguments otherwise.
 */
class Type {
    static typeidSchema = joi.string().lowercase()
    /**
     * @param {MeganeClient} client
     * @param {string} typeid
     */
    constructor(client, typeid){
        if(!client) throw new Error("Client not specified.")
        Object.defineProperty(this, "client", { value: client })
        let result = Type.typeidSchema.validate(typeid)
        if(result.error) throw result.error
        this.id = result.value
    }

    /**
     * @typedef {Object} ValidationReturn
     * @property {?Object} result The result of the validation. Will be passed as
     * the value to {@link Type#parse}
     * @property {?Object} error The error if the validation failed. Return an Error with no message to use the default error message
     */

    /**
	 * Validates a value against the type
	 * @param {string} value - Value to validate
	 * @param {CommandMessage} msg - Message the value was obtained from
	 * @param {CommandArgument} arg - CommandArgument the value obtained from
	 * @return {ValidationReturn|Promise<ValidationReturn>}
	 * @abstract
	 */
    validate(value, msg, arg) { // eslint-disable-line no-unused-vars
        throw new Error(`${this.constructor.name} doesn't have a validate() method.`)
    }
    /**
     * parses the value.
     * @param {string} value  - Value to parse, taken from {@link ValidationReturn} returned by {@link Type#validate}
     * @param {CommandMessage} msg - Message the value was obtained from
     * @param {CommandArgument} arg - CommandArgument the value obtained from
     * @returns {null|parsedValue} return null if the value cannot be parsed by this type.
     * @abstract
     */
    parse(value, msg, arg){ // eslint-disable-line no-unused-vars
        throw new Error(`${this.constructor.name} doesn't have a parse() method.`)
    }
}
module.exports = Type
