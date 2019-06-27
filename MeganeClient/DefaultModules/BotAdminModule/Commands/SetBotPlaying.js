const { Command } = require("../../../")

module.exports = class SetBotPlaying extends Command {
    constructor(client) {
        super(client, {
            name: "set-bot-playing",
            aliases: ["setbotplaying"],
            examples: ["set-bot-playing World of Warcraft"],
            usage: "Change the playing status of the bot.",
            description: "Use this command to change the playing status of the bot. Will trim all whitespace before and after the string.",
            args: [
                {
                    label: "newplaying",
                    type: "string",
                    remaining: true,
                    description: "The new value to set playing status."
                }
            ]
        })
    }
    async execute(message, args) {
        let newplaying = args["newplaying"]
        if (!newplaying) message.reply("The playing message is empty!")
        try {
            await this.client.user.setActivity(newplaying)
            await message.reply(`Changed my playing to: "${newplaying}".`)
        } catch (e) {
            await message.reply("Cannot set bot's playing status.")
        }
    }
}