const Command = require("../../../Command")
const packagejson = require("../../../../package.json")
module.exports = class BotAbout extends Command {
    constructor(client) {
        super(client, {
            name: "bot-about",
            aliases: ["botabout"],
            usage: "Get some info about the bot.",
            description: "Returns the bot version, and uptime info."
        })
    }
    async execute(message, args) {
        let msg = `Name: ${packagejson.name} \nVersion: ${packagejson.version} \nDescription: ${packagejson.description}\n`
        let uptime = Math.floor(process.uptime())
        let hours = Math.floor(uptime / (60 * 60))
        let minutes = Math.floor((uptime % (60 * 60)) / 60)
        let seconds = uptime % 60
        msg += `\nUptime: ${hours} Hours ${minutes} Mintues and ${seconds} Seconds`
        return msg
    }
}