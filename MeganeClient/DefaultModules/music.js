const request = require("request")
const YoutubeDL = require("youtube-dl")
const ytdlc = require("ytdl-core")
const util = require.main.exports.getRequire("util")
const Command = require.main.exports.getRequire("command")
const CommandModule = require.main.exports.getRequire("commandmodule")

const client = require.main.exports.client

let cmdModule = new CommandModule("Music")
cmdModule.description = "Music commands"
cmdModule.guildOnly = true
module.exports = cmdModule

const MAX_NUM_SONGS_PER_PLAYLIST = 100
var queueList = {}//stores queuelists for all servers
queueList.hasPlayQueue = function (guildid) {
    if (guildid in queueList) return true
    else return false
}
queueList.getPlayQueue = function (guildid) {
    if (queueList.hasPlayQueue(guildid))
        return queueList[guildid]
    else
        return null
}
queueList.getOrCreatePlayQueue = function (guildid) {
    if (!queueList.hasPlayQueue(guildid))
        queueList[guildid] = new playQueue()
    return queueList.getPlayQueue(guildid)
}

/*
* each playQueue represents music streaming on one server. The music module is binded to a textchannel(tchannel) and a voice channel(vchannel).
* keeps track of a list of music queued up
* keeps track of the current track being played
* keeps track of the current volume
* keeps the paused/playing state of the currently playing song
* has a counter for generating trackId
* also generates XXX types of messages:
* * queued track message: a message showing a track with a valid url and information to be played. can be removed from the list using emoji button or cmd
* * playing message: a message showing information about the currently playing song, with emoji button cmds to pause, skip, show playing list etc...
* * playlist message: a message that shows current song, and a list of songs in the queuelist. TODO pagenate
* * finished track message: a message showing a finished song. emoji button allows this song to be added again to the list.
*/
var playQueue = function () {
    this.list = []
    this.guildid = null
    this.current = null
    this.lastAdded = null
    this.tchannel = null
    this.vchannel = null
    this.volume = 0.15//default volume
    this.trackId = 0
    this.paused = false
}
playQueue.prototype.addtoQueue = function (trackObj,message) {
    if (this.list.length >= MAX_NUM_SONGS_PER_PLAYLIST) return util.sendMessage(util.redel("Max Playlist size."), null, this.tchannel)
    this.list.push(trackObj)
    this.lastAdded = trackObj
    trackObj.trackId = this.getTrackId()//generates a unique trackID for each queued song, even if it has been requeued
    if (this.list.length === 1) this.updatePlayingMessage()//update the next playing part of playing message
    this.updatePlaylistMessage()
    if (!this.tchannel) return
    let msgresolvable = {
        message: message,
        messageContent: `Queued ${trackObj.prettyPrint()}`,
        emojis: [{
            emoji: "❌",
            execute: (reactionMessage, user) => {
                if (user.id !== trackObj.userId) return
                reactionMessage.remove()
                this.removefromQueue(trackObj.trackId)
                //return Promise.resolve({ message: reactionMessage.message, messageContent: `Dequeued ${videoObj.prettyPrint()}`, deleteTime: 30 * 1000 })
                return Promise.resolve()
            }
        }],
    }

    util.createMessage(msgresolvable
        , null, this.tchannel).then(msg => {
        trackObj.queueMessage = msg
        this.playNextInQueue()
    }, err => {
        console.error(err)
        this.playNextInQueue()//just incase music is allowed but sending message isnt?
    })
    
}
playQueue.prototype.removefromQueue = function (trackId) {
    //console.log(`removefromQueue:${trackId}`)
    let ind = this.list.findIndex((track) => track.trackId === trackId)
    if (ind < 0) return console.log(`removefromQueue:${trackId} FAILED TO FIND VIDEO IN QUEUE`)
    let track = this.list.splice(ind, 1)[0]
    if (ind === 0) this.updatePlayingMessage()
    this.updatePlaylistMessage()
    //edit the queue messgae of the track to indicate it has been dequeued
    util.createMessage({ message: track.queueMessage, messageContent: `Dequeued ${track.prettyPrint()}`, deleteTime: 30 * 1000 })
}
playQueue.prototype.shuffleQueue = function () {
    if (this.list.length > 1) {
        shuffleArray(this.list)
        this.updatePlayingMessage()
        this.updatePlaylistMessage()
        util.createMessage({ messageContent: "Playlist Shuffled.", deleteTime: 30 * 1000 }, null, this.tchannel)
    }
    function shuffleArray(array) {
        for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1))
            var temp = array[i]
            array[i] = array[j]
            array[j] = temp
        }
        return array
    }
}
playQueue.prototype.playNextInQueue = function () {
    //console.log("playQueue.playNextInQueue");
    if (this.current) return//already have something playing
    if (this.list.length > 0) {
        let voiceConn = this.getVoiceConnection()// just in case the player left the channel...
        if (!voiceConn) this.vchannel.join().then(() => this.play(this.list.shift()))
        else this.play(this.list.shift())
    } else {
        setTimeout(() => {
            if (this.list.length > 0 || this.current) return
            const voiceConnection = this.getVoiceConnection()
            if (voiceConnection && voiceConnection.player.dispatcher)
                voiceConnection.player.dispatcher.end()
            voiceConnection.channel.leave()
        }, 60*1000)
    }
}
playQueue.prototype.play = function (track) {
    //console.log("playQueue.play");
    this.current = track
    const voiceConnection = this.getVoiceConnection()
    if (voiceConnection == null) {
        //if somehow the voice connection is gone...
        //console.log("reconnect to vchannel again");
        if (this.vchannel) this.vchannel.join().then(() => {
            //console.log("rejoined, then play");
            this.play(track)
        })
        return
    }
    const currentStream = (track.extractor && track.extractor==="youtube") ?
        ytdlc(track.webpage_url,{audioonly:true}):
        YoutubeDL(track.webpage_url, ["--format", "bestaudio/best"])
    currentStream.on("info", (info) => {
        console.log("YoutubeDL info")
        console.log(info)
    })
    currentStream.on("error", (err) => {
        console.log("YoutubeDL Error")
        console.error(err)
    })
    currentStream.on("complete", function complete(info) {
        console.log("YoutubeDL completed:")
        console.log(info)
    })
    currentStream.on("end", function () {
        console.log("YoutubeDL finished downloading!")
    })

    const streamOptions = { seek: 0, volume: this.volume }
    let disp = voiceConnection.playStream(currentStream, streamOptions)
    disp.once("start", () => {
        console.log("DISPATCHER START")
    })
    disp.once("end", reason => {
        console.log("DISPATCHER END:" + reason)
        setTimeout(() => this.playStopped(), 1000)
    })
    disp.once("error", (err) => {
        console.log("DISPATCHER ERROR:")
        console.error(err)
        setTimeout(() => this.playStopped(), 1000)
    })
    disp.once("debug", (debug) => {
        console.log("DISPATCHER DEBUG:")
        console.log(debug)
    })
    this.sendPlayingmessage()
}
playQueue.prototype.getPlayingMessageResolvable = function (editmsg) {
    if (!this.current) return
    let playmsgresolvable = {
        messageOptions: {
            embed: {
                color: 3447003,
                title: `${this.paused ? "Paused" : "Playing"} ${this.current.title}`,
                url: this.current.webpage_url,
                thumbnail: {
                    url: this.current.thumbnail,
                },
                fields: [
                    {
                        name: "Uploader",
                        value: this.current.uploader
                    },
                    {
                        name: "Duration",
                        value: this.current.formatTime()
                    },
                    {
                        name: "Volume",
                        value: this.getVol()
                    },
                    {
                        name: "Playing Next",
                        value: this.list[0] ? this.list[0].title : "None"
                    }
                ],
            }
        },
    }
    if (editmsg) {
        playmsgresolvable.message = editmsg
    } else {//if there is not a edit message, it means sending a new play message, so attach buttons to this new resolvable
        playmsgresolvable.emojis = [
            {
                emoji: "⏯",
                execute: (messageReaction, user) => {
                    if (this.paused) this.resume()
                    else this.pause()
                    return Promise.resolve()
                }
            },
            {
                emoji: "⏭",
                execute: (messageReaction, user) => {
                    this.stop()
                    return Promise.resolve()
                }
            },
            {
                emoji: "🔀",
                execute: (messageReaction, user) => {
                    this.shuffleQueue()
                    return Promise.resolve()
                }
            },
            {
                emoji: "🔉",
                execute: (messageReaction, user) => {
                    this.volDec()
                    return Promise.resolve()
                }
            },
            {
                emoji: "🔊",
                execute: (messageReaction, user) => {
                    this.volInc()
                    return Promise.resolve()
                }
            },
            {
                emoji: "🔠",
                execute: (messageReaction, user) => {
                    this.sendPlaylistMessage()
                    return Promise.resolve()
                }
            },
            {
                emoji: "⬇",
                execute: (messageReaction, user) => {
                    this.sendPlayingmessage()
                    return Promise.resolve()
                }
            }
        ]
    }
    return playmsgresolvable
}
playQueue.prototype.sendPlayingmessage= function () {
    if (this.current.playingMessage && this.current.playingMessage.deletable) this.current.playingMessage.delete()
    util.createMessage(this.getPlayingMessageResolvable(), null, this.tchannel).then((re) => {
        this.current.playingMessage = re
        if (this.current.queueMessage != null && this.current.queueMessage.deletable) {//delete the queue message
            this.current.queueMessage.delete()
            this.current.queueMessage = null
        }
    })
}
playQueue.prototype.updatePlayingMessage = function () {
    if (this.current && this.current.playingMessage) util.createMessage(this.getPlayingMessageResolvable(this.current.playingMessage))
}
playQueue.prototype.getPlaylistmessageResolvable = function (editmsg) {
    let formattedList = ""
    let overallTime = 0
    if (this.current) {
        formattedList += `Currently playing: ${this.current.fullPrint()}\n`
        overallTime = Number(this.current.getTime())
    }
    if (this.list.length === 0) {
        formattedList += "The play queue is empty!"
    } else {
        formattedList += "Here are the videos currently in the play queue: \n"
        let msgFull = false
        this.list.forEach((video, idx) => {
            overallTime = Number(overallTime) + Number(video.getTime())
            if (!msgFull) {
                let formattedVideo = `${idx + 1}. ${video.fullPrint()}\n`

                if ((formattedList.length + formattedVideo.length) > 1920) {
                    formattedList += `... and ${this.list.length - idx} more`
                    msgFull = true
                } else {
                    formattedList += formattedVideo
                }
            }
        })
        formattedList += `\n**Remaining play time:** ${util.formatTime(overallTime)} minutes.`
    }

    let playmsgresolvable = {
        messageContent: formattedList,
    }
    if (editmsg)
        playmsgresolvable.message = editmsg
    return playmsgresolvable
}
playQueue.prototype.sendPlaylistMessage = function () {//send a brand new playlist message instead of editing the original one
    if (this.playlistMessage && this.playlistMessage.deletable) this.playlistMessage.delete()
    util.createMessage(this.getPlaylistmessageResolvable(), null, this.tchannel).then((re) => {
        this.playlistMessage = re
    })
}
playQueue.prototype.updatePlaylistMessage = function () {//edit the original playlist message
    if (this.playlistMessage) util.createMessage(this.getPlaylistmessageResolvable(this.playlistMessage))
}
playQueue.prototype.playStopped = function () {
    //console.log(`playQueue.playStopped in vchannel:${this.vchannel}`);
    let curTrack = this.current
    if (curTrack.playingMessage)// modify the orginal playing message to show that its finished.
        util.createMessage({
            message: curTrack.playingMessage,
            messageContent: `Finished playing **${curTrack.title}**`,
            messageOptions: {
                embed: {}
            },
            emojis: [{
                emoji: "↪",
                execute: (messageReaction, user) => {
                    this.addtoQueue(curTrack, curTrack.playingMessage)
                    return Promise.resolve()
                }
            }],
        })
    this.current = null
    this.playNextInQueue()
}
playQueue.prototype.stop = function () {
    const voiceConnection = this.getVoiceConnection()
    if (voiceConnection != null && voiceConnection.player.dispatcher) {
        voiceConnection.player.dispatcher.end()
    }
}
playQueue.prototype.pause = function () {
    let dispatcher = this.getDispatcher()
    if (!dispatcher) return false
    dispatcher.pause()
    this.paused = true
    this.updatePlayingMessage()
    return true
}
playQueue.prototype.resume = function () {
    let dispatcher = this.getDispatcher()
    if (!dispatcher) return false
    dispatcher.resume()
    this.paused = false
    this.updatePlayingMessage()
    return true
}
playQueue.prototype.getVol = function () {
    let dispatcher = this.getDispatcher()
    if (!dispatcher) return false
    return getDisplayVolume(dispatcher.volume)
}
playQueue.prototype.setVolLog = function (val) {
    let dispatcher = this.getDispatcher()
    if (!dispatcher) return false
    dispatcher.setVolumeLogarithmic((val / 100))
    this.volume = dispatcher.volume
    this.updatePlayingMessage()
}
playQueue.prototype.setVoldB = function (val) {
    let dispatcher = this.getDispatcher()
    if (!dispatcher) return false
    dispatcher.setVolumeLogarithmic((val))
    this.volume = dispatcher.volume
    this.updatePlayingMessage()
}
playQueue.prototype.volInc = function () {
    if (this.getVol() === 200) return
    let vol = this.getVol()
    vol = Math.round(vol / 10) * 10 + 10
    if (vol > 200) vol = 200
    this.setVolLog(vol)
}
playQueue.prototype.volDec = function () {
    if (this.getVol() === 0) return
    let vol = this.getVol()
    vol = Math.round(vol / 10) * 10 - 10
    if (vol <0) vol = 0
    this.setVolLog(vol)
}
playQueue.prototype.getTrackId = function () {
    return ++this.trackId
}
playQueue.prototype.getVoiceConnection = function () {
    const voiceConnection = client.voiceConnections.get(this.guildid)
    if (voiceConnection) return voiceConnection
    return null
}
playQueue.prototype.getDispatcher = function () {
    const voiceConnection = this.getVoiceConnection()
    if (voiceConnection && voiceConnection.player.dispatcher)
        return voiceConnection.player.dispatcher
    return null
}

