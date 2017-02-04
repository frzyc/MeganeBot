const Discord = require('discord.js');
const fs = require("fs");

console.log(`Starting DiscordBot\nNode version: ${process.version}\nDiscord.js version: ${Discord.version}`);

//little helper function to keep track of the files... for now
exports.getRequire = function (modulename) {
    if (modulename === 'command') return require('./utility/command.js');
    if (modulename === 'util') return require('./utility/util.js');
    if (modulename === 'config') return require('./data/config.json');
    if (modulename === 'playerdata') return require('./modules/playerData.js');
    throw 'codefile not found!';
}
const config = require.main.exports.getRequire('config');
const util = require.main.exports.getRequire('util');
const messageWatchList = require.main.exports.getRequire('util').messageWatchList;
const command = require.main.exports.getRequire('command').command;
const cmdBaseobj = require.main.exports.getRequire('command').cmdBaseobj;
const playerData = require.main.exports.getRequire('playerdata').playerData;
const currency = require.main.exports.getRequire('playerdata').currency;

const client = new Discord.Client({
    fetchAllMembers : true,
});
exports.client = client;

var cmdBase = new cmdBaseobj();
exports.cmdBase = cmdBase;
let moduledirlist = [
    './modules/playerData.js',
    './modules/general.js',
    './modules/botAdmin.js',
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
    if (reconnTimer) {
        clearTimeout(reconnTimer);
        reconnTimer = null;
    }
    console.log(`Ready to serve in ${client.channels.size} channels on ${client.guilds.size} servers, for a total of ${client.users.size} users.`);
    console.log(client.user);
    //client.user.setUsername("MeganeBot");
    //console.log(client.options);
});

