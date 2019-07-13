const { Util } = require("@frzyc/meganeclient")
module.exports = class Track {
  constructor(playQueue, info, user) {
    this.playQueue = playQueue
    this.info = info
    this.title = info.title
    this.url = info.url
    this.thumbnail = info.thumbnail
    this.extractor = info.extractor
    this.webpage_url = info.webpage_url
    this.uploader = info.uploader
    this.lengthSeconds = info.duration
    this.user = user
    this.userID = this.user ? this.user.id : null
    this.message = null//used to keep track of the status messages
    this.formatTime = Util.formatTime(this.lengthSeconds)

    this.uploader = {
      name: "Uploader:",
      value: this.uploader
    }
    this.duration = {
      name: "Duration:",
      value: this.formatTime
    }
    this.footer = {
      icon_url: this.user ? this.user.avatarURL : null,
      text: `Queued by: ${this.user.username}`
    }
  }
  getTime() { return this.lengthSeconds }
  getPlayingMessageResolvable(editmsg) {
    let playmsgresolvable = {
      messageOptions: {
        embed: {
          color: 6604830,//Green
          title: `${this.playQueue.voiceController.paused ? "Paused:" : "Playing:"} ${this.title}`,
          url: this.webpage_url,
          thumbnail: {
            url: this.thumbnail,
          },
          fields: [
            this.uploader,
            this.duration,
            {
              name: "Volume",
              value: this.playQueue.voiceController.getVol()
            },
            {
              name: "Playing Next",
              value: this.playQueue.list[0] ? this.playQueue.list[0].title : "None"
            }
          ],
          footer: this.footer
        }
      },
    }
    if (editmsg) {
      playmsgresolvable.destination = editmsg
    } else {//if there is not a edit message, it means sending a new play message, so attach buttons to this new resolvable
      let vc = this.playQueue.voiceController
      playmsgresolvable.reactions = [
        {
          emoji: "⏯",
          execute: () => {
            if (vc.paused) vc.resume()
            else vc.pause()
          }
        },
        {
          emoji: "⏭",
          execute: () => {
            vc.stop()
          }
        },
        {
          emoji: "🔀",
          execute: () => {
            this.playQueue.shuffleQueue()
          }
        },
        {
          emoji: "🔉",
          execute: () => {
            vc.volDec()
          }
        },
        {
          emoji: "🔊",
          execute: () => {
            vc.volInc()
          }
        },
        {
          emoji: "🔠",
          execute: () => {
            this.playQueue.sendPlaylistMessage()
          }
        },
        {
          emoji: "⬇",
          execute: () => {
            this.playQueue.sendPlayingmessage()
          }
        }
      ]
    }
    return playmsgresolvable
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
            this.uploader,
            this.duration,
          ],
          footer: this.footer
        }
      },
      reactions: [{
        emoji: "↪",
        execute: async (messageReaction, user) => {
          if (user.id !== this.userID) return
          if (this.message && this.message.deletable)
            await this.message.delete()
          this.message = null
          this.playQueue.addToQueue(this)
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
            this.uploader,
            this.duration,
          ],
          footer: this.footer
        }
      },
      reactions: [{
        emoji: "❌",
        execute: async (reactionMessage, user) => {
          if (user.id !== this.userID) return
          await reactionMessage.remove()
          this.playQueue.removefromQueue(this.trackId)
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
          color: 3447003,//DARK RED
          title: `Dequeued: ${this.title}`,
          url: this.webpage_url,
          thumbnail: {
            url: this.thumbnail,
          },
          fields: [
            this.uploader,
            this.duration,
          ],
          footer: this.footer
        }
      },
      deleteTime: 3 * 60 * 1000,
      reactions: [{
        emoji: "↪",
        execute: async (messageReaction, user) => {
          if (user.id !== this.userID) return
          if (this.message && this.message.deletable)
            await this.message.delete()
          this.message = null
          this.playQueue.addToQueue(this)
        }
      }],
    }
  }
}
