const CommandModule = require('../../CommandModule');
module.exports = class CommandAdminModule extends CommandModule {
    constructor(client) {
        super(client, {
            name: "CommandAdminModule",
            usage: "A module for managing commands and modules",
            description: `Has commands to set the command prefix, and get usages of command/modules.`
        });

        this.addCommands([
            require('./Commands/SetPrefix'),
            require('./Commands/GetPrefix'),
            require('./Commands/Help')
        ]);
    }
}