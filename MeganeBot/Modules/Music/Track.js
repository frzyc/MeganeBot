const { Util } = require('../../../MeganeClient');
module.exports = class Track {
    constructor(playQueue, info) {
        this.playQueue = playQueue;
        this.info = info;
        this.title = info.title;
        this.url = info.url;
        this.thumbnail = info.thumbnail;
        this.extractor = info.extractor;
        this.webpage_url = info.webpage_url;
        this.uploader = info.uploader;
        this.lengthSeconds = info.duration;
        this.userID = null;
        this.message = null;
        this.formatTime = Util.formatTime(this.lengthSeconds);
    }
    getTime() { return this.lengthSeconds; };
    getPlayingmessageResolvable(editmsg) {
        let playmsgresolvable = {
            messageOptions: {
                embed: {
                    color: 6604830,//Green
                    title: `${this.playQueue.voiceController.paused ? 'Paused' : 'Playing'} ${this.title}`,
                    url: this.webpage_url,
                    thumbnail: {
                        url: this.thumbnail,
                    },
                    fields: [
                        {
                            name: 'Uploader',
                            value: this.uploader
                        },
                        {
                            name: 'Duration',
                            value: this.formatTime
                        },
                        {
                            name: 'Volume',
                            value: this.playQueue.voiceController.getVol()
                        },
                        {
                            name: 'Playing Next',
                            value: this.playQueue.list[0] ? this.playQueue.list[0].title : `None`
                        }
                    ],
                }
            },
        }
        if (editmsg) {
            playmsgresolvable.destination = editmsg;
        } else {//if there is not a edit message, it means sending a new play message, so attach buttons to this new resolvable
            let vc = this.playQueue.voiceController;
            playmsgresolvable.reactions = [
                {
                    emoji: '⏯',
                    execute: (messageReaction, user) => {
                        if (vc.paused) vc.resume();
                        else vc.pause();
                    }
                },
                {
                    emoji: '⏭',
                    execute: (messageReaction, user) => {
                        vc.stop();
                    }
                },
                {
                    emoji: '🔀',
                    execute: (messageReaction, user) => {
                        this.playQueue.shuffleQueue();
                    }
                },
                {
                    emoji: '🔉',
                    execute: (messageReaction, user) => {
                        vc.volDec();
                    }
                },
                {
                    emoji: '🔊',
                    execute: (messageReaction, user) => {
                        vc.volInc();
                    }
                },
                {
                    emoji: '🔠',
                    execute: (messageReaction, user) => {
                        this.playQueue.sendPlaylistMessage();
                    }
                },
                {
                    emoji: '⬇',
                    execute: (messageReaction, user) => {
                        this.playQueue.sendPlayingmessage();
                    }
                }
            ];
        }
        return playmsgresolvable;
    }
    getFinishedMessageResolvable() {
        return {
            destination: this.message,
            edit: true,
            messageOptions: {
                embed: {
                    color: 13114910,//red
                    title: `Finished: ${this.title}`,
                    url: this.webpage_url,
                    thumbnail: {
                        url: this.thumbnail,
                    },
                    fields: [
                        {
                            name: 'Uploader',
                            value: this.uploader
                        },
                        {
                            name: 'Duration',
                            value: this.formatTime
                        },
                    ],
                }
            },
            reactions: [{
                emoji: '↪',
                execute: async (messageReaction, user) => {
                    if (user.id !== this.userID) return;
                    if (this.message && this.message.deletable)
                        await this.message.delete();
                    this.message = null;
                    this.playQueue.addtoQueue(this);
                }
            }],
        }
    }
    getQueuedMessageResolvable() {
        return {
            destination: this.playQueue.tchannel,
            messageOptions: {
                embed: {
                    color: 13158430,//yellow
                    title: `Queued: ${this.title}`,
                    url: this.webpage_url,
                    thumbnail: {
                        url: this.thumbnail,
                    },
                    fields: [
                        {
                            name: 'Uploader',
                            value: this.uploader
                        },
                        {
                            name: 'Duration',
                            value: this.formatTime
                        },
                    ],
                }
            },
            reactions: [{
                emoji: '❌',
                execute: (reactionMessage, user) => {
                    if (user.id !== this.userID) return;
                    reactionMessage.remove();
                    this.playQueue.removefromQueue(this.trackId);
                }
            }],
        }
    }
    getDequeuedMessageResolvable() {
        return {
            destination: this.message ? this.message : this.playQueue.tchannel,
            edit: this.message ? true : false,
            messageOptions: {
                embed: {
                    color: 3447003,//TODO DARK RED
                    title: `Dequeued: ${this.title}`,
                    url: this.webpage_url,
                    thumbnail: {
                        url: this.thumbnail,
                    },
                    fields: [
                        {
                            name: 'Uploader',
                            value: this.uploader
                        },
                        {
                            name: 'Duration',
                            value: this.formatTime
                        },
                    ],
                }
            },
            deleteTime: 3 * 60,
            reactions: [{
                emoji: '↪',
                execute: async (messageReaction, user) => {
                    if (user.id !== this.userID) return;
                    if (this.message && this.message.deletable)
                        await this.message.delete();
                    this.message = null;
                    this.playQueue.addtoQueue(this);
                }
            }],
        }
    }
}