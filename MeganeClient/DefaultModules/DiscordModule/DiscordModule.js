const CommandModule = require("../../CommandModule")
module.exports = class UtilModule extends CommandModule {
    constructor(client) {
        super(client, {
            name: "Discord Module",
            usage: "A module of commands for discord.",
            description: "Commands to interact with discord-related functions."
        })
        this.addCommandsIn(require("path").join(__dirname, "Commands"))
    }
}