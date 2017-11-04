module.exports = class CommandArgument {
    /**
     * @typedef {Object} CommandArgumentOptions
     * @property {string} [type] - Should corresponding to an existing type, or leave it null for a custom type
     * @property {string} label - label of the parsed values for this command in the return object
     * @property {string} [description] - A description for this argument, printed out for Command usage
     * @property {number} [max] the max value if type is a scaler value, or can be measured by a length.
     * @property {number} [min] the min value if type is a scaler value, or can be measured by a length(length >= 0);
     * @property {number} [quantity] retrieve a set quantitiy of values. This will return the values as an array. Mutually exclusive from CommandArgumentOptions#multiple and CommandArgumentOptions#remaining
     * @property {boolean} [multiple] retrieve several values. This argument have to be at the end of the command arguments. Mutually exclusive from CommandArgumentOptions#quantity and CommandArgumentOptions#remaining
     * @property {boolean} [remaining] retrieve the last remaining string of input. Mutually exclusive from CommandArgumentOptions#quantity and CommandArgumentOptions#quantity
     * @property {function} [validate] see {@link Type#validate}
     * @property {function} [parse] see {@link Type#parse}
     */

    /**
     * Constructor
     * @param {MeganeClient} client 
     * @param {CommandArgumentOptions} options 
     */
    constructor(client, options) {
        this.constructor.preCheck(client, options);
        this.label = options.label;
        this.type = options.type ? client.depot.types.get(options.type) : null;
        this.description = options.description !== undefined ? options.description : null;
        this.min = options.min !== undefined ? options.min : null;
        this.max = options.max !== undefined ? options.max : null;
        this.quantity = options.quantity !== undefined ? options.quantity : null;
        this.multiple = options.multiple !== undefined ? options.multiple : null;
        this.remaining = options.remaining !== undefined ? options.remaining : null;
        this.customValidator = options.validate || null;
        this.customParser = options.parse || null;
    }
    validate(value, msg) {
        if (this.customValidator) return this.customValidator(value, msg, this);
        return this.type.validate(value, msg, this);
    }
    parse(value, msg) {
        if (this.customParser) return this.customParser(value, msg, this);
        return this.type.parse(value, msg, this);
    }

    /**
     * 
     * @param {MeganeClient} client 
     * @param {CommandArgumentOptions} options 
     */
    static preCheck(client, options) {
        if (!client) throw new Error('The client must be specified for the argument.');
        if (typeof options !== 'object') throw new TypeError('Argument options must be an Object.');
        if (!options.label) throw new TypeError('Argument must have a valid "label" string property.');
        if (typeof options.label !== 'string') throw new TypeError('Argument.label must be a string.');
        if (options.description && typeof options.description !== 'string') throw new TypeError('Argument.description must be a string.');
        if (!options.type && !options.validate)
            throw new Error('Argument must have either "type" or "validate" specified.');
        if (options.type && !client.depot.types.has(options.type))
            throw new RangeError(`Argument type "${options.type}" isn't registered.`);
        if (options.type) {
            if (options.validate || options.parse)
                throw new Error('Argument cannot have type and validate|parse.');
        }
        if (!options.type) {
            if (!options.validate || !options.parse)
                throw new Error('Custom arguement must have validate and parse functions.');
        }
        if (options.validate && typeof options.validate !== 'function')
            throw new TypeError('validate must be a function.');
        if (options.parse && typeof options.parse !== 'function')
            throw new TypeError('parse must be a function.');
        if (!options.type && (!options.validate || !options.parse))
            throw new Error('Argument must have both validate and parse since it doesn\'t have a type.');
        if (options.quantity && (!Number.isInteger(options.quantity) || options.quantity <= 0))
            throw new TypeError('quantity must be a positive integer.');
        if (options.multiple && typeof options.multiple !== 'boolean')
            throw new TypeError('multiple must be a boolean.');
        if (options.remaining && typeof options.remaining !== 'boolean')
            throw new TypeError('remaining must be a boolean.');
        if ([options.multiple, options.quantitiy, options.remaining].reduce((sum, i) => sum + (i ? 1 : 0)) > 1)
            throw new TypeError('multiple and quantity and remaining are mutually exclusive.');
    }
}