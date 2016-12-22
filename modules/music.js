const request = require('superagent');
const ytdl = require('ytdl-core');
const command = require('./command.js');
const util = require('../util.js')
const client = require('../bot.js').client;
const config = require('../data/config.json');

//music
let clist = []
exports.cmdlist = clist;

const MAX_NUM_SONGS_PER_PLAYLIST = 100;
var queueList = {};//stores queuelists for all servers

var playQueue = function () {
    this.list = [];
    this.current = null;
    this.last = null;
    this.tchannel = null;
    this.vchannel = null;
    this.connection = null;
    this.dispatcher = null;
    this.volume = 0.25;//default volume
};
playQueue.prototype.addtoQueue = function (videoObj) {
    console.log("playQueue.addtoQueue");
    if (this.list.length >= MAX_NUM_SONGS_PER_PLAYLIST) return this.tchannel.sendMessage("Max Playlist size.");
    this.list.push(videoObj);
    if (this.tchannel) this.tchannel.sendMessage(`Queued ${videoObj.prettyPrint()}`);
    console.log("playQueue.list.length:" + this.list.length);
    if (!this.current) this.playNextInQueue();
}
playQueue.prototype.playNextInQueue = function () {
    console.log("playQueue.playNextInQueue");
    if (this.list.length > 0) {
        next = this.list.shift();
        this.play(next);
    }
}
playQueue.prototype.play = function (video) {
    console.log("playQueue.play");
    this.current = video;
    if (this.connection) {
        console.log("playQueue.play1");
        let currentStream = video.getStream();

        currentStream.on('error', (err) => {
            if (err.code === 'ECONNRESET') {
                if (this.tchannel) this.tchannel.sendMessage(`There was a network error during playback! The connection to YouTube may be unstable. Auto-skipping to the next video...`);
            } else {
                if (this.tchannel) this.tchannel.sendMessage(`There was an error during playback! **${err}**`);
            }
            console.log(`There was an error during from stream ${err}`);
        });

        console.log("after getStream()");

        //attach event to song end

        const streamOptions = { seek: 0, volume: this.volume };
        this.dispatcher = this.connection.playStream(currentStream, streamOptions);
        (function (pq) {
            pq.dispatcher.once('end', function () {
                (function (p) {
                    console.log("dispatcher end");
                    setTimeout(function () { p.playStopped(); }, 2000)// 2 second leeway for bad timing
                })(pq)
            });
        })(this)//CLOSURE cause the feels

        if (this.tchannel) this.tchannel.sendMessage(`Playing ${video.prettyPrint()}`);
        client.user.setGame(video.title);

    }
}
playQueue.prototype.playStopped = function () {
    console.log(`playQueue.playStopped in vchannel:${this.vchannel}`);
    this.dispatcher = null;
    if (this.tchannel) this.tchannel.sendMessage(`Finished playing **${this.current.title}**`);
    client.user.setGame('');
    this.last = this.current;
    this.current = false;
    this.playNextInQueue();

}

var Track = function (vid, info) {
    this.vid = vid;
    this.title = info.title;
    this.author = info.author;
    this.viewCount = info.viewCount || info.view_count;
    this.lengthSeconds = info.lengthSeconds || info.length_seconds;
}
Track.prototype.formatViewCount = function () { return this.viewCount ? this.viewCount.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : 'unknown'; };
Track.prototype.formatTime = function () { return util.formatTime(this.lengthSeconds); };
Track.prototype.prettyPrint = function () { return `**${this.title}** by **${this.author}** *(${this.formatViewCount()} views)* [${this.formatTime()}]`; };
Track.prototype.fullPrint = function () { return `${this.prettyPrint()}, added by <@${this.userId}>`; };
Track.prototype.getTime = function () { return this.lengthSeconds; };

var YoutubeTrack = function () {
    Track.apply(this, arguments);
};

YoutubeTrack.prototype = Object.create(Track.prototype);

YoutubeTrack.getInfoFromVid = function (vid, m, cb) {
    var requestUrl = '';
    if (vid.includes("www.youtube.com/watch?v="))//source is a link
        requestUrl = vid;
    else
        requestUrl = 'http://www.youtube.com/watch?v=' + vid; //source is just video ID
    ytdl.getInfo(requestUrl, (err, info) => {
        if (err) cb(err, undefined);
        else {
            var video = new YoutubeTrack(vid, info);
            video.userId = m.author.id;
            video.containedVideo = info;
            cb(undefined, video);
        }
    });
};

YoutubeTrack.prototype.getStream = function () {
    var options = {
        filter: 'audioonly',//filter: (format) => format.container === 'mp4'
        quality: 'lowest',
    };
    return ytdl.downloadFromInfo(this.containedVideo, options);
};


