const {CommandModule} = require('../../../MeganeClient');
const PlayQueueManager = require('./PlayQueueManager');
module.exports = class MusicModule extends CommandModule{
    constructor(client){
        super(client, {
            name: "musicmodule",
            usage: "A module to play music.",
            guildOnly: true
        });
        this.playQueueManager = new PlayQueueManager(client);
        this.addCommands([
            require('./Commands/QueueMusic')
        ])
    }
}