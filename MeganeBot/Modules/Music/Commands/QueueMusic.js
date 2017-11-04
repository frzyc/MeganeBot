const { MessageUtil, Command } = require('../../../../MeganeClient');
const Track = require('../Track');
const VoiceController = require('../VoiceController');
const YoutubeDL = require('youtube-dl');
module.exports = class QueuMusic extends Command {
    constructor(client) {
        super(client, {
            name: 'queue-music',
            aliases: ['qm'],
            usage: 'Add music to the playqueue',
            description: `Add a song/video/playlist to the playlist. works with youtube, soundcloud, and a bunch of other formats. Can search with URL, or just a search string(search string will search for a youtube video)`,
            examples: [
                'queue-music Bohemian Rhapsody',
                'queue-music https://www.youtube.com/watch?v=dQw4w9WgXcQ'
            ],
            args: [
                {
                    type: 'string',
                    label: 'query',
                    remaining: true,
                    description: 'This can be either a phrase to search, or an URL for a video/song, or even a playlist!'
                }
            ]
        })
    }
    async execute(message, args) {
        let pq = this.module.playQueueManager.getPlayQueue(message.guild.id);
        if (!pq.voiceController.getVoiceConnection())
            await pq.voiceController.joinvoice(message);
        try {
            queueytdl(args['query'], pq, message)
        } catch (err) {
            return (new MessageUtil(this.client, {
                destination: message,
                reply: true,
                messageContent: err,
                deleteTime: 30
            }))
        }
        function queueytdl(searchstring, pq, message) {
            YoutubeDL.exec(searchstring, ['--quiet', //Activate quiet mode
                '--extract-audio',
                '--dump-single-json', //Simulate, quiet but print JSON information.
                '--flat-playlist', //Do not extract the videos of a playlist, only list them.
                '--ignore-errors', //Continue on download errors, for example to skip unavailable videos in a playlist
                '--format', //FORMAT
                'bestaudio/best',
                '--default-search',
                'gvsearch1:'
            ], {}, function (err, info) {
                if (err) throw Error(`ERROR with query:${err}`);
                if (info || info.isArray || info instanceof Array) {
                    info = info.map(v => JSON.parse(v))[0];
                    if (info.url) {//single track
                        let track = new Track(pq, info);
                        if (message) track.userID = message.author.id;
                        pq.addtoQueue(track);
                    } else if (info._type === 'playlist') {
                        if (info.entries.length === 0) //no valid search results
                            throw Error(`Query **"${searchstring}"** returns no valid results.`);
                        if (pq.list.length + info.entries.length >= pq.MAX_NUM_SONGS_PER_PLAYLIST)
                            throw Error(`Adding this playlist will breach Max Playlist size.(${pq.MAX_NUM_SONGS_PER_PLAYLIST})`);
                        info.entries.forEach((entry, index) => {
                            setTimeout(() => {
                                //if entry.ie_key === 'Youtube', the url only have the id...
                                queueytdl(entry.ie_key === 'Youtube' ? 'https://www.youtube.com/watch?v=' + entry.id : entry.url, pq, message);
                            }, index * 3000);
                        });
                    }
                }
            });

        }
    }
}