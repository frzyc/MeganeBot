/**
 * A base type, for other types to build on top of.
 */
class Type {
    /**
     * @param {MeganeClient} client 
     * @param {string} typeid 
     */
    constructor(client, typeid){
        if(!client) throw new Error("Client not specified.");
        if(typeof id !== "string") throw new TypeError("Type ID must be aa string");
        if(typeid != typeid.toLowerCase()) throw new TypeError("Type ID must be lowercase");

        Object.defineProperty(this, 'client', { value: client });

        this.id = typeid;
    }
    /**
     * parses the value.
     * @param {string} value 
     * @param {CommandMessage} cmdMsg
     * @param {array<string>} args array of remaining args.
     * @returns {null|parsedValue} return null if the value cannot be parsed by this type. 
     * @abstract
     */
    parse(value, cmdMsg, args){
        throw new Error(`${this.constructor.name} doesn't have a parse() method.`);
    }
}
module.exports = Type;