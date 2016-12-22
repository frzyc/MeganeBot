const Discord = require('discord.js');
const config = require('./data/config.json');
const fs = require("fs");

const command = require('./modules/command.js');

const client = new Discord.Client();
exports.client = client;
//commandlist
var cmdList = {};
cmdList.addCmd = function (cmdobj) {
    let addcomplete = true;
    if (!cmdobj.name || cmdobj.name.length===0) {
        console.log(`addCmd:ERROR: Command has invalid cmdname.`);
        return false;
    }
    if (!cmdobj.process) return console.log(`addCmd:ERROR: Command ${cmdobj.name[0]} does not have a process.`);
    if (!cmdobj.usage) console.log(`addCmd:WARN: Command ${cmdobj.name[0]} does not have a usage.`);

    for (n of cmdobj.name) {
        if (this[n]) {
            console.log(`addCmd:ERROR: Command ${n} already exists.`);
            addcomplete = false;
            return;
        }

        this[n] = cmdobj;
        if (this.help && this.help.cmdlist) this.help.cmdlist.push(n);
    }
    return addcomplete;
}

const general = require('./modules/general.js')
general.cmdlist.map(cmd => { cmdList.addCmd(cmd) });
const color = require('./modules/color.js')
color.cmdlist.map(cmd => { cmdList.addCmd(cmd) });
const music = require('./modules/music.js')
music.cmdlist.map(cmd => { cmdList.addCmd(cmd) });

var basicResponse = {
    'hello': 'Hello.',//H-Hi... its not like I\'m replying back because I like you... BAKA
    'bestgirl': 'Kuriyama Mirai...obviously',
    'zone': 'Dont let me into my zone\nDont let me into my zone\nDont let me into my zone\nI\'m in my zone',
    'ping': 'pong',
    'pizza': ':pizza:',
    'surrender':':flag_white: DEFEATED :flag_white:'
};
var masterResponse = {
    'hello': 'Hello Master :heart:'
};

//TODO add basic response & masterresponse as commands

client.on('ready', () => {
    console.log(`Ready to serve in ${client.channels.size} channels on ${client.guilds.size} servers, for a total of ${client.users.size} users.`);
    console.log(client.user);
    //client.user.setUsername("MeganeBot");
    //console.log(client.options);
});

client.on('message', message => {
    if (message.author.bot) return; //wont respond to bots
    //if(message.author.id !== config.ownerid) return;//locked to me, FRED!

    let cont = message.content;

    //normal message processing with commands
    let startprefix = cont.startsWith(config.prefix);
    let startmention = cont.startsWith(`<@!${client.user.id}>`) || cont.startsWith(`<@${client.user.id}>`);
    if (!startprefix && !startmention) return;

    var args = message.content.split(' ').filter(a => a.length > 0);//get split and get rid of zero length args

    var cmd = args.shift().slice(config.prefix.length).toLowerCase();//commands are not case-sensitive
    if (startmention)
        cmd = args.shift().toLowerCase();//commands are not case-sensitive shift again cause the cmd is the 2nd arg
    
    if (message.author.id === config.ownerid && masterResponse[cmd])
        simulateTypingReply(message, masterResponse[cmd]);
    else if(basicResponse[cmd]) 
        simulateTypingReply(message, basicResponse[cmd]);
    else if (cmdList[cmd]) {
        if (cmdList[cmd].owneronly && message.author.id !== config.ownerid) return;//check for owneronly commands
        if (cmdList[cmd].reqperms && !message.member.permissions.hasPermissions(cmdList[cmd].reqperms)) return;//check if has permission
        console.log(`${cmd} args: ${args}`);
        cmdList[cmd].process(message, args, client);
    }
});

client.on('guildMemberAdd', (member) => {
    console.log(`New User "${member.user.username}" has joined "${member.guild.name}"`);
    member.guild.defaultChannel.sendMessage(`"${member.user.username}" has joined this server`);
});

client.on('messageReactionAdd', (messageReaction, user) => {
    console.log("NEW REACTION BOOO YEAH");
});

client.on('messageReactionRemove', (messageReaction, user) => {
    console.log("REMOVE REACTION BOOO");
});

// Handle discord.js warnings
client.on('warn', (m) => console.log('[warn]', m));
//client.on('debug', (m) => console.log('[debug]', m));

function simulateTyping(message, time, callback) {
    message.channel.startTyping();
    setTimeout(function () {
        callback();
        message.channel.stopTyping(true);
    }, time);
}
function simulateTypingReply(message, msg) {
    simulateTyping(message, (msg.length * 30 + 100), function () {
        message.reply(msg);
    });
}


client.login(config.token);

process.on('uncaughtException', function (err) {
    if (err.code == 'ECONNRESET') {//occationally get this error using ytdl.... not sure what to do with it
        console.log('Got an ECONNRESET!');
        console.log(err.stack);
    } else {
        // Normal error handling
        console.log(err);
        console.log(err.stack);
        //process.exit(0);
    }
});