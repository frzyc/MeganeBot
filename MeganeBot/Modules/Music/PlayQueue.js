const request = require('request');
const YoutubeDL = require('youtube-dl');
const ytdlc = require('ytdl-core');
const { MessageUtil, Util } = require('../../../MeganeClient');
const VoiceController = require('./VoiceController');
//TODO read through the messages, and make stuff more logical?
module.exports = class PlayQueue {
    constructor(client, guildID) {
        if (!client) throw Error('PlayQueueManager needs a client.');
        Object.defineProperty(this, 'client', { value: client });
        this.list = [];
        this.guildID = guildID;
        this.current = null;
        this.lastAdded = null;
        this.tchannel = null;
        this.voiceController = new VoiceController(client, this, guildID);
        this.trackId = 0;
        this.MAX_NUM_SONGS_PER_PLAYLIST = 100;
        this.playlistMessage = null;
    }
    async addtoQueue(track) {
        if (this.list.length >= this.MAX_NUM_SONGS_PER_PLAYLIST)
            return (new MessageUtil(client, { destination: message, messageContent: `The Playlist size has been maxed: ${pq.MAX_NUM_SONGS_PER_PLAYLIST}`, deleteTime: 30 })).execute();
        track.trackId = this.getTrackId();//generates a unique trackID for each queued song, even if it has been requeued
        this.list.push(track);
        this.lastAdded = track;
        if (this.list.length === 1) this.updatePlayingMessage();//update the next playing part of playing message
        this.updatePlaylistMessage();
        if (!this.tchannel) return;
        let msgresolvable = track.getQueuedMessageResolvable();
        let msg = await (new MessageUtil(this.client, msgresolvable)).execute();
        track.message = msg;
        if (!this.current)
            this.playNextInQueue();
    }
    removefromQueue(trackId) {
        //console.log(`removefromQueue:${trackId}`)
        let ind = this.list.findIndex((track) => track.trackId === trackId);
        if (ind < 0) return console.log(`removefromQueue:${trackId} FAILED TO FIND VIDEO IN QUEUE`);
        let track = this.list.splice(ind, 1)[0];
        if (ind === 0) this.updatePlayingMessage();
        this.updatePlaylistMessage();
        //edit the queue messgae of the track to indicate it has been dequeued
        (new MessageUtil(this.client, track.getDequeuedMessageResolvable())).execute();
    }
    shuffleQueue() {
        if (this.list.length > 1) {
            shuffleArray(this.list);
            this.updatePlayingMessage();
            this.updatePlaylistMessage();
            (new MessageUtil(this.client, { destination: this.tchannel, messageContent: `Playlist Shuffled.`, deleteTime: 30 })).execute();
        }
        function shuffleArray(array) {
            for (var i = array.length - 1; i > 0; i--) {
                var j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        }
    }
    async playNextInQueue() {
        console.log("PlayQueue.playNextInQueue");
        if (this.current) return;//already have something playing
        if (this.list.length > 0) {
            let voiceConn = this.voiceController.getVoiceConnection();// just in case the player left the channel...
            if (!voiceConn) await this.voiceController.vchannel.join()
            this.play(this.list.shift());
        } else {
            setTimeout(() => {
                if (this.list.length > 0 || this.current) return;
                const voiceConnection = this.voiceController.getVoiceConnection();
                if (voiceConnection && voiceConnection.player.dispatcher)
                    voiceConnection.player.dispatcher.end();
                voiceConnection.channel.leave();
            }, 60 * 1000);
        }
    }
    /**
     * Will play the track. dispatcher using either youtube-core(for youtube videos) or youtube-dl(for everything else)
     * Will delete the message of the track. 
     * @param {Track} track 
     */
    play(track) {
        this.current = track;
        const voiceConnection = this.voiceController.getVoiceConnection();
        if (voiceConnection == null) {
            //if somehow the voice connection is gone...
            //console.log("reconnect to vchannel again");
            if (this.voiceController.vchannel) this.voiceController.vchannel.join().then(() => {
                //console.log("rejoined, then play");
                this.play(track);
            });
            return;
        }
        const currentStream = (track.extractor && track.extractor === "youtube") ?
            ytdlc(track.webpage_url, { audioonly: true }) :
            YoutubeDL(track.webpage_url, ['--format', 'bestaudio/best']);
        currentStream.on('info', (info) => {
            console.log("YoutubeDL info");
            console.log(info)
        });
        currentStream.on('error', (err) => {
            console.log("YoutubeDL Error");
            console.error(err)
        });
        currentStream.on('complete', function complete(info) {
            console.log('YoutubeDL completed:');
            console.log(info);
        });
        currentStream.on('end', function () {
            console.log('YoutubeDL finished downloading!');
        });

        const streamOptions = { seek: 0, volume: this.voiceController.volume };
        let disp = voiceConnection.playStream(currentStream, streamOptions);
        disp.once('start', () => {
            console.log("DISPATCHER START");
        });
        disp.once('end', reason => {
            console.log("DISPATCHER END:" + reason);
            setTimeout(() => this.playStopped(), 1000);
        });
        disp.once('error', (err) => {
            console.log("DISPATCHER ERROR:");
            console.error(err);
            setTimeout(() => this.playStopped(), 1000);
        });
        disp.once('debug', (debug) => {
            console.log("DISPATCHER DEBUG:");
            console.log(debug);
        });
        this.voiceController.paused = false;//reset the state
        if (track.message != null && track.message.deletable) {//delete the queue message
            track.message.delete();
            track.message = null;
        }
        this.sendPlayingmessage();
    }
    /**
     * will send a brand new now playing message. will remove the original one.
     */
    async sendPlayingmessage() {
        let track = this.current;
        if (track.message && track.message.deletable) await track.message.delete();//refresh with a new one
        let playingmsgres = track.getPlayingmessageResolvable();
        playingmsgres.destination = this.tchannel;
        let re = await (new MessageUtil(this.client, playingmsgres)).execute();
        track.message = re;
    }
    updatePlayingMessage() {
        if (this.current && this.current.message) {
            let playingmsgres = this.current.getPlayingmessageResolvable(this.current.message);
            playingmsgres.edit = true;
            (new MessageUtil(this.client, playingmsgres)).execute();
        }
    }
    getPlaylistmessageResolvable(editmsg) {
        let playlistMsgRes = {
            messageOptions: {
                embed: {
                    color: 6561480,//Purpleish
                    title: `${this.voiceController.paused ? 'Paused' : 'Playing'} ${this.current.title}`,
                    url: this.current.webpage_url,
                    thumbnail: {
                        url: this.current.thumbnail,
                    },
                }
            },
        }
        playlistMsgRes.messageOptions.embed.fields = [];
        for (let i = 0; i < 25 && i < this.list.length; i++) {
            playlistMsgRes.messageOptions.embed.fields.push({
                name: this.list[i].title,
                value: `[${this.list[i].formatTime}](${this.list[i].webpage_url})`,
            })
            //TODO accumulate remaining songs into the last field
        }
        if (editmsg) {
            playlistMsgRes.destination = editmsg;
            playlistMsgRes.edit = true;
        } else {
            playlistMsgRes.destination = this.tchannel;
        }
        return playlistMsgRes;
    }
    async sendPlaylistMessage() {//send a brand new playlist message instead of editing the original one
        if (this.playlistMessage && this.playlistMessage.deletable) this.playlistMessage.delete();
        let playlistmsgres = this.getPlaylistmessageResolvable();
        playlistmsgres.destination = this.tchannel;
        this.playlistMessage = await (new MessageUtil(this.client, playlistmsgres)).execute();
    }
    updatePlaylistMessage() {//edit the original playlist message
        if (this.playlistMessage) (new MessageUtil(this.client, this.getPlaylistmessageResolvable(this.playlistMessage))).execute();
    }
    async playStopped() {
        //console.log(`playQueue.playStopped in vchannel:${this.voiceController.vchannel}`);
        if (this.current.message)// modify the orginal playing message to show that its finished.
            await (new MessageUtil(this.client, this.current.getFinishedMessageResolvable())).execute();
        this.current = null;
        this.playNextInQueue();
    }
    getTrackId() {
        return ++this.trackId;
    }
}