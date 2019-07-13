const {CommandModule} = require("../")
module.exports = class UtilModule extends CommandModule {
  constructor(client) {
    super(client, {
      name: "Utility Module",
      usage: "A module for small helper commands",
      description: "Odds-and-sorts of commands that doesnt really fit anywhere."
    })
    this.addCommandsIn(require("path").join(__dirname, "UtilModule"))
  }
}