module.exports = class CommandArgument {
    /**
     * @typedef {Object} CommandArgumentOptions
     * @property {string} [type] - Should corresponding to an existing type, or leave it null for a custom type
     * @property {string} label - label of the parsed values for this command in the return object
     * @property {string} [description] - A description for this argument, printed out for Command usage
     * @property {number} [max] the max value if type is a scaler value, or can be measured by a length.
     * @property {number} [min] the min value if type is a scaler value, or can be measured by a length(length >= 0);
     * @property {*} [default] the default value. All arguments after this will need to be optional as well(have default values)
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
        this.type = options.type ? client.depot.types.get(options.type) : { id: 'custom' };//if type is not defined, is is a custom type.
        this.descriptionString = options.description || null;
        this.min = options.min !== undefined ? options.min : null;
        this.max = options.max !== undefined ? options.max : null;
        this.default = options.default;
        this.quantity = options.quantity !== undefined ? options.quantity : null;
        this.multiple = options.multiple !== undefined ? options.multiple : null;
        this.remaining = options.remaining !== undefined ? options.remaining : null;
        this.customValidator = options.validate || null;
        this.customParser = options.parse || null;
    }
    async validate(value, msg) {
        if (this.customValidator) return await this.customValidator(value, msg, this);
        return await this.type.validate(value, msg, this);
    }
    async parse(value, msg) {
        if (this.customParser) return await this.customParser(value, msg, this);
        return await this.type.parse(value, msg, this);
    }
    async validateAndParse(result, argString, msg) {
        if (!argString) {//means we ran out of the argument string to parse, but an argument still havent been parsed.
            if (typeof this.default !== 'undefined') {//allow for "" and null and 0 and such falsy values
                result[this.label] = this.default;
            } else throw new Error(`Ran out of arguments to parse at ${this.label}.`);
        } else if (this.multiple) {//multiple -> keep parsing until the string is over
            result[this.label] = [];
            while (argString) {
                //keep splitting until argString is nothing.
                let sep = this.constructor.separateArgs(argString, 1);
                if (sep && sep.length > 0 && await this.validate(sep[0], msg))
                    result[this.label].push(await this.parse(sep[0], msg));
                else
                    throw Error(`Failed to validate "${sep[0]}" for argument ${this.label}.`);
                if (sep.length > 1) argString = sep[1];
                else argString = null;
            }
        } else if (this.remaining) {//remaining -> just give the whole remaining string to the arg
            if (!await this.validate(argString, msg)) throw Error(`Failed to validate "${argString}" for argument ${this.label}.`);
            result[this.label] = await this.parse(argString, msg);
        } else if (this.quantity) {//quantitiy -> get a fixed number of arguments
            result[this.label] = [];
            let sep = this.constructor.separateArgs(argString, this.quantity);
            for (let i = 0; i < this.quantity; i++) {
                if (!await this.validate(sep[i], msg))
                    throw Error(`Failed to validate ${
                        i + 1 + ((i + 1) > 3 ?
                            "th" : (i + 1) > 2 ?
                                "rd" : (i + 1) > 1 ?
                                    "nd" : "st")
                        } parameter for argument ${this.label}.`);
                result[this.label].push(await this.parse(sep[i], msg));
            }
            if (sep.length > this.quantity)
                return sep[this.quantity];
        } else {//single -> get a single argument 
            let sep = this.constructor.separateArgs(argString, 1);
            if (sep && sep.length > 0 && await this.validate(sep[0], msg))
                result[this.label] = await this.parse(sep[0], msg);
            else throw Error(`Failed to validate "${sep[0]}" for argument ${this.label}.`);
            if (sep.length > 1) return sep[1];
        }
        return null;
    }
    /**
     * 
     * @param {String} argString 
     * @param {number} argCount 
     * @returns {String[]} will have length argCount+1 if there are still argString remaining.
     */
    static separateArgs(argString, argCount) {
        if (!argString) return null;
        const re = /\s*(?:("|')([^]*?)\1|(\S+))\s*/g;
        const result = [];
        let match = [];
        while (argCount-- && (match = re.exec(argString))) {
            if (!match) return null;
            result.push(match[2] || match[3]);
        }
        if (match && re.lastIndex < argString.length) {
            result.push(argString.substr(re.lastIndex));//push the remaining string in case separating argCount doesn't consume its entirety.
        }
        return result;
    }


    get description() {
        if (!this.descriptionString) return "No description specified.";
        return this.descriptionString;
    }
    hasDescription() {
        if (this.descriptionString) return true;
        return false;
    }

    /**
     * 
     * @param {MeganeClient} client 
     * @param {CommandArgumentOptions} options 
     */
    static preCheck(client, options) {
        if (!client) throw new Error('The client must be specified for the CommandArgumentOptions.');
        if (typeof options !== 'object') throw new TypeError('CommandArgumentOptions must be an object.');
        if (!options.label) throw new TypeError('CommandArgumentOptions must have a valid "label" string property.');
        if (typeof options.label !== 'string') throw new TypeError('CommandArgumentOptions.label must be a string.');
        if (options.description && typeof options.description !== 'string') throw new TypeError('CommandArgumentOptions.description must be a string.');
        if (!options.type && !options.validate)
            throw new Error('CommandArgumentOptions must have either "type" or "validate" specified.');
        if (options.type) {
            if (typeof options.type !== 'string') throw new TypeError('CommandArgumentOptions.type must be a string.');
            else options.type = options.type.toLowerCase();
            if (!client.depot.types.has(options.type)) throw new RangeError(`CommandArgumentOptions.type:"${options.type}" isn't registered.`);
        }
        if (options.type) {
            if (options.validate || options.parse)
                throw new Error('CommandArgumentOptions cannot have type and validate|parse.');
        } else {
            if (!options.validate || !options.parse)
                throw new Error('Custom CommandArgumentOptions must have validate and parse functions.');
        }
        if (options.validate && typeof options.validate !== 'function')
            throw new TypeError('CommandArgumentOptions.validate must be a function.');
        if (options.parse && typeof options.parse !== 'function')
            throw new TypeError('CommandArgumentOptions.parse must be a function.');
        if (!options.type && (!options.validate || !options.parse))
            throw new Error('CommandArgumentOptions must have both validate and parse since it doesn\'t have a type.');
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