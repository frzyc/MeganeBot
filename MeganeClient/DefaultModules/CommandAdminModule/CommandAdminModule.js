const CommandModule = require('../../CommandModule');
module.exports = class CommandAdminModule extends CommandModule {
    constructor(client) {
        super(client, {
            name: "CommandAdminModule",
            description: "A module for managing commands and modules",
        });

        this.addCommands([
            require('./Commands/SetPrefix')
        ]);
    }
}