const { Command } = require("../../../../MeganeClient")
module.exports = class QueuMusic extends Command {
    constructor(client) {
        super(client, {
            name: "Queue Music",
            commands: ["queue-music", "qm"],
            usage: "Add music to the playqueue",
            description: "Add a song/video/playlist to the playlist. works with youtube, soundcloud, and a bunch of other formats. Can search with URL, or just a search string(search string will search for a youtube video)",
            examples: [
                "queue-music Bohemian Rhapsody",
                "queue-music https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            ],
            args: [
                {
                    type: "string",
                    label: "query",
                    remaining: true,
                    description: "This can be either a phrase to search, or an URL for a video/song, or even a playlist!"
                }
            ],
            restriction: (cmdMsg) => {
                if (!cmdMsg.message.guild)//if message doesnt have a guild:
                    return "This command is not supported here."//this is most likely a DM channel, so this is probably not supported.
            }
        })
    }
    async execute(message, args) {
        let pq = this.module.playQueueManager.getPlayQueue(message.guild.id)
        if (!pq.voiceController.getVoiceConnection())
            if (!(await pq.voiceController.joinvoice(message))) return
        pq.queryYTDL(args["query"], message)
    }
}
