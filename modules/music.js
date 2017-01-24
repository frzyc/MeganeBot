//const request = require('superagent');
const ytdl = require('ytdl-core');
const Req = require('request');

const util = require.main.exports.getRequire('util');
const command = require.main.exports.getRequire('command').command;
const cmdModuleobj = require.main.exports.getRequire('command').cmdModuleobj;

const client = require.main.exports.client;
const config = require.main.exports.getRequire('config');

let cmdModule = new cmdModuleobj('Music');
cmdModule.description = `Music commands`
cmdModule.serverOnly = true;
exports.cmdModule = cmdModule;

const MAX_NUM_SONGS_PER_PLAYLIST = 500;
var queueList = {};//stores queuelists for all servers
queueList.hasPlayQueue = function (guildid) {
    if (guildid in queueList) return true
    else return false
}
queueList.getPlayQueue = function (guildid) {
    if (queueList.hasPlayQueue(guildid))
        return queueList[guildid];
    else
        return null;
}
queueList.getOrCreatePlayQueue = function (guildid) {
    if (!queueList.hasPlayQueue(guildid))
        queueList[guildid] = new playQueue();
    return queueList.getPlayQueue(guildid);
}

var playQueue = function () {
    this.list = [];
    this.guildid = null;
    this.current = null;
    this.tchannel = null;
    this.vchannel = null;
    this.volume = 0.15;//default volume
    this.trackId = 0;
    this.paused = false;
};
playQueue.prototype.addtoQueue = function (videoObj,message) {
    console.log("playQueue.addtoQueue");
    if (this.list.length >= MAX_NUM_SONGS_PER_PLAYLIST) return util.sendMessage(util.redel('Max Playlist size.'), null, this.tchannel);
    this.list.push(videoObj);
    if (this.list.length === 1) this.updatePlayingMessage();//update the next playing part of playing message
    videoObj.trackId = this.getTrackId();
    if (this.tchannel) {
        let msgresolvable = {
            messageContent: `Queued ${videoObj.prettyPrint()}`,
            emojiButtons: [{
                emoji: '❌',
                process: (messageReaction, user) => {
                    if (videoObj.userId != user.id) return;
                    messageReaction.remove();
                    this.removefromQueue(videoObj.trackId);
                    //return Promise.resolve({ message: messageReaction.message, messageContent: `Dequeued ${videoObj.prettyPrint()}`, deleteTime: 30 * 1000 })
                    return Promise.resolve();
                }
            }],
        }
        if (message) msgresolvable.message = message;

        util.createMessage(msgresolvable
            , null, this.tchannel).then(msg => {
            videoObj.queueMessage = msg;
            console.log(videoObj.queueMessage);
            this.playNextInQueue();
        }, err => {
            console.error(err);
            this.playNextInQueue();//just incase music is allowed but text isnt?
        });
    }
    console.log("playQueue.list.length:" + this.list.length);
}
playQueue.prototype.removefromQueue = function (trackId) {
    console.log(`removefromQueue:${trackId}`)
    let ind = this.list.findIndex((track) => track.trackId === trackId);
    if (ind < 0) return console.log(`removefromQueue:${trackId} FAILED TO FIND VIDEO IN QUEUE`);
    let vid = this.list.splice(ind, 1)[0];
    util.createMessage({ message: vid.queueMessage, messageContent: `Dequeued ${vid.prettyPrint()}`, deleteTime: 30 * 1000 });
}
playQueue.prototype.playNextInQueue = function () {
    console.log("playQueue.playNextInQueue");
    if (this.current) return;//already have something playing
    if (this.list.length > 0)
        this.play(this.list.shift());
}
playQueue.prototype.play = function (video) {
    console.log("playQueue.play");
    this.current = video;
    const voiceConnection = client.voiceConnections.get(this.guildid);
    if (voiceConnection == null) return console.log('there is no voice connection.....');

    let currentStream = Req(video.url);
    currentStream.on('error', (err) => console.error(err));
    const streamOptions = { seek: 0, volume: this.volume };
    let disp = voiceConnection.playStream(currentStream, streamOptions);
    disp.once('end', () => {
        console.log("dispatcher end");
        setTimeout(() => this.playStopped(), 1000);
    });
    if (this.tchannel) {
        let playmsgres = this.getPlayingmessageResolvable();
        playmsgres.emojiButtons = [
            {
                emoji: '⏯',
                process: (messageReaction, user) => {
                    if (this.paused) this.resume();
                    else this.pause();
                    return Promise.resolve();//already updates the message, so no point updating message again...//this.getPlayingmessageResolvable(messageReaction.message)
                }
            },
            {
                emoji: '⏭',
                process: (messageReaction, user) => {
                    this.stop();
                    return Promise.resolve();
                }
            },
            {
                emoji: '🔉',
                process: (messageReaction, user) => {
                    this.volDec();
                    return Promise.resolve();//already updates the message, so no point updating message again...//this.getPlayingmessageResolvable(messageReaction.message)
                }
            },
            {
                emoji: '🔊',
                process: (messageReaction, user) => {
                    this.volInc();
                    return Promise.resolve();//already updates the message, so no point updating message again...//this.getPlayingmessageResolvable(messageReaction.message)
                }
            }
        ];
        util.createMessage(playmsgres, null, this.tchannel).then(msg => {
            video.playingMessage = msg;
            if (video.queueMessage != null && video.queueMessage.deletable) {
                video.queueMessage.delete();
                video.queueMessage = null;
            }
        });
    }
        //client.user.setGame(video.title);
    
}
playQueue.prototype.getPlayingmessageResolvable = function (editmsg) {
    if (!this.current) return;
    let playmsgresolvable = {
        //messageContent: `${this.paused ? 'Paused' : 'Playing'} ${this.current.prettyPrint()}\nVolume: ${this.getVol()}`,
        messageOptions: {
            embed: {
                color: 3447003,
                title: `${this.paused ? 'Paused' : 'Playing'} ${this.current.title}`,
                url: this.current.webpage_url,
                //description: 'This is a test embed to showcase what they look like and what they can do.',
                thumbnail: {
                    url: this.current.thumbnail,
                },
                fields: [
                    {
                        name: 'Uploader',
                        value: this.current.uploader
                    },
                    {
                        name: 'Duration',
                        value: this.current.formatTime()
                    },
                    {
                        name: 'Volume',
                        value: this.getVol()
                    },
                    {
                        name: 'Playing Next',
                        value: this.list[0] ? this.list[0].title : `None`
                    }
                ],
            }
        },
    }
    if (editmsg)
        playmsgresolvable.message = editmsg;
    return playmsgresolvable;
}
playQueue.prototype.updatePlayingMessage = function () {
    if (this.current && this.current.playingMessage) util.createMessage(this.getPlayingmessageResolvable(this.current.playingMessage));
}
playQueue.prototype.playStopped = function () {
    console.log(`playQueue.playStopped in vchannel:${this.vchannel}`);
    let vid = this.current;
    if (vid.playingMessage)
        util.createMessage({
            message: vid.playingMessage,
            messageContent: `Finished playing **${vid.title}**`,
            messageOptions: {
                embed: {}
            },
            emojiButtons: [{
                emoji: '↪',
                process: (messageReaction, user) => {
                    this.addtoQueue(vid, vid.playingMessage);
                    return Promise.resolve()
                }
            }],
        });
    //client.user.setGame('');
    this.current = null;
    const voiceConnection = client.voiceConnections.get(this.guildid);
    if (voiceConnection == null) return console.log('there is no voice connection.....');
    this.playNextInQueue();
}
playQueue.prototype.stop = function () {
    const voiceConnection = client.voiceConnections.get(this.guildid);
    if (voiceConnection != null) {
        voiceConnection.player.dispatcher.end();
    }
}
playQueue.prototype.pause = function () {
    const voiceConnection = client.voiceConnections.get(this.guildid);
    if (voiceConnection != null) {
        voiceConnection.player.dispatcher.pause();
        this.paused = true;
        this.updatePlayingMessage();
        return true;
    }
    return false;
}
playQueue.prototype.resume = function () {
    const voiceConnection = client.voiceConnections.get(this.guildid);
    if (voiceConnection != null) {
        voiceConnection.player.dispatcher.resume();
        this.paused = false;
        this.updatePlayingMessage();
        return true;
    }
    return false;
}
playQueue.prototype.getVol = function () {
    const voiceConnection = client.voiceConnections.get(this.guildid);
    if (voiceConnection == null) return false;
        return getDisplayVolume(voiceConnection.player.dispatcher.volume);
}
playQueue.prototype.setVolLog = function (val) {
    const voiceConnection = client.voiceConnections.get(this.guildid);
    if (voiceConnection == null) return false;
    voiceConnection.player.dispatcher.setVolumeLogarithmic((val / 100));
    this.volume = voiceConnection.player.dispatcher.volume;
    this.updatePlayingMessage();
}
playQueue.prototype.setVoldB = function (val) {
    const voiceConnection = client.voiceConnections.get(this.guildid);
    if (voiceConnection == null) return false;
    voiceConnection.player.dispatcher.setVolumeLogarithmic((val));
    this.volume = voiceConnection.player.dispatcher.volume;
    this.updatePlayingMessage();
}
playQueue.prototype.volInc = function () {
    if (this.getVol() === 200) return;
    let vol = this.getVol();
    vol = Math.round(vol / 10) * 10 + 10;
    if (vol > 200) vol = 200;
    this.setVolLog(vol);
}
playQueue.prototype.volDec = function () {
    if (this.getVol() === 0) return;
    let vol = this.getVol();
    vol = Math.round(vol / 10) * 10 - 10;
    if (vol <0) vol = 0;
    this.setVolLog(vol);
}
playQueue.prototype.getTrackId = function () {
    return ++this.trackId;
}

