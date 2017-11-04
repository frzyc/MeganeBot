const { Collection } = require('discord.js');
const PlayQueue = require('./PlayQueue');
module.exports = class PlayQueueManager {
    constructor(client) {
        if(!client) throw Error('PlayQueueManager needs a client.');
        Object.defineProperty(this, 'client', { value: client });
        this.playQueueCollection = new Collection();
    }
    hasPlayQueue(guildID) {
        return this.playQueueCollection.has(guildID);
    }
    getPlayQueue(guildID) {
        if (this.hasPlayQueue(guildID)) {
            return this.playQueueCollection.get(guildID);
        } else {
            let pq = new PlayQueue(this.client, guildID);
            this.playQueueCollection.set(guildID, pq);
            return pq;
        }
    }
}