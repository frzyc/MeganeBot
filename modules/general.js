const fs = require("fs");
const command = require('../command.js').command;
const util = require('../util.js')
const client = require('../bot.js').client;
const cmdBase = require('../bot.js').cmdBase
const config = require('../data/config.json');

const cmdModuleobj = require('../command.js').cmdModuleobj;
let cmdModule = new cmdModuleobj('General');
cmdModule.description = `Contains general server commands`;
exports.cmdModule = cmdModule;

//general help command. He keeps track of all the commands, and process usages
let helpcmd = new command(["help", "h"]);
helpcmd.usage = [
    "**\nList the modules.",
    "all **\nget all the commands.",
    "[module]**\nget the list of command from a module.",
    "[cmd]**\nget help on indvidual cmd usage."
]
helpcmd.process = function (message, args) {
    if (args && args[0]) {// if ask for a specific command
        args[0] = args[0].toLowerCase();
        if (args[0].startsWith(config.prefix))
            args[0] = args[0].slice(config.prefix.length);//incase someone asked !help !command
        if (args[0] === 'all') {
            msg = `List of all commands:\n`
            msg += `**${Object.keys(cmdBase.cmdlist).filter((cmd) => {
                let cmdobj = cmdBase.cmdlist[cmd];
                return canUseCmd(cmdobj, message);
            }).sort().join(' ')}**`;
            message.reply(msg);
        } else if (cmdBase.modulelist[args[0]]) {
            let mod = cmdBase.modulelist[args[0]];
            msg = `List of all commands in module **${mod.name}**:\n`
            msg += `**${Object.keys(mod.cmdlist).filter((cmd) => {
                let cmdobj = cmdBase.cmdlist[cmd];
                return canUseCmd(cmdobj, message);
            }).sort().join(' ')}**`;
            message.reply(msg);
        } else if (cmdBase.cmdlist[args[0]])
            message.reply(cmdBase.cmdlist[args[0]].getUseage());
        else
            message.reply(`command ${args[0]} does not exist.`);

        function canUseCmd(cmdobj, message) {
            if (cmdobj.dmOnly && message.channel.type === 'text') return false;
            if (cmdobj.serverOnly && (message.channel.type === 'dm' || message.channel.type === 'group')) return false;
            if (cmdobj.ownerOnly && message.author.id !== config.ownerid) return false;
            return true;
        }
    } else {
        msg = `List of all modules:\n`
        for (modhash in cmdBase.modulelist) {
            let mod = cmdBase.modulelist[modhash];
            if (mod.dmOnly && message.channel.type === 'text') continue;
            if (mod.serverOnly && (message.channel.type === 'dm' || message.channel.type === 'group')) continue;
            if (mod.ownerOnly && message.author.id !== config.ownerid) continue;
            msg += `**${mod.name}** - `;
            if (mod.description)
                msg += `${mod.getDesc()}`
            else
                msg += `This module does not have a description.`
            msg += `\n`;
        }

        message.reply(msg);
    }
}
cmdModule.addCmd(helpcmd);


var package = require('../package.json');

let about = new command(['about']);
about.usage = ["**\nGet some information about me, MeganeBot :D"];
about.process = function (message, args) {
    msg = `Name: ${package.name} \nVersion: ${package.version} \nDescription: ${package.description}\nMaster(owner): <@${config.ownerid}>`;
    let uptime = Math.floor(process.uptime());
    let hours = Math.floor(uptime / (60 * 60))
    let minutes = Math.floor((uptime % (60 * 60)) / 60);
    let seconds = uptime % 60;
    msg += `\nUptime: ${hours} Hours ${minutes} Mintues and ${seconds} Seconds`;
    message.channel.sendMessage(msg);
}
cmdModule.addCmd(about);