var Track = function (info) {
    this.info = info;
    this.title = info.title;
    this.url = info.url;
    this.thumbnail = info.thumbnail;
    this.extractor = info.extractor;
    this.webpage_url = info.webpage_url;
    this.uploader = info.uploader;
    this.lengthSeconds = info.duration;
    this.userId = null;
    this.playingMessage = null;
    this.queueMessage = null;
}
Track.prototype.formatTime = function () { return util.formatTime(this.lengthSeconds); };
Track.prototype.prettyPrint = function () { return `**${this.title}** by **${this.uploader}** [${this.formatTime()}]`; };
Track.prototype.fullPrint = function () { return `${this.prettyPrint()}, added by <@${this.userId}>`; };
Track.prototype.getTime = function () { return this.lengthSeconds; };

function getAuthorVoiceChannel(msg) {
    var voiceChannelArray = msg.guild.channels.filter((v) => v.type == "voice").filter((v) => v.members.has(msg.author.id)).array();
    if (voiceChannelArray.length == 0) return null;
    else return voiceChannelArray[0];
}

function canJoinUserVoice(msg) {
    const voiceConnection = client.voiceConnections.get(msg.guild.id);
    //if (voiceConnection != null) return reject('already in a channel'); //means bot already in a voice channel on this server... will just join the one the user is in
    var voiceChannel = getAuthorVoiceChannel(msg);
    if (voiceChannel == null) return {
        bool: false,
        msg: 'BAKA... You are not in a voice channel.'
    };
    if (voiceConnection != null && voiceConnection.channel.id === voiceChannel.id) return {
        bool: false,
        samechannel:true,
        msg: "BAKA... I'm already here! "
    };
    return {
        bool: true,
        channel: voiceChannel
    }
}
function leaveVoice(msg) {
    const voiceConnection = client.voiceConnections.get(msg.guild.id);
    if (voiceConnection == null) return;
        voiceConnection.player.dispatcher.end();
        voiceConnection.channel.leave();
}
function joinvoice(message) {
    return new Promise((resolve, reject) => {
        let canJoinUserVoiceResponse = canJoinUserVoice(message);
        let voiceChannel = null;
        if (canJoinUserVoiceResponse.bool)
            voiceChannel = canJoinUserVoiceResponse.channel;
        else if (canJoinUserVoiceResponse.samechannel) {
            return resolve(util.redel(canJoinUserVoiceResponse.msg));//technically a success cause already joined...
        } else {
            return reject(util.redel(canJoinUserVoiceResponse.msg));
        }
        util.createMessage({ messageContent: "Connecting..." }, message).then(re => {
            voiceChannel.join().then(conn => {
                let pq = queueList.getOrCreatePlayQueue(message.guild.id);
                pq.tchannel = message.channel;
                pq.vchannel = voiceChannel;
                pq.guildid = message.guild.id;
                pq.playNextInQueue();//just in case...
                console.log(`joinvoice: server:${message.guild.name}, vchannel: ${pq.vchannel.name}, tchannel: ${pq.tchannel.name}`);
                util.createMessage({
                    message: re,
                    messageContent: `Connected to voice channel **${pq.vchannel.name}**, I will accept all music commands in this text channel: **${pq.tchannel.name}**.`
                });
                return resolve();
            }).catch(console.error);
        }).catch(console.error);
    })
}

