const Command = require("../../../Command")
module.exports = class SetPrefix extends Command {
    constructor(client) {
        super(client, {
            name: "set-bot-status",
            aliases: ["setbotstatus"],
            examples: ["set-bot-status idle", "setbotstatus dnd?"],
            usage: "Change the bot status.",
            description: "Can change the status to one of \"Online\", \"Idle\", \"Invisible\", \"Do Not Disturb\"",
            userPermissions: ["ADMINISTRATOR"],
            args: [
                {
                    label: "newstatus",
                    description: "The new status to set for the bot. Can be one of \"Online\", \"on\", \"Idle\", \"id\", \"Invisible\", \"inv\", \"Do-Not-Disturb\", and \"dnd\"",
                    validate: (value) => {
                        return ["online", "on", "idle", "id", "invisible", "inv", "do-not-disturb", "dnd"].includes(value.toLowerCase())
                    },
                    parse: (value) => {
                        switch (value.toLowerCase()) {
                        case "online":
                        case "on":
                            return "online"
                        case "idle":
                        case "id":
                            return "idle"
                        case "invisible":
                        case "inv":
                            return "invisible"
                        case "do-not-disturb":
                        case "dnd":
                            return "dnd"
                        }
                    }
                }
            ]
        })
        this.statuses = ["online", "idle", "invisible", "dnd"]
    }
    async execute(message, args) {
        let status = args["newstatus"]
        let msg = this.client.messageFactory({
            destination: message,
            messageContent: `I am currently ${status}!`,
            deleteTime: 30,
            destinationDeleteTime: 30
        })
        if (status === this.client.user.presence.status)
            return msg.execute()
        this.client.user.setStatus(status).then(user => {
            msg.messageContent = `Changed my status to ${status}!`
            msg.execute()
        }).catch((err) => {
            msg.messageContent = `Cannot change my status to ${status}!`
            msg.execute()
        })
    }
}