function getInfoAndQueue(vid, message, suppress) {
    if (!queueList[message.guild.id]) return;
    let pq = queueList[message.guild.id];
    console.log("getInfoAndQueue:" + vid);
    YoutubeTrack.getInfoFromVid(vid, message, (err, video) => {
        if (err) handleYTError(err);
        else pq.addtoQueue(video);
    });
}

function handleYTError(err) {
    if (!queueList[message.guild.id] || !queueList[message.guild.id].tchannel) return;
    let c = queueList[message.guild.id].tchannel;
    if (err.toString().indexOf('Code 150') > -1) {// Video unavailable in country
        c.sendMessage('This video is unavailable in the country the bot is running in! Please try a different video.');
    } else if (err.message == 'Could not extract signature deciphering actions') {
        c.sendMessage('YouTube streams have changed their formats, please update `ytdl-core` to account for the change!');
    } else if (err.message == 'status code 404') {
        c.sendMessage('That video does not exist!');
    } else {
        c.sendMessage('An error occurred while getting video information! Please try a different video.');
    }
    console.log(err.toString());
}


let joinvoice = new command(['joinvoice']);
joinvoice.process = function (message, args) {
    let vchannel = message.member.voiceChannel
    if (!vchannel) return message.reply("BAKA... You are not in a voice channel. ");
    message.reply("Connecting...").then(re => {
        vchannel.join().then(conn => {
            if (!queueList[message.guild.id])
                queueList[message.guild.id] = new playQueue();
            let pq = queueList[message.guild.id];
            pq.tchannel = message.channel;
            pq.vchannel = vchannel;
            pq.connection = conn;
            re.edit(`Connected to voice channel **${pq.vchannel.name}**, I will accept all music commands in this text channel: **${pq.tchannel.name}**.`);
            console.log(`joinvoice: server:${message.guild.name}, vchannel: ${pq.vchannel.name}, tchannel: ${pq.tchannel.name}`);
        }).catch(console.error);
    });

}
clist.push(joinvoice);

let leavevoice = new command(['leavevoice']);
leavevoice.process = function (message, args) {
    if (!queueList[message.guild.id]) return;
    let pq = queueList[message.guild.id];
    if (!pq.tchannel || pq.tchannel.id !== message.channel.id) return;
    // Leave the voice channel.

    let voiceConnection = client.voiceConnections.get(message.guild.id);
    if (voiceConnection != null) {
        console.log(`leaving voice channel: ${voiceConnection.channel.name}`);
        if (voiceConnection.player && voiceConnection.player.dispatcher) voiceConnection.player.dispatcher.end();
        
        voiceConnection.channel.leave();
        return;
    }
    /*
    let me = message.guild.members.find("id", client.user.id);
    let channel = me.voiceChannel;
    if (channel) channel.leave();*/
    //delete queueList[message.guild.id];
    /*
    if (queueList[message.guild.id] && queueList[message.guild.id].connection) {
        let pq = queueList[message.guild.id];
        pq.connection.disconnect();
        pq.connection = null;
        delete queueList[message.guild.id];
    }*/
}
clist.push(leavevoice);

/*
let thefuck = new command('thefuck')
thefuck.process = function (message, args) {
    if (playQueue.connection) playQueue.dispatcher = playQueue.connection.playFile('Whatthefuckdidyousaytome.mp3');
}
clist.push(thefuck);*/
let pause = new command(['pause']);
pause.process = function (message, args) {
    if (!queueList[message.guild.id]) return;
    if (queueList[message.guild.id].dispatcher) {
        queueList[message.guild.id].dispatcher.pause();
        message.channel.sendMessage("Music Paused.");
    }
}
clist.push(pause);

let resume = new command(['resume']);
resume.process = function (message, args) {
    if (!queueList[message.guild.id]) return;
    if (queueList[message.guild.id].dispatcher) {
        queueList[message.guild.id].dispatcher.resume();
        message.channel.sendMessage("Music Resumed.");
    }
}
clist.push(resume);
let nextcmd = new command(['next']);
nextcmd.usage = [`**\nStop current song and try to play the next song in the playlist.`];
nextcmd.process = function (message, args) {
    if (!queueList[message.guild.id]) return;
    let pq = queueList[message.guild.id];
    if (!pq.tchannel || pq.tchannel.id !== message.channel.id) return;
    if (pq.dispatcher) pq.dispatcher.end();
}
clist.push(nextcmd);

let clearpl = new command(['plclear', 'plc']);
clearpl.process = function (message, args) {
    if (!queueList[message.guild.id]) return;
    let pq = queueList[message.guild.id];
    if (!pq.tchannel || pq.tchannel.id !== message.channel.id) return;
    pq.list = [];
    message.channel.sendMessage("Playlist cleared.");
}
clist.push(clearpl);