/*
* the track object keeps information about one song
* also keeps track of its queue message and playing message.
*/
var Track = function (info) {
    this.info = info
    this.title = info.title
    this.url = info.url
    this.thumbnail = info.thumbnail
    this.extractor = info.extractor
    this.webpage_url = info.webpage_url
    this.uploader = info.uploader
    this.lengthSeconds = info.duration
    this.userId = null
    this.playingMessage = null
    this.queueMessage = null
}
Track.prototype.formatTime = function () { return util.formatTime(this.lengthSeconds) }
Track.prototype.prettyPrint = function () { return `**${this.title}** by **${this.uploader}** [${this.formatTime()}]` }
Track.prototype.fullPrint = function () { return `${this.prettyPrint()}, added by <@${this.userId}>` }
Track.prototype.getTime = function () { return this.lengthSeconds }

function getAuthorVoiceChannel(message) {
    var voiceChannelArray = message.guild.channels.filter((v) => v.type == "voice").filter((v) => v.members.has(message.author.id)).array()
    if (voiceChannelArray.length == 0) return null
    else return voiceChannelArray[0]
}
function leaveVoice(message) {
    let pq = queueList.getPlayQueue(message.guild.id)
    if (pq.tchannel.id !== message.channel.id) return Promise.reject()//wrong chat bro
    const voiceConnection = pq.getVoiceConnection()
    if (voiceConnection && voiceConnection.player.dispatcher)
        voiceConnection.player.dispatcher.end()
    voiceConnection.channel.leave()
}
function joinvoice(message) {
    return new Promise((resolve, reject) => {
        let usrVoiceChannel = getAuthorVoiceChannel(message)
        if (usrVoiceChannel == null) return reject(util.redel("BAKA... You are not in a voice channel."))
        const voiceConnection = client.voiceConnections.get(message.guild.id)
        
        if (voiceConnection != null && voiceConnection.channel.id === usrVoiceChannel.id)  return resolve(util.redel("BAKA... I'm already here! "))//technically a success cause already joined...
        util.createMessage({ messageContent: "Connecting..." }, message).then(re => {
            usrVoiceChannel.join().then(conn => {
                let pq = queueList.getOrCreatePlayQueue(message.guild.id)
                pq.tchannel = message.channel
                pq.vchannel = usrVoiceChannel
                pq.guildid = message.guild.id
                pq.playNextInQueue()//just in case...
                console.log(`joinvoice: server:${message.guild.name}, vchannel: ${pq.vchannel.name}, tchannel: ${pq.tchannel.name}`)
                return resolve(util.createMessage({
                    message: re,
                    messageContent: `Connected to voice channel **${pq.vchannel.name}**, I will accept all music commands in this text channel: **${pq.tchannel.name}**.`
                }))
                
            }).catch(console.error)
        }).catch(console.error)
    })
}

