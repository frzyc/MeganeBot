const { Command } = require("../../../")
module.exports = class KillBot extends Command {
    constructor(client) {
        super(client, {
            name: "kill-bot",
            aliases: ["killbot", "you're-already-dead"],
            usage: "Kill the bot.",
            description: "Use this command to kill the bot process. The bot will restart if pm2 or similiar app manager is being used."
        })

    }
    async execute(message) {
        let msg = this.client.messageFactory({
            destination: message,
            messageContent: "Bye!"
        })
        if (message.content.toLowerCase().includes("you're-already-dead"))
            msg.messageContent = "NANI?"

        await msg.execute()
        await this.client.destroy()
        process.exit()
    }
}