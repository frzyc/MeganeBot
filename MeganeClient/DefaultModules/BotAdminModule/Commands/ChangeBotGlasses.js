const fs = require("fs")
const { Command } = require("../../../")

module.exports = class ChangeBotGlasses extends Command {
    constructor(client) {
        super(client, {
            name: "change-bot-glasses",
            aliases: ["changebotglasses"],
            usage: "Change the bot's display picture",
            description: "Randomly select a display picture from a preset directory, and set it as my profile picture.\n Set this directory using ```MeganeClient.profilePictureDirectory```"
        })
        //TODO choose a specific display pic, and use the random selection for the default option. 
    }
    async execute(message) {
        let msg = await this.client.autoMessageFactory({
            destination: message,
            messageContent: "Changing my glasses...",
        })
        let glassesDir = this.client.profilePictureDirectory
        if (!glassesDir) {
            return await this.client.autoMessageFactory({
                destination: msg,
                edit: true,
                messageContent: "The display picture directory is not set.",
                deleteTime: 30,
                destinationDeleteTime: 30
            })
        }
        fs.readdir(glassesDir, async (err, files) => {
            try {
                files.forEach(file => {
                    console.log(file)
                })
                let randicon = files[Math.floor(Math.random() * files.length)]
                await this.client.user.setAvatar(`${glassesDir}/${randicon}`)
                await this.client.autoMessageFactory({
                    destination: msg,
                    edit: true,
                    messageContent: "Changed my glasses! :eyeglasses: ",
                    deleteTime: 60,
                    destinationDeleteTime: 60
                })
            } catch (err) {
                this.client.emit("error:", err)
                return await this.client.autoMessageFactory({
                    destination: msg,
                    edit: true,
                    messageContent: "Cannot change my glasses! " + err.message ? err.message : "",
                    deleteTime: 3 * 60,
                    destinationDeleteTime: 3 * 60
                })
            }
        })

    }
}