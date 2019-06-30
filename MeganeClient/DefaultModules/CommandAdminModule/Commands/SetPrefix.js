const { Command } = require("../../../")

module.exports = class SetPrefix extends Command {
    constructor(client) {
        super(client, {
            name: "Set command prefix",
            commands: ["set-prefix", "setprefix"],
            examples: ["set-prefix !", "setprefix command?"],
            usage: "Change the command prefix for the guild. Or change it for DM.",
            description: "Use this command to change the command prefix for the guild. It can also be used to change the DM prefix for botowners. \nIt must contain no whitespacecharacter. If nothing is put in, Then the prefix is removed, and only mentions can be used for commands.",
            userPermissions: ["ADMINISTRATOR"],
            args: [
                {
                    label: "newprefix",
                    type: "string",
                    default: "",
                    description: "The new value to set a prefix for the commands. Can be anything without a whitespacecharacter. "
                }
            ]
        })

    }
    execute(message, args) {
        let msg = this.client.messageFactory({
            destination: message,
            reply: true,
            deleteTime: 2 * 60 * 1000,
            destinationDeleteTime: 2 * 60 * 1000,
            messageContent: "Cannot set prefix."
        })
        if (message.guild) {
            message.guild.prefix = args["newprefix"]
            if (message.guild.prefix)
                msg.messageContent = `A new prefix is set for this guild: ${message.guild.prefix}`
            else
                msg.messageContent = "The prefix for this guild has been removed. You can still use commands by mentioning me!"
        } else if (message.channel.type === "dm") {//TODO setGlobalPrefix
            if (this.client.isOwner(message.author.id)) {
                this.client.prefix = args["newprefix"]
                if (this.client.prefix)
                    msg.messageContent = `A new global prefix is set: ${this.client.prefix}`
                else
                    msg.messageContent = "The global prefix has been removed. You can still use commands by mentioning me!"
            } else {
                msg.messageContent = "You must be a bot owner to change the global prefix!"
            }
        }
        msg.execute()

    }
}
