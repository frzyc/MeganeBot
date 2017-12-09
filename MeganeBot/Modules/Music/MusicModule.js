const {CommandModule} = require('../../../MeganeClient');
const PlayQueueManager = require('./PlayQueueManager');
module.exports = class MusicModule extends CommandModule{
    constructor(client){
        super(client, {
            name: "Music Module",
            usage: "A module to play music.",
            guildOnly: true
        });
        this.playQueueManager = new PlayQueueManager(client);
        this.addCommandsIn(require('path').join(__dirname, "Commands"));
    }
}