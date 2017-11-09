const Util = require('./Utility/Util');
const MessageUtil = require('./MessageUtil');
module.exports = class CommandMessage {
    /**
     * @param {MeganeClient} client
     * @param {Message} message 
     * @param {Command} command 
     * @param {String} argString basically the whole content except the prefix + command part 
     */
    constructor(client, message, command = null, argString = null) {
        Object.defineProperty(this, 'client', { value: client });
        this.message = message;
        this.command = command;
        this.argString = argString;
    }
    async execute() {
        //command based restrictions
        if (this.command.checkRestriction(this.message)) return;
        if (this.command.restriction)
            if (this.command.restriction(this)) return; //TODO reply with restriction message

        var parsedArgs = null;
        if (this.command.args) {
            parsedArgs = await this.parseAllArgs();
            if (parsedArgs === false || parsedArgs === null || parsedArgs === undefined || parsedArgs.length === 0) {
                let usageObj = this.command.getUsageEmbededMessageObject(this.message);
                usageObj.messageContent = 'Bad Arguments.';
                usageObj.destination = this.message;
                let response = new MessageUtil(this.client, usageObj);
                response.execute();
                //Util.createMessage(usageObj, this.message);
                return false;
            }
        }

        //set the cooldown for now, if rejected, we can clear the cooldown/
        this.command.setCooldown(this.message);

        //use Promise.resolve just incase a process doesnt return a promise...
        try {
            let response = await this.command.execute(this.message, parsedArgs);
            console.log("cmd resolved");
            this.client.emit("commandsuccess", this, response);
            if (response) this.client.dispatcher.handleResponse(response);
        } catch (err) {
            this.client.emit("commandfailed", this, err);
            this.command.clearCooldown(this.message);
            console.log(reject);
        }
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
            result.push(argString.substr(re.lastIndex));
        }
        return result;
    }
    /**
     * a function to parse all the arguments of this command,
     * @returns {Set|false} result - Will result false if the string cannot be parsed
     */
    async parseAllArgs() {
        let argString = this.argString.trim();
        let result = {};
        for (const arg of this.command.args) {
            if (!argString) {//means we ran out of the argument string to parse, but an argument still havent been parsed.
                if (typeof arg.default !== 'undefined') {//allow for "" and null and 0 and such falsy values
                    result[arg.label] = arg.default;
                    continue;
                } else
                    return false;
            }
            if (arg.multiple) {//multiple -> keep parsing until the string is over
                console.log("arg.multiple parse");
                result[arg.label] = [];
                while (argString) {
                    //keep splitting until argString is nothing.
                    let sep = this.constructor.separateArgs(argString, 1);
                    if (!sep) {
                        argString = null;
                        continue;
                    }
                    if (sep && sep.length > 0 && await arg.validate(sep[0], this.message, arg))
                        result[arg.label].push(sep[0]);
                    else
                        return;
                    if (sep.length > 1)
                        argString = sep[1];
                    else
                        argString = null;
                }
                break;
            } else if (arg.remaining) {//remaining -> just give the whole remaining string to the arg
                console.log("arg.remaining parse");
                let valid = await arg.validate(argString, this.message, arg);
                if (!valid)
                    return false;
                result[arg.label] = arg.parse(argString);
                break;
            } else if (arg.quantity) {//quantitiy -> get a fixed number of arguments
                console.log("arg.quantity parse");
                result[arg.label] = [];
                let sep = this.constructor.separateArgs(argString, arg.quantity);
                for (let i = 0; i < arg.quantity; i++) {
                    let valid = await arg.validate(sep[i], this.message, arg);
                    if (!valid)
                        return false;
                    result[arg.label].push(arg.parse(sep[i]));
                }
                if (sep.length > arg.quantity)
                    argString = sep[arg.quantity];
            } else {//single -> get a single argument 
                console.log("arg.single parse");
                let sep = this.constructor.separateArgs(argString, 1);
                if (!sep) {
                    argString = null;
                    continue;
                }
                if (sep && sep.length > 0 && await arg.validate(sep[0], this.message, arg))
                    result[arg.label] = sep[0];
                else
                    return;
                if (sep.length > 1)
                    argString = sep[1];
                else
                    argString = null;
            }
        }
        return result;
    }
}