let joinvoicecmd = new Command("joinvoice")
joinvoicecmd.usage = ["**{0}** Meganebot will join the current voice channel you are in. This also binds other music commands to this channel."]
joinvoicecmd.reqBotPerms = ["CONNECT", "SPEAK"]
joinvoicecmd.serverCooldown = 5//5 seconds
joinvoicecmd.process = function (message, args) {
    return joinvoice(message)
}
cmdModule.addCmd(joinvoicecmd)

let leavevoice = new Command("leavevoice")
leavevoice.usage = ["**{0}** Meganebot will leave the current voicechannel."]
leavevoice.process = function (message, args) {
    leaveVoice(message)
    return Promise.resolve()
}
cmdModule.addCmd(leavevoice)

let playingcmd = new Command("musicplaying")
playingcmd.usage = ["** Meganebot will reprint the current playing song."]
playingcmd.channelCooldown = 3
playingcmd.process = function (message, args) {
    if (!queueList.hasPlayQueue(message.guild.id)) return Promise.reject(util.redel("I should join a voice channel first."))
    let pq = queueList.getPlayQueue(message.guild.id)
    if (pq.tchannel.id !== message.channel.id) return Promise.reject()//wrong chat bro
    pq.sendPlayingmessage()
    return Promise.resolve()
}
cmdModule.addCmd(playingcmd)

