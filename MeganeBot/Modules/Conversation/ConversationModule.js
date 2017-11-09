const {CommandModule} = require('../../../MeganeClient');
module.exports = class ConversationModule extends CommandModule{
    constructor(client){
        super(client, {
            name: "conversationModule",
            description: "A module to talk to MeganeBot.",
            guildOnly: true
        });
        this.addCommands([
            require('./Commands/basicResponse'),
        ]);
    }
}