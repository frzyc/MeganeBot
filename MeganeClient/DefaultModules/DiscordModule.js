const { CommandModule } = require("../")
module.exports = class DiscordModule extends CommandModule {
  constructor(client) {
    super(client, {
      name: "Discord Module",
      usage: "A module of commands for discord.",
      description: "Commands to interact with discord-related functions."
    })
    this.addCommandsIn(require("path").join(__dirname, "DiscordModule"))
  }
}