client.on('message', message => {
    if (message.author.bot) return; //wont respond to bots

    if (playerData && util.percentChance(3)) {
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
        cmd = args.shift().toLowerCase();// shift again cause the cmd is the 2nd arg, commands are not case-sensitive
    console.log(`MESSAGE: cmd(${cmd})  args(${args})`);
    if (cmdBase.cmdlist[cmd]) {
        let cmdobj = cmdBase.cmdlist[cmd];
        let restriction = cmdobj.checkRestriction(message);
        if (restriction !== '') return util.createMessage(util.redel(`This command is restricted to ${restriction} only.`), message);

        if (cmdobj.reqBotPerms &&
            message.channel.type === 'text' &&
            !message.channel.permissionsFor(client.user).hasPermissions(cmdobj.reqBotPerms))
            return util.createMessage({ messageContent: `I don't have enough permissions to use this command. need:\n${cmdobj.reqBotPerms.join(', and ')}`, deleteTime: 5*60 * 1000 });
        if (cmdobj.reqUserPerms && !message.member.permissions.hasPermissions(cmdobj.reqUserPerms)) 
            return util.createMessage({ messageContent: `You have enough permissions to use this command. need:\n${cmdobj.reqUserPerms.join(', and ')}`, deleteTime: 60 * 1000 });
        console.log(`${cmd} args: ${args}`);
        let inCD = cmdobj.inCooldown(message);
        if (inCD) {
            let msg = '';
            //this accounts for multiple cooldowns
            if (inCD.userCooldown) msg += `This command is time-restricted per user. Cooldown: ${inCD.userCooldown / 1000} seconds.\n`
            if (inCD.serverCooldown) msg += `This command is time-restricted per server. Cooldown: ${inCD.serverCooldown / 1000} seconds.\n`
            if (inCD.channelCooldown) msg += `This command is time-restricted per channel. Cooldown: ${inCD.channelCooldown / 1000} seconds.\n`
            return util.createMessage(util.redel(msg), message);
        }
        //if this has a cost, and the user doesnt have any moneys
        if (cmdobj.cost && playerData.getOrCreatePlayer(message.author.id).wallet.getAmount() < cmdobj.cost)
            return util.createMessage(util.redel(`You don't have enough ${currency.nameplural} to use this command, need ${currency.symbol}${cmdobj.cost}.`),message);

        //perliminary check of args
        if (cmdobj.argsTemplate) {
            args = cmdobj.checkArgs(args,message);
            if (args.every(v => v === null)) {
                let msg = 'Bad Parameter:\n' + cmdobj.getUseage();
                return util.createMessage({
                    messageContent: msg,
                    reply: true,
                    deleteTime: 3 * 60 * 1000
                }, message);
            }
            console.log('bot args:')
            console.log(args);
        }
        cmdobj.setCooldown(message);
        //use Promise.resolve just incase a process doesnt return a promise...
        Promise.resolve(cmdobj.process(message, args, client)).then(response => {
            console.log("cmd resolved");
            //console.log(response);
            if(response) util.createMessage(response, message).catch(console.error);
        }).catch(reject => {
            console.log("cmd rejected");
            cmdobj.clearCooldown(message);
            //console.log(reject);
            if(reject) util.createMessage(reject, message).catch(console.error);;
        });
        
    }
});

client.on('guildMemberAdd', (member) => {
    console.log(`New User "${member.user.username}" has joined "${member.guild.name}"`);
    member.guild.defaultChannel.sendMessage(`"${member.user.username}" has joined this server`);
});

/*
client.on('messageReactionAdd', (messageReaction, user) => {
    console.log("messageReactionAdd");
    messageReaction.remove().catch(console.error);
});*/


client.on('messageReactionAdd', (messageReaction, user) => {
    if (user.bot) return; //wont respond to bots
    console.log(`NEW REACTION BOOO YEAH emoji.name:${messageReaction.emoji.name}, emoji.id:${messageReaction.emoji.id}, emoji.identifier:${messageReaction.emoji.identifier}, emoji.toString():${messageReaction.emoji.toString()}`);
    
    //console.log(messageReaction.emoji.name);
    //console.log(messageReaction.emoji.id);
    //console.log(messageReaction.emoji.identifier);
    //console.log(messageReaction.emoji.toString());
    //just give the player some money for now...
    if (messageWatchList[messageReaction.message.id]) {
        console.log("IN messageWatchList");
        //console.log(messageWatchList[messageReaction.message.id]);
        console.log("messageReaction.toString():" + messageReaction.emoji.toString());
        if (messageReaction.emoji.toString() in messageWatchList[messageReaction.message.id].emojiButtons) {
            console.log("IN messageWatchList with emoji");
            Promise.resolve(messageWatchList[messageReaction.message.id].emojiButtons[messageReaction.emoji.toString()](messageReaction, user)).then(response => {
                console.log("emoji resolved");
                //console.log(response);
                if(response) util.createMessage(response, messageReaction.message).catch(console.error);
            }).catch(reject => {
                console.log("emoji rejected");
                //console.log(reject);
                if(reject) util.createMessage(reject, messageReaction.message).catch(console.error);;
            });
            //console.log(user);
            messageReaction.remove(user.id).catch(console.error);
        }
    } else if (playerData && util.percentChance(5)) {
        playerData.getOrCreatePlayer(messageReaction.message.author.id).wallet.addMoney(1);
        messageReaction.message.react(currency.emoji).catch(console.error);//TODO: need to find how emojis work
    }
    
    //let msgOwnerAmount = msgOwnerPlayer.wallet.getAmount();
    //let currencyname = msgOwnerAmount > 1 ? currency.nameplural : currency.name
    //console.log(`${messageReaction.message.member.displayName} now has ${msgOwnerAmount} ${currencyname}`);
});

client.on('messageReactionRemove', (messageReaction, user) => {
    if (user.bot) return; //wont respond to bots
    console.log("REMOVE REACTION BOOO");
});

// Handle discord.js warnings
client.on('warn', (m) => console.log('[warn]', m));
//client.on('debug', (m) => console.log('[debug]', m));

let reconnTimer = null;
client.on('disconnect', (m) => {
    console.log(`[disconnect]:ReconnTimer:${reconnTimer}`, m)
    function reconn(time) {
        if (reconnTimer != null) return;
        console.log(`Reconnecting after ${time / 1000} seconds`);
        reconnTimer = setTimeout((m) => {
            client.login(config.token).then((m) => {
                reconnTimer = null;
                console.log(`Reconnected! ${m}`);
            }).catch((m) => {
                reconnTimer = null;
                console.log(`Error with reconnecting: ${m}`);
                reconn(time * 2);
            })
        }, time);
    }
    reconn(10000);
});

client.login(config.token).then((m) => {
    console.log(`login success! ${m}`);
}).catch((m) => {
    console.log(`Error with login: ${m}`);
})
process.on("unhandledRejection", err => {
    console.error("Uncaught Promise Error: \n" + err.stack);
});
process.on('uncaughtException', function (err) {//technically not a good idea, but YOLO
    console.log(err);
    console.log(err.stack);
});

//something to deal with spawn errors
(function () {
    var childProcess = require("child_process");
    var oldSpawn = childProcess.spawn;
    function mySpawn() {
        console.log('spawn called');
        console.log(arguments);
        var result = oldSpawn.apply(this, arguments);
        return result;
    }
    childProcess.spawn = mySpawn;
})();

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

