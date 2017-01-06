const Discord = require('discord.js');
const config = require('./data/config.json');
const util = require('./util.js');
const fs = require("fs");

const command = require('./command.js').command;
const cmdBaseobj = require('./command.js').cmdBaseobj;
const playerData = require('./modules/gambling.js').playerData;
const currency = require('./modules/gambling.js').currency;
//console.log(currency);

const client = new Discord.Client({
    fetchAllMembers : true,
});
exports.client = client;

var cmdBase = new cmdBaseobj();
exports.cmdBase = cmdBase;
let moduledirlist = [
    './modules/general.js',
    './modules/basicResponse.js',
    './modules/color.js',
    './modules/music.js',
    './modules/gambling.js',
    './modules/minesweeper.js',
    './modules/rps.js',
    //'./modules/cleverbot.js',
]
moduledirlist.forEach(mod => {
    cmdBase.addModule(require(mod).cmdModule);
});  

client.on('ready', () => {
    console.log(`Ready to serve in ${client.channels.size} channels on ${client.guilds.size} servers, for a total of ${client.users.size} users.`);
    console.log(client.user);
    //client.user.setUsername("MeganeBot");
    //console.log(client.options);
});

client.on('message', message => {
    if (message.author.bot) return; //wont respond to bots

    //if(message.author.id !== config.ownerid) return;//locked to me, FRED!
    if (util.percentChance(3)) {
        playerData.getOrCreatePlayer(message.author.id).wallet.addMoney(1);
        message.react(currency.emoji).catch(console.error);
    }
    let cont = message.content;

    //normal message processing with commands
    let startprefix = cont.startsWith(config.prefix);
    let startmention = cont.startsWith(`<@!${client.user.id}>`) || cont.startsWith(`<@${client.user.id}>`);
    if (!startprefix && !startmention) return;

    var args = cont.split(' ').filter(a => a.length > 0);//get split and get rid of zero length args
    var cmd = args.shift().slice(config.prefix.length).toLowerCase();//commands are not case-sensitive
    if (startmention)
        cmd = args.shift().toLowerCase();//commands are not case-sensitive shift again cause the cmd is the 2nd arg
    console.log(`MESSAGE: cmd(${cmd})  args(${args})`);
    if (cmdBase.cmdlist[cmd]) {
        let cmdobj = cmdBase.cmdlist[cmd];
        console.log("check serverOnly:" + cmdobj.serverOnly +" type:"+message.channel.type);
        if (cmdobj.dmOnly && message.channel.type === 'text') return util.replyWithTimedDelete(message, "This command is restricted to direct message only.");
        if (cmdobj.serverOnly && (message.channel.type === 'dm' || message.channel.type === 'group')) return util.replyWithTimedDelete(message, "This command is restricted to server only.");
        if (cmdobj.ownerOnly && message.author.id !== config.ownerid) return;//check for ownerOnly commands
        if (cmdobj.reqperms && !message.member.permissions.hasPermissions(cmdobj.reqperms)) return;//check if has permission
        console.log(`${cmd} args: ${args}`);
        if (!cmdobj.inCooldown(message)) {
            //if this has a cost, and the user doesnt have any moneys
            if (cmdobj.cost && playerData.getOrCreatePlayer(message.author.id).wallet.getAmount() < cmdobj.cost)
                return util.replyWithTimedDelete(message, `You don't have enough ${currency.nameplural} to use this command, need ${currency.symbol}${cmdobj.cost}.`, 10 * 1000);
            cmdobj.process(message, args, client);
        }
    } else {
        if (startmention && cmdBase.cmdlist['talk']) {
            let prefix = cont.split(' ').slice(1).join(' ');
            cmdBase.cmdlist['talk'].process(message, prefix, client);
        }
    }
});

client.on('guildMemberAdd', (member) => {
    console.log(`New User "${member.user.username}" has joined "${member.guild.name}"`);
    member.guild.defaultChannel.sendMessage(`"${member.user.username}" has joined this server`);
});

client.on('messageReactionAdd', (messageReaction, user) => {
    if (user.bot) return; //wont respond to bots
    console.log(`NEW REACTION BOOO YEAH emoji.name:${messageReaction.emoji.name}, emoji.id:${messageReaction.emoji.id}, emoji.identifier:${messageReaction.emoji.identifier}, emoji.toString():${messageReaction.emoji.toString()}`);
    /*
    console.log(messageReaction.emoji.name);
    console.log(messageReaction.emoji.id);
    console.log(messageReaction.emoji.identifier);
    console.log(messageReaction.emoji.toString());*/
    //just give the player some money for now...
    if (util.percentChance(5)) {
        playerData.getOrCreatePlayer(messageReaction.message.author.id).wallet.addMoney(1);
        messageReaction.message.react(currency.emoji).catch(console.error);//TODO: need to find how emojis work
    }
    /*
    let msgOwnerAmount = msgOwnerPlayer.wallet.getAmount();
    let currencyname = msgOwnerAmount > 1 ? currency.nameplural : currency.name
    console.log(`${messageReaction.message.member.displayName} now has ${msgOwnerAmount} ${currencyname}`);*/
});

client.on('messageReactionRemove', (messageReaction, user) => {
    console.log("REMOVE REACTION BOOO");
});

// Handle discord.js warnings
client.on('warn', (m) => console.log('[warn]', m));
//client.on('debug', (m) => console.log('[debug]', m));

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
/*
process.stdin.resume();//so the program will not close instantly

function exitHandler(options, err) {
    if (options.cleanup) console.log('clean');
    if (err) console.log(err.stack);
    if (options.exit) process.exit();

}

//do something when app is closing
process.on('exit', exitHandler.bind(null, { cleanup: true }));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, { exit: true }));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, { exit: true }));*/