let prune = new command(['prune']);
prune.usage = [
    `[number of messages, max 100]**\nDelete your own messages`,
    `[number of messages, max 100] [optional: @mention1] [optional: @mention2] ...**\n`
    + `Delete messages from @mentions\n`
    + `NOTE: delete need "manage messages" permission to delete other's messages. `
];
prune.serverOnly = true;
prune.process = function (message, args) {
    let messagecount = 0;
    console.log(args.length);
    let matchid = [message.author.id];
    if (args.length >= 1)
        messagecount = parseInt(args[0]);
    if (!messagecount) return util.replyWithTimedDelete(message, "invalid arguments");
    if (args.length > 1) {//means other people have been mentioned?
        matchid = [];
        let mentiondict = util.getMentionedUsers(message);
        for (id in mentiondict) 
            matchid.push(id);

        if (!message.member.hasPermission("MANAGE_MESSAGES"))
            return util.replyWithTimedDelete(message,"You don't have the \"manage messages\" permissions to delete other people's messages");
    }
    message.channel.fetchMessages({ limit: 100, before: message.id })
        .then(messages => {
            console.log(`messagecount:${messagecount}`);
            let filteredMessageCollection = messages.filter(m => {
                if (messagecount > 0 && matchid.includes(m.author.id)) {
                    messagecount--;
                    return true;
                }
                return false
            });
            let numOfFilteredMsgs = filteredMessageCollection.size;
            console.log("size of the collection" + numOfFilteredMsgs);
            if (numOfFilteredMsgs>1)
                message.channel.bulkDelete(filteredMessageCollection).then(() => {
                    util.replyWithTimedDelete(message, `${numOfFilteredMsgs} messages deleted. `, 10 * 1000);
                }).catch(console.error);
            else if (numOfFilteredMsgs = 1)
                filteredMessageCollection.first().delete().then(() => {
                    util.replyWithTimedDelete(message, `${numOfFilteredMsgs} messages deleted. `, 10 * 1000);
                }).catch(console.error);
        });
}
cmdModule.addCmd(prune);

let nick = new command(['nick']);
nick.usage = ["[desiredNickname]** NOTE: botowner only."];
nick.reqperms = ["MANAGE_NICKNAMES"];
nick.process = function (message, args) {
    let newname = args.join(' ');
    message.channel.members.get(client.user.id).setNickname(newname);
}
cmdModule.addCmd(nick);

let glassescmd = new command(['glasses']);
glassescmd.usage = ['**\nChange my display picture.\nNOTE:Botowner only.'];
glassescmd.ownerOnly = true;
glassescmd.process = function (message, args) {
    if (message.author.id !== config.ownerid) return;
    message.reply("Changing my glasses...").then(reply => {
        fs.readdir('./glassesicon', (err, files) => {
            files.forEach(file => {
                console.log(file);
            });;
            let randicon = files[Math.floor(Math.random() * files.length)];
            console.log(`randicon:${randicon}`);
            client.user.setAvatar(`./glassesicon/${randicon}`).then(user => reply.edit(`Changed my glasses! :eyeglasses: `)).catch(console.error);
        });
    }).catch(console.error)
}
cmdModule.addCmd(glassescmd);


let evalcmd = new command(['eval']);
evalcmd.usage = ["[string]** \nNOTE: bot owner only"];
evalcmd.ownerOnly = true;
evalcmd.process = function (message, args) {
    try {
        let code = args.join(' ');//args.slice(1).join(' ');
        let evaled = eval(code);

        if (typeof evaled !== "string")
            evaled = require("util").inspect(evaled);

        message.channel.sendCode("xl", util.clean(evaled));
    } catch (err) {
        message.channel.sendMessage("ERROR :" + util.clean(err) + "\n");
    }
}
cmdModule.addCmd(evalcmd);

let emojify = new command(['emojify']);
emojify.usage = ["[string]** convert string to emojis"];
emojify.process = function (message, args) {
    if (!args || args.length === 0) return;
    message.reply(args.join(` `).toUpperCase().split(``).map(char => {
        if (/\d/.test(char)) return util.getDigitSymbol(char);
        if (/[A-Z]/.test(char)) return util.getLetterSymbol(char);
        return char;
    }).join(' '));
}
cmdModule.addCmd(emojify);
