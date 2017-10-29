const util = require.main.exports.getRequire('util');
class CommandMessage {
    constructor(message, command = null, argString = null){
        this.message = message;
        this.command = command;
        this.argString = argString;
    }
    parseArgs(){
        if (this.command.argsTemplate) {
            //TODO move checkargs outside of command...
            this.args = this.command.checkArgs(this.argString, this.message);
            if (this.args.every(v => v === null)) {
                let msg = 'Bad Parameter:\n' + this.command.getUseage();
                util.createMessage({
                    messageContent: msg,
                    reply: true,
                    deleteTime: 3 * 60 * 1000
                }, this.message);
                return false;
            }
        }
        return true;
    }
}
module.exports = CommandMessage;