const { Command } = require("../../../")
module.exports = class GetBotVersion extends Command {
    constructor(client) {
        super(client, {
            name: "Get bot version",
            commands: ["get-bot-version", "getbotversion"],
            examples: ["get-bot-version"],
            usage: "Get the bot version.",
            description: "Returns the latest git commit message."
        })
    }
    async execute(message) {
        let returnMsg = this.client.messageFactory({
            destination: message,
            messageContent: "Failed checking git version!",
            deleteTime: 5 * 60,
            destinationDeleteTime: 5 * 60,
        })
        var commit = require("child_process").spawn("git", ["log", "-n", "1"])
        commit.stdout.on("data", data => {
            console.log(`stdout: ${data}`)
            returnMsg.messageContent = `\`\`\`${data}\`\`\``
            returnMsg.execute()
        })
        commit.stderr.on("data", data => {
            console.log(`stderr: ${data}`)
            returnMsg.messageContent = `\`\`\`${data}\`\`\``
            returnMsg.execute()
        })
        commit.on("close", code => {
            console.log(`code:${code}`)
            if (code != 0)
                returnMsg.execute()//since the return message has the error message by default.
        })
    }
}