let joinvoicecmd = new command(['joinvoice']);
joinvoicecmd.reqBotPerms = ["CONNECT", "SPEAK"];
joinvoicecmd.serverCooldown = 5;//5 seconds
joinvoicecmd.process = function (message, args) {
    return joinvoice(message);
}
cmdModule.addCmd(joinvoicecmd);

let leavevoice = new command(['leavevoice']);
leavevoice.process = function (message, args) {
    leaveVoice(message);
    //TODO delete queue?
    return Promise.resolve();
}
cmdModule.addCmd(leavevoice);

let pause = new command(['pause']);
pause.channelCooldown = 3;
pause.process = function (message, args) {
    if (!queueList.hasPlayQueue(message.guild.id)) return Promise.reject(util.redel("I should join a voice channel first."));
    let pq = queueList.getPlayQueue(message.guild.id);
    if (pq.tchannel.id !== message.channel.id) return Promise.reject();//wrong chat bro
    if (pq.pause()) return Promise.resolve({ messageContent: "Music Paused." });
    else return Promise.reject(util.redel('Not in a voice channel.'));
}
cmdModule.addCmd(pause);

let resume = new command(['resume']);
resume.channelCooldown = 3;
resume.process = function (message, args) {
    if (!queueList.hasPlayQueue(message.guild.id)) return Promise.reject(util.redel("I should join a voice channel first."));
    let pq = queueList.getPlayQueue(message.guild.id);
    if (pq.tchannel.id !== message.channel.id) return Promise.reject();//wrong chat bro
    if (pq.resume()) return Promise.resolve({ messageContent: "Music Resumed." });
    else return Promise.reject(util.redel('Not in a voice channel.'));
}
cmdModule.addCmd(resume);

