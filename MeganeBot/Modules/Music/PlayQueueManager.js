const { Collection } = require("discord.js")
const PlayQueue = require("./PlayQueue")
/**
 * A manager to keep track of all the playqueues, hashed by guildID.
 */
module.exports = class PlayQueueManager {
    /**
     * Constructor
     * @param {MeganeClient} client 
     */
    constructor(client) {
        if(!client) throw Error("PlayQueueManager needs a client.")
        Object.defineProperty(this, "client", { value: client })
        this.playQueueCollection = new Collection()
    }

    /**
     * If the queue with the guildID exists, return true.
     * @param {string} guildID 
     * @returns {boolean}
     */
    hasPlayQueue(guildID) {
        return this.playQueueCollection.has(guildID)
    }

    /**
     * Get a PlayQueue by guildID, if it doesnt exist, create a new one and return it.
     * @param {string} guildID 
     * @returns {PlayQueue}
     */
    getPlayQueue(guildID) {
        if (this.hasPlayQueue(guildID)) {
            return this.playQueueCollection.get(guildID)
        } else {
            const pq = new PlayQueue(this.client, guildID)
            this.playQueueCollection.set(guildID, pq)
            return pq
        }
    }
    
    /**
     * Removes a playqueue
     * @param {string} guildID 
     * @returns true if the PlayQueue was removed, false if it never existed.
     */
    removePlayQueue(guildID){
        return this.playQueueCollection.delete(guildID)
    }
}