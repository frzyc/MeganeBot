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
                parsedArgs = await this.parseAllArgs();
            } catch (e) {
                let usageObj = this.command.getUsageEmbededMessageObject(this.message);
                usageObj.messageContent = `Bad Arguments: ${e.message}`;
                usageObj.destination = this.message;
                this.client.autoMessageFactory(usageObj);
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
            console.log(err);
        }
    }

    /**
     * a function to parse all the arguments of this command,
     * @returns {Set|false} result - Will result false if the string cannot be parsed
     */
    async parseAllArgs() {
        let argString = this.argString.trim();
        let result = {};
        for (const arg of this.command.args)
            argString = await arg.validateAndParse(result, argString, this.message);
        return result;
    }
}