let volumecmd = new command(['volume','vol']);
volumecmd.usage = [
    `** get the current volume`,
    `[value]** Sets the volume in percentage. Must be < 200`,
    `[vaule]%** Set the volume in percentage. Must be < 200%`,
    //`[vaule]dB** Set the volume in decibels. limited to [-50dB, 10dB]`,
    
];
volumecmd.argsTemplate = [
    [util.staticArgTypes['none']],
    [new util.customType((args, message) => {
        let match = args.match(/^(1?\d{0,2})$/);
        if (match) return parseInt(match[1]);
    })],
    [new util.customType((args, message) => {
        let match = args.match(/^(1?\d{0,2})%$/);
        if (match) return parseInt(match[1]);
    })],
    /*[new util.customType((args, message) => {
        let match = args.match(/^([-+]?[0-9]+)dB$/); 
        if (match) {
            let voldB = parseInt(match[1])
            if (voldB <= 10 && voldB >= -50) return voldB;
        }
    })],*/
];

function getDisplayVolume(vol) {
    console.log(`getDisplayVolume:${vol}`)
    if (isNaN(vol)) vol = 0;
    return Math.round(Math.pow(vol, 0.6020600085251697) * 100.0);
}
function getSystemVolFromDisplay(disvol) {
    return Math.pow((disvol / 100), 1.660964);
}
volumecmd.process = function (message, args) {
    if (!queueList.hasPlayQueue(message.guild.id)) return Promise.reject(util.redel("I should join a voice channel first."));
    let pq = queueList.getPlayQueue(message.guild.id);
    if (!pq.tchannel || pq.tchannel.id !== message.channel.id) return;
    if (client.voiceConnections.get(message.guild.id) == null) return Promise.reject(util.redel("Not in a voice channel."));
    if (args[3]) {//dB
        pq.setVoldB(args[3][0])
    } else if (args[2]) {//%
        pq.setVolLog(args[2][0])
    } else if (args[1]) {//Sets the volume relative to the input stream
        pq.setVolLog(args[1][0])
    } //else print the volume
    return Promise.resolve({ messageContent: `Volume: ${pq.getVol()}` })
}
cmdModule.addCmd(volumecmd);


