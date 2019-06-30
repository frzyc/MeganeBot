const { permissions } = require("../../../MeganeClient")
module.exports = class VoiceController {
    constructor(client, playQueue, guildID) {
        if (!client) throw Error("PlayQueueManager needs a client.")
        Object.defineProperty(this, "client", { value: client })
        this.playQueue = playQueue
        this.vchannel = null
        this.volume = 0.15//default volume
        this.paused = false
        this.guildID = guildID
    }
    getVoiceConnection() {
        const voiceConnection = this.client.voiceConnections.get(this.guildID)
        if (voiceConnection) return voiceConnection
        return null
    }
    getDispatcher() {
        const voiceConnection = this.getVoiceConnection()
        if (voiceConnection && voiceConnection.player.dispatcher)
            return voiceConnection.player.dispatcher
        return null
    }
    stop() {
        const voiceConnection = this.getVoiceConnection()
        if (voiceConnection != null && voiceConnection.player.dispatcher) {
            voiceConnection.player.dispatcher.end()
        }
    }
    pause() {
        let dispatcher = this.getDispatcher()
        if (!dispatcher) return false
        dispatcher.pause()
        this.paused = true
        this.playQueue.updatePlayingMessage()
        return true
    }
    resume() {
        let dispatcher = this.getDispatcher()
        if (!dispatcher) return false
        dispatcher.resume()
        this.paused = false
        this.playQueue.updatePlayingMessage()
        return true
    }
    getVol() {
        let dispatcher = this.getDispatcher()
        if (!dispatcher) return false
        return this.getDisplayVolume(dispatcher.volume)
    }
    getDisplayVolume(vol) {
        if (isNaN(vol)) vol = 0
        return Math.round(Math.pow(vol, 0.6020600085251697) * 100.0)
    }
    setVolLog(val) {
        let dispatcher = this.getDispatcher()
        if (!dispatcher) return false
        dispatcher.setVolumeLogarithmic((val / 100))
        this.volume = dispatcher.volume
        this.playQueue.updatePlayingMessage()
    }
    setVoldB(val) {
        let dispatcher = this.getDispatcher()
        if (!dispatcher) return false
        dispatcher.setVolumeLogarithmic((val))
        this.volume = dispatcher.volume
        this.playQueue.updatePlayingMessage()
    }
    volInc() {
        if (this.getVol() === 200) return
        let vol = this.getVol()
        vol = Math.round(vol / 10) * 10 + 10
        if (vol > 200) vol = 200
        this.setVolLog(vol)
    }
    volDec() {
        if (this.getVol() === 0) return
        let vol = this.getVol()
        vol = Math.round(vol / 10) * 10 - 10
        if (vol < 0) vol = 0
        this.setVolLog(vol)
    }
    getAuthorVoiceChannel(message) {
        var voiceChannelArray = message.guild.channels.filter((v) => v.type == "voice").filter((v) => v.members.has(message.author.id)).array()
        if (voiceChannelArray.length == 0) return null
        else return voiceChannelArray[0]
    }
    async leaveVoice() {
        const voiceConnection = this.getVoiceConnection()
        if (voiceConnection && voiceConnection.player.dispatcher)
            await voiceConnection.player.dispatcher.end()
        if (voiceConnection && voiceConnection.channel) voiceConnection.channel.leave()
    }
    async joinvoice(message) {
        let usrVoiceChannel = this.getAuthorVoiceChannel(message)
        if (usrVoiceChannel == null) {
            this.client.autoMessageFactory({ destination: message, messageContent: "BAKA... You are not in a voice channel.", deleteTime: 30 * 1000 })
            return false
        }
        const voiceConnection = this.client.voiceConnections.get(message.guild.id)

        if (voiceConnection != null && voiceConnection.channel.id === usrVoiceChannel.id) {
            this.client.autoMessageFactory({ destination: message, messageContent: "BAKA... I'm already here! " })
            return true//return true because connection success
        }
        //check required permissions
        const missing = usrVoiceChannel.permissionsFor(this.client.user).missing([
            "CONNECT",
            "SPEAK"
        ])
        if (missing.length > 0) {
            this.client.autoMessageFactory({
                destination: message,
                messageContent: `I don't have enough permissions to use this command. missing:\n${missing.map(p => permissions[p]).join(", and ")}`,
                deleteTime: 5 * 60 * 1000
            })
            return false
        }
        if (usrVoiceChannel && !usrVoiceChannel.joinable) {
            this.client.autoMessageFactory({ destination: message, messageContent: "Cannot join the voice channel. " })
            return false
        }
        let re = await this.client.autoMessageFactory({ destination: message, messageContent: "Connecting..." })
        await (usrVoiceChannel.join())
        this.playQueue.tchannel = message.channel
        this.vchannel = usrVoiceChannel
        this.playQueue.guildID = message.guild.id
        console.log(`joinvoice: server:${message.guild.name}, vchannel: ${this.playQueue.voiceController.vchannel.name}, tchannel: ${this.playQueue.tchannel.name}`)
        this.client.autoMessageFactory({
            destination: re,
            edit: true,
            messageContent: `Connected to voice channel **${this.playQueue.voiceController.vchannel.name}**, I will accept all music commands in this text channel: **${this.playQueue.tchannel.name}**.`
        })
        return true
    }
}
