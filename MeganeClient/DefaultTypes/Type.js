/**
 * A base type, for other types to build on top of.
 */
class Type {
    /**
     * @param {MeganeClient} client 
     * @param {string} typeid 
     */
    constructor(client, typeid){
        if(!client) throw new Error("Client not specified.")
        if(typeof typeid !== "string") throw new TypeError("Type ID must be aa string")
        if(typeid != typeid.toLowerCase()) throw new TypeError("Type ID must be lowercase")

        Object.defineProperty(this, "client", { value: client })

        this.id = typeid
    }
    /**
	 * Validates a value against the type
	 * @param {string} value - Value to validate
	 * @param {CommandMessage} msg - Message the value was obtained from
	 * @param {CommandArgument} arg - CommandArgument the value obtained from
	 * @return {boolean|string|Promise<boolean|string>} Whether the value is valid, or an error message
	 * @abstract
	 */
    validate(value, msg, arg) { // eslint-disable-line no-unused-vars
        throw new Error(`${this.constructor.name} doesn't have a validate() method.`)
    }
    /**
     * parses the value.
     * @param {string} value  - Value to parse
     * @param {CommandMessage} msg - Message the value was obtained from
     * @param {CommandArgument} arg - CommandArgument the value obtained from
     * @returns {null|parsedValue} return null if the value cannot be parsed by this type. 
     * @abstract
     */
    parse(value, msg, arg){
        throw new Error(`${this.constructor.name} doesn't have a parse() method.`)
    }
}
module.exports = Type