let pause = new Command("pause")
pause.usage = ["**{0}** Pause song."]
pause.channelCooldown = 3
pause.process = function (message, args) {
    if (!queueList.hasPlayQueue(message.guild.id)) return Promise.reject(util.redel("I should join a voice channel first."))
    let pq = queueList.getPlayQueue(message.guild.id)
    if (pq.tchannel.id !== message.channel.id) return Promise.reject()//wrong chat bro
    if (pq.pause()) return Promise.resolve({ messageContent: "Music Paused." })
    else return Promise.reject(util.redel("Not in a voice channel."))
}
cmdModule.addCmd(pause)

let resume = new Command("resume")
resume.usage = ["**{0}** Resume song."]
resume.channelCooldown = 3
resume.process = function (message, args) {
    if (!queueList.hasPlayQueue(message.guild.id)) return Promise.reject(util.redel("I should join a voice channel first."))
    let pq = queueList.getPlayQueue(message.guild.id)
    if (pq.tchannel.id !== message.channel.id) return Promise.reject()//wrong chat bro
    if (pq.resume()) return Promise.resolve({ messageContent: "Music Resumed." })
    else return Promise.reject(util.redel("Not in a voice channel."))
}
cmdModule.addCmd(resume)

let volumecmd = new Command("volume")
volumecmd.aliases = ["vol"]
volumecmd.usage = [
    "**{0}** get the current volume",
    "**{0} [value]** Sets the volume in percentage. Must be < 200",
    "**{0} [vaule]%** Set the volume in percentage. Must be < 200%",
    //`[vaule]dB** Set the volume in decibels. limited to [-50dB, 10dB]`,
]
volumecmd.argsTemplate = [
    [util.staticArgTypes["none"]],
    [new util.customType((args, message) => {
        let match = args.match(/^(1?\d{0,2})$/)
        if (match) return parseInt(match[1])
    })],
    [new util.customType((args, message) => {
        let match = args.match(/^(1?\d{0,2})%$/)
        if (match) return parseInt(match[1])
    })],
    /*[new util.customType((args, message) => {
        let match = args.match(/^([-+]?[0-9]+)dB$/); 
        if (match) {
            let voldB = parseInt(match[1])
            if (voldB <= 10 && voldB >= -50) return voldB;
        }
    })],*/
]
function getDisplayVolume(vol) {
    //console.log(`getDisplayVolume:${vol}`)
    if (isNaN(vol)) vol = 0
    return Math.round(Math.pow(vol, 0.6020600085251697) * 100.0)
}
function getSystemVolFromDisplay(disvol) {
    return Math.pow((disvol / 100), 1.660964)
}
volumecmd.process = function (message, args) {
    if (!queueList.hasPlayQueue(message.guild.id)) return Promise.reject(util.redel("I should join a voice channel first."))
    let pq = queueList.getPlayQueue(message.guild.id)
    if (!pq.tchannel || pq.tchannel.id !== message.channel.id) return
    if (client.voiceConnections.get(message.guild.id) == null) return Promise.reject(util.redel("Not in a voice channel."))
    if (args[3]) {//dB
        pq.setVoldB(args[3][0])
    } else if (args[2]) {//%
        pq.setVolLog(args[2][0])
    } else if (args[1]) {//Sets the volume relative to the input stream
        pq.setVolLog(args[1][0])
    } //else print the volume
    return Promise.resolve(util.redel(`Volume: ${pq.getVol()}`))
}
cmdModule.addCmd(volumecmd)