let plpop = new command(['playlistpop', 'plpop']);
plpop.usage = [`**\nDequeue the last added song from the playlist.`];
plpop.process = function (message, args) {
    if (!queueList[message.guild.id]) return;
    let pq = queueList[message.guild.id];
    if (!pq.tchannel || pq.tchannel.id !== message.channel.id) return;
    let pvideo = pq.list.pop();
    if (pvideo) if (pq.tchannel) pq.tchannel.sendMessage(`Dequeued ${pvideo.prettyPrint()}`);
}
clist.push(plpop);

let playlistcmd = new command(['playlist', 'pl']);
playlistcmd.usage = [`**\nDisplay the playlist.`];
playlistcmd.process = function (message, args) {
    if (!queueList[message.guild.id]) return;
    let pq = queueList[message.guild.id];
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
    message.channel.sendMessage(formattedList);
}
clist.push(playlistcmd);

let youtube = new command(['youtube', 'yt'])
youtube.usage = [`[youtube video link]**\nAdd a song to the playlist using a youtube link.`]
youtube.process = function (message, args) {
    if (!queueList[message.guild.id]) return;
    let pq = queueList[message.guild.id];
    if (!pq.tchannel || pq.tchannel.id !== message.channel.id) return;
    if (!pq.vchannel) return message.reply(`I'm not connected to a voice channel! Use ${config.prefix}${joinvoice.name[0]}`);
    if (!args || !args.length) return message.reply("Invalid youtube query.");
    getInfoAndQueue(args[0], message);
}
clist.push(youtube);

let youtubeq = new command(['youtubeq', 'ytq']);
youtubeq.usage = [`[search params]**\nQuery for a song on youtube and add it to the playlist. Will use the first search result from youtube search.`];
youtubeq.process = function (message, args) {
    if (!queueList[message.guild.id]) return;
    let pq = queueList[message.guild.id];
    if (!pq.tchannel || pq.tchannel.id !== message.channel.id) return;
    if (!config.googleapikey || config.googleapikey.length === 0) return message.reply("The Google API key in your config file is invalid. Query to youtube is disabled.");
    if (!pq.vchannel) return message.reply(`I'm not connected to a voice channel! Use ${config.prefix}${joinvoice.name[0]}`);
    if (!args || !args.length) return message.reply("Invalid youtube query.");
    var requestUrl = 'https://www.googleapis.com/youtube/v3/search' +
        `?part=snippet&q=${escape(args.join(' '))}&key=${config.googleapikey}`;

    request(requestUrl, (error, response) => {
        if (!error && response.statusCode == 200) {
            var body = response.body;
            if (body.items.length == 0) {
                message.reply('Your query gave 0 results.');
                return;
            }

            for (var item of body.items) {
                if (item.id.kind === 'youtube#video') {//use the first youtube video!
                    var vid = item.id.videoId;
                    console.log("dat vid:" + vid);
                    getInfoAndQueue(vid, message);
                    return;
                }
            }

            message.reply('No video has been found!');
        } else {
            message.reply('There was an error searching.');
            return;
        }
    });

}
clist.push(youtubeq);

let youtubepl = new command(['youtubeplaylist', 'ytpl']);
youtubepl.usage = [`[playlist ID]**\nQuery for a youtube playlists and add songs from it into the playlist.\nNOTE: Query is limited to 50 videos`];
youtubepl.process = function (message, args) {
    if (!queueList[message.guild.id]) return;
    let pq = queueList[message.guild.id];
    if (!pq.tchannel || pq.tchannel.id !== message.channel.id) return;
    if (!config.googleapikey || config.googleapikey.length === 0) return message.reply("The Google API key in your config file is invalid. Query to youtube is disabled.");
    if (!pq.vchannel) return message.reply(`I'm not connected to a voice channel! Use ${config.prefix}${joinvoice.name[0]}`);
    if (!args || !args.length) return message.reply("Invalid arguments.");
    let maxResults = 50;
    /*if (args[1]) { //resulst are 0-50 inclusive, so no point increasing this...
        let newmax = parseInt(args[1]);
        if (newmax > 50 && message.author.id === config.ownerid) maxResults = newmax;
    }*/
    var requestUrl = 'https://www.googleapis.com/youtube/v3/playlistItems' +
        `?part=contentDetails&maxResults=${maxResults}&playlistId=${args[0]}&key=${config.googleapikey}`;

    request.get(requestUrl).end((error, response) => {
        if (!error && response.statusCode == 200) {
            var body = response.body;
            if (body.items.length == 0) {
                message.reply('That playlist has no videos.');
                return;
            }
            message.reply(`Loading ${body.items.length} videos...`);
            var suppress = 0;
            body.items.forEach((elem, idx) => {
                var vid = elem.contentDetails.videoId;
                //stagger loading
                setTimeout(function (v, m) { return function () { getInfoAndQueue(v, m); }; } (vid, message), 1000 * idx);

            });
        } else {
            message.reply('There was an error finding playlist with that id.');
            return;
        }
    });
}
clist.push(youtubepl);