let nextcmd = new command(['next']);
nextcmd.usage = [
    `** Skip to the next song in the playlist.`,
    `[number of songs]** Skip a few songs in the playlist.`
];
nextcmd.argsTemplate = [
    [util.staticArgTypes['none']],
    [util.staticArgTypes['posint']]
];
nextcmd.process = function (message, args) {
    console.log(`NEXTCMD`);
    if (!queueList.hasPlayQueue(message.guild.id)) return Promise.reject(util.redel("I should join a voice channel first."));
    let pq = queueList.getPlayQueue(message.guild.id);
    if (!pq.tchannel || pq.tchannel.id !== message.channel.id) return;
    let msg = null
    let amt = 0;
    if (args[1]) {//2nd usage
        amt = args[1][0] - 1;//cause the current song is going to be end()
        if (amt > 1) {
            let removing = pq.list.slice(0, amt);
            removing.forEach((track) => pq.removefromQueue(track.trackId));
        }
    }
    pq.stop();
    return Promise.resolve(amt > 1 ? util.redel(`${amt} songs have been removed from the playqueue.`) : undefined);
}
cmdModule.addCmd(nextcmd);

let clearpl = new command(['plclear', 'plc']);
clearpl.process = function (message, args) {
    if (!queueList.hasPlayQueue(message.guild.id)) return Promise.reject(util.redel("I should join a voice channel first."));
    let pq = queueList.getPlayQueue(message.guild.id);
    if (!pq.tchannel || pq.tchannel.id !== message.channel.id) return Promise.reject();
    pq.list.forEach((track) => pq.removefromQueue(track.trackId));
    return Promise.resolve({ messageContent: "Playlist cleared." });
}
cmdModule.addCmd(clearpl);

let plpop = new command(['playlistpop', 'plpop']);
plpop.usage = [`**\nDequeue the last added song from the playlist.`];
plpop.process = function (message, args) {
    if (!queueList.hasPlayQueue(message.guild.id)) return Promise.reject(util.redel("I should join a voice channel first."));
    let pq = queueList.getPlayQueue(message.guild.id);
    if (!pq.tchannel || pq.tchannel.id !== message.channel.id) return Promise.reject();
    let pvideo = pq.list[pq.list.length - 1];
    if (!pvideo) return Promise.reject();
    pq.removefromQueue(pvideo.trackId)
    return Promise.resolve();
}
cmdModule.addCmd(plpop);