let nextcmd = new Command("next")
nextcmd.usage = [
    "**{0}** Skip to the next song in the playlist.",
    "**{0} [number of songs]** Skip a few songs in the playlist."
]
nextcmd.argsTemplate = [
    [util.staticArgTypes["none"]],
    [util.staticArgTypes["posint"]]
]
nextcmd.process = function (message, args) {
    if (!queueList.hasPlayQueue(message.guild.id)) return Promise.reject(util.redel("I should join a voice channel first."))
    let pq = queueList.getPlayQueue(message.guild.id)
    if (!pq.tchannel || pq.tchannel.id !== message.channel.id) return
    let amt = 0
    if (args[1]) {//2nd usage
        amt = args[1][0] - 1//cause the current song is going to be end()
        if (amt > 1) {
            let removing = pq.list.slice(0, amt)
            removing.forEach((track) => pq.removefromQueue(track.trackId))
        }
    }
    pq.stop()
    return Promise.resolve(amt > 1 ? util.redel(`${amt} songs have been removed from the playqueue.`) : undefined)
}
cmdModule.addCmd(nextcmd)

let clearpl = new Command("plclear")
clearpl.aliases = ["plc"]
clearpl.usage = ["**{0}** Remove every song in the playqueue."]
clearpl.process = function (message, args) {
    if (!queueList.hasPlayQueue(message.guild.id)) return Promise.reject(util.redel("I should join a voice channel first."))
    let pq = queueList.getPlayQueue(message.guild.id)
    if (!pq.tchannel || pq.tchannel.id !== message.channel.id) return Promise.reject()
    pq.list.forEach((track) => pq.removefromQueue(track.trackId))
    return Promise.resolve({ messageContent: "Playlist cleared." })
}
cmdModule.addCmd(clearpl)

