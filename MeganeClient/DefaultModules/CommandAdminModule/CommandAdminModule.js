const { CommandModule } = require("../../")
module.exports = class CommandAdminModule extends CommandModule {
    constructor(client) {
        super(client, {
            name: "Command Admin Module",
            usage: "A module for managing commands and modules",
            description: "Has commands to set the command prefix, and get usages of command/modules."
        })
        this.addCommandsIn(require("path").join(__dirname, "Commands"))
    }
}