let playlistcmd = new command(['playlist', 'pl']);
playlistcmd.usage = [`**\nDisplay the playlist.`];
playlistcmd.process = function (message, args) {
    if (!queueList.hasPlayQueue(message.guild.id)) return Promise.reject(util.redel("I should join a voice channel first."));
    let pq = queueList.getPlayQueue(message.guild.id);
    if (!pq.tchannel || pq.tchannel.id !== message.channel.id) return;
    var formattedList = '';
    var overallTime = 0;
    if (pq.current) {
        formattedList += `Currently playing: ${pq.current.fullPrint()}\n`;
        overallTime = Number(pq.current.getTime());
    }
    if (pq.list.length === 0) {
        formattedList += `The play queue is empty!`;
    } else {
        formattedList += 'Here are the videos currently in the play queue: \n';
        var shouldBreak = false;
        pq.list.forEach((video, idx) => {
            overallTime = Number(overallTime) + Number(video.getTime());
            if (shouldBreak) return;
            var formattedVideo = `${idx + 1}. ${video.fullPrint()}\n`;

            if ((formattedList.length + formattedVideo.length) > 1920) {
                formattedList += `... and ${pq.list.length - idx} more`;
                shouldBreak = true;
            } else {
                formattedList += formattedVideo;
            }
        });
        formattedList += `\n**Remaining play time:** ${util.formatTime(overallTime)} minutes.`;
    }
    if (pq.playlistMessage && pq.playlistMessage.deletable) pq.playlistMessage.delete();
    util.createMessage({
        messageContent: formattedList,
        deleteTimeCmdMessage: 3 * 1000,
    }, null, pq.tchannel).then((re) => {
        pq.playlistMessage = re;
    })
    return Promise.resolve();
}
cmdModule.addCmd(playlistcmd);

let queuemusic = new command(['queuemusic', 'qm']);
queuemusic.ownerOnly = true;
queuemusic.usage = [`[link to video/song/playlist or search strings]**\n add a song/video/playlist to the playlist`]
queuemusic.argsTemplate = [
    [util.staticArgTypes['string']]
];
queuemusic.process = function (message, args) {
    let YoutubeDL = require('youtube-dl');
    return new Promise((resolve, reject) => {
        joinvoice(message).then(() => queueytdl(args[0][0])).catch(reject);
    });
    function queueytdl(searchstring) {
        YoutubeDL.exec(searchstring, ['-q', '-J', '--flat-playlist', '-i', '-f', 'bestaudio/best', '--default-search', 'gvsearch1:'], {}, function (err, info) {
            if (err) throw err
            let pq = queueList.getOrCreatePlayQueue(message.guild.id);
            if (err) return util.createMessage(util.redel(`ERROR with query:${err}`), null, pq.tchannel);
            
            if (info.isArray || info instanceof Array) {
                info = info.map(v => JSON.parse(v))[0];
                if (info.url) {
                    let track = new Track(info);
                    pq.addtoQueue(track);
                    track.userId = message.author.id;
                } else if (info._type === 'playlist') {
                    if (pq.list.length + info.entries.length >= MAX_NUM_SONGS_PER_PLAYLIST)
                        return util.sendMessage(util.redel(`Adding this playlist will breach Max Playlist size.(${MAX_NUM_SONGS_PER_PLAYLIST})`), null, this.tchannel);
                    info.entries.forEach((entry, index) => {
                        setTimeout(() => {
                            if (entry.ie_key === 'Youtube') {//the url only have the id...
                                queueytdl('https://www.youtube.com/watch?v=' + entry.id);
                            } else
                                queueytdl(entry.url);
                        }, index * 3000);
                    });
                }
            }
        });
    } 
}
cmdModule.addCmd(queuemusic);


/*
youtube playlist
{
    entries: [ [Object], ...],
    webpage_url_basename: 'playlist',
    title: 'All Nightcore',
    id: 'PLkMRAPworbEelkUPJrQEF5pBTVgzNLxWG',
    webpage_url: 'https://www.youtube.com/playlist?list=PLkMRAPworbEelkUPJrQEF5pBTVgzNLxWG',
    extractor: 'youtube:playlist',
    extractor_key: 'YoutubePlaylist',
    _type: 'playlist'
}

soundcloud "set"
 { extractor: 'soundcloud:set',
    webpage_url_basename: 'electro-swing-elite-ese',
    entries: [ [Object], ...],
    _type: 'playlist',
    webpage_url: 'https://soundcloud.com/electro-swing-elite/sets/electro-swing-elite-ese',
    id: '266757238',
    extractor_key: 'SoundcloudSet',
    title: 'Electro Swing Elite - ESE Compilation 2016' }
*/