let plpop = new Command("playlistpop")
plpop.aliases = ["plpop"]
plpop.usage = ["**{0}** Dequeue the last added song from the playlist."]
plpop.process = function (message, args) {
    if (!queueList.hasPlayQueue(message.guild.id)) return Promise.reject(util.redel("I should join a voice channel first."))
    let pq = queueList.getPlayQueue(message.guild.id)
    if (!pq.tchannel || pq.tchannel.id !== message.channel.id) return Promise.reject()
    let pvideo = pq.lastAdded
    if (!pvideo) return Promise.reject()
    pq.removefromQueue(pvideo.trackId)
    return Promise.resolve()
}
cmdModule.addCmd(plpop)

let shufflecmd = new Command("shuffle")
shufflecmd.usage = ["**{0}** Shuffle the playqueue."]
shufflecmd.process = function (message, args) {
    if (!queueList.hasPlayQueue(message.guild.id)) return Promise.reject(util.redel("I should join a voice channel first."))
    let pq = queueList.getPlayQueue(message.guild.id)
    if (!pq.tchannel || pq.tchannel.id !== message.channel.id) return Promise.reject()
    pq.shuffleQueue()
    return Promise.resolve()
}
cmdModule.addCmd(shufflecmd)


let playlistcmd = new Command("playlist")
playlistcmd.aliases = ["pl"]
playlistcmd.usage = ["**{0}** Display the playlist."]
playlistcmd.process = function (message, args) {
    if (!queueList.hasPlayQueue(message.guild.id)) return Promise.reject(util.redel("I should join a voice channel first."))
    let pq = queueList.getPlayQueue(message.guild.id)
    if (!pq.tchannel || pq.tchannel.id !== message.channel.id) return
    pq.sendPlaylistMessage()
    if (message.deletable) message.delete(3 * 1000)
    return Promise.resolve()
}
cmdModule.addCmd(playlistcmd)

let queuemusic = new Command("queuemusic")
queuemusic.aliases = ["qm"]
queuemusic.ownerOnly = true
queuemusic.usage = ["**{0} [link to video/song/playlist or search strings]** add a song/video/playlist to the playlist"]
queuemusic.argsTemplate = [
    [util.staticArgTypes["string"]]
]
queuemusic.process = function (message, args) {
    return new Promise((resolve, reject) => {
        joinvoice(message).then(() => {
            let pq = queueList.getOrCreatePlayQueue(message.guild.id)
            queueytdl(args[0][0], pq, message)
                .then(() => {
                    console.log("return resolve queuemusic")
                    return resolve()
                })
                .catch((re) => {
                    console.log("return reject queuemusic")
                    return reject({
                        reply: true,
                        messageContent: re,
                        deleteTime: 30 * 1000,
                    })
                })
        }).catch(reject)
    })
    function queueytdl(searchstring, pq, message) {
        return new Promise((queueytdlResolve, queueytdlReject) => {
            YoutubeDL.exec(searchstring, ["--quiet", //Activate quiet mode
                "--extract-audio",
                "--dump-single-json", //Simulate, quiet but print JSON information.
                "--flat-playlist", //Do not extract the videos of a playlist, only list them.
                "--ignore-errors", //Continue on download errors, for example to skip unavailable videos in a playlist
                "--format", //FORMAT
                "bestaudio/best",
                "--default-search",
                "gvsearch1:"
            ], {}, function (err, info) {
                if (err) return queueytdlReject(`ERROR with query:${err}`)
                if (info || info.isArray || info instanceof Array) {
                    info = info.map(v => JSON.parse(v))[0]
                    if (info.url) {
                        let track = new Track(info)
                        if (message) track.userId = message.author.id
                        pq.addtoQueue(track)
                    } else if (info._type === "playlist") {
                        if (info.entries.length === 0) {//no valid search results
                            return queueytdlReject(`Query **"${searchstring}"** returns no valid results.`)
                        }
                        if (pq.list.length + info.entries.length >= MAX_NUM_SONGS_PER_PLAYLIST)
                            return queueytdlReject(`Adding this playlist will breach Max Playlist size.(${MAX_NUM_SONGS_PER_PLAYLIST})`)
                        info.entries.forEach((entry, index) => {
                            setTimeout(() => {
                                //if entry.ie_key === 'Youtube', the url only have the id...
                                queueytdl(entry.ie_key === "Youtube" ? "https://www.youtube.com/watch?v=" + entry.id : entry.url, pq, message)
                            }, index * 3000)
                        })
                    }
                }
                return queueytdlResolve()
            })
        })
    }
     
}
cmdModule.addCmd(queuemusic)

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