const CommandModule = require('../../CommandModule');
module.exports = class CommandCommandModule extends CommandModule {
    constructor(client) {
        super(client, {
            name: "CommandCommandModule",
            description: "A module for managing commands and modules",
        });

        this.addCommands([
            require('./Commands/SetPrefix')
        ]);
    }
}