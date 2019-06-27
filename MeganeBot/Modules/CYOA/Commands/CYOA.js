const { Command } = require("../../../../MeganeClient")
module.exports = class CYOA extends Command {
    constructor(client) {
        super(client, {
            name: "Choose your own adventure",
            commands: "CYOA",
        })
    }
    async execute(message) {
        let msgRes = this.client.CYOALibrary.getMessageResolvable()
        msgRes.destination = message
        return msgRes
    }
}
