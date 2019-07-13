const { CommandModule } = require("../")
module.exports = class BotAdminModule extends CommandModule {
  constructor(client) {
    super(client, {
      name: "Bot Admin Module",
      usage: "A module for manage the bot",
      description: "Has commands to set display pic, update the bot, etc...",
      ownerOnly: true
    })
    this.addCommandsIn(require("path").join(__dirname, "BotAdminModule"))
  }
}