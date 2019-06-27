const { Command } = require("../../../")

module.exports = class GetPrefix extends Command {
    constructor(client) {
        super(client, {
            name: "Get command prefix",
            commands: ["get-prefix", "getprefix"],
            examples: ["get-prefix"],
            usage: "get command prefix for the guild/chat you are in",
            description: "Use this command to get the command prefix for the guild/chat you are in. "
        })

    }
    execute(message) {
        let msg = this.client.messageFactory({
            destination: message,
            reply: true,
            deleteTime: 2 * 60,
            destinationDeleteTime: 2 * 60,
            messageContent: "Cannot get prefix."
        })
        if (message.guild) {
            if (message.guild.prefix)
                msg.messageContent = `The command prefix for this guild: ${message.guild.prefix}`
            else
                msg.messageContent = "This guild has no command prefix. You can still use commands by mentioning me!"
        } else if (message.channel.type === "dm") {
            if (this.client.prefix)
                msg.messageContent = `The command prefix is: ${this.client.prefix}`
            else
                msg.messageContent = "The global command prefix has been removed. You can still use commands by mentioning me!"
        }
        msg.execute()

    }
}
