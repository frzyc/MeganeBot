const CommandArgumentParseError = require('./Errors/CommandArgumentParseError');
const Util = require('./Utility/Util');
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
        if (!this.command.passContextRestriction(this.message, true)) return;
        if (!this.command.passCooldown(this.message, true)) return;//check CD first, since if it is already on cooldown, it probably means it passed permissions
        if (!this.command.passPermissions(this.message, true)) return;
        if (this.command.restriction) {
            let restiction = await this.command.restriction(this);
            if (restiction) {
                this.client.autoMessageFactory({
                    destination: this.message,
                    messageContent: restiction,
                    deleteTime: 30,
                    destinationDeleteTime: 30
                });
                return;
            }
        }
        var parsedArgs = null;
        if (this.command.args) {
            try {
                parsedArgs = await this.separateArgs();
            } catch (e) {
                console.log(e);
                if (e instanceof CommandArgumentParseError) {
                    let usageObj = this.command.getUsageEmbededMessageObject(this.message);
                    usageObj.messageContent = `Bad Arguments: ${e.message}`;
                    usageObj.destination = this.message;
                    this.client.autoMessageFactory(usageObj);
                    return false;
                } else throw e;
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
            console.log(err);
        }
    }

    async separateArgs() {
        //break up the string into arguments
        let argString = this.argString.trim();
        this.argStrings = this.command.args.map(
            (arg) => {
                let processed = arg.separateArg(argString);
                argString = processed.remainingString;
                return processed.result;
            }
        )
        //validate
        for (let i = 0; i < this.command.args.length; i++) {
            let arg = this.command.args[i];
            if (!await arg.validate(this.argStrings[i], this.message))
                throw new CommandArgumentParseError(`Failed to validate argument **${arg.label}**.`);
        }

        //parse
        let result = {};
        for (let i = 0; i < this.command.args.length; i++) {
            let arg = this.command.args[i];
            result[arg.label] = await arg.parse(this.argStrings[i], this.message);
        }
        return result;
    }
}