const fs = require("fs");
const util = require.main.exports.getRequire('util');
const command = require.main.exports.getRequire('command').command;
const cmdModuleobj = require.main.exports.getRequire('command').cmdModuleobj;
const config = require.main.exports.getRequire('config');
const client = require.main.exports.client;
const cmdBase = require.main.exports.cmdBase
const package = require('../package.json');

let cmdModule = new cmdModuleobj('General');
cmdModule.description = `Contains general server commands`;
exports.cmdModule = cmdModule;

//general help command. He keeps track of all the commands, and process usages
let helpcmd = new command(["help", "h"]);
helpcmd.usage = [
    "**\nList the modules.",
    "all **\nget all the commands.",
    "[module]**\nget all commands in this module",
    "[cmd]**\nget help on indvidual cmd usage."
]
helpcmd.process = function (message, args) {
    let msg = '';
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
        } else if (cmdBase.modulelist[args[0]]) {
            let mod = cmdBase.modulelist[args[0]];
            if (mod.dmOnly && message.channel.type === 'text')
                return Promise.reject(util.redel("This module is restricted to direct message only."));
            if (mod.serverOnly && (message.channel.type === 'dm' || message.channel.type === 'group')) 
                return Promise.reject(util.redel("This module is restricted to server only."));
            if (mod.ownerOnly && message.author.id !== config.ownerid) 
                return Promise.reject(util.redel("This module is restricted to botowner only."));
            msg = `List of all commands in module **${mod.name}**:`
            let sortedcmdkeys = Object.keys(mod.cmdlist).filter((cmd) => {
                let cmdobj = cmdBase.cmdlist[cmd];
                return canUseCmd(cmdobj, message);
            }).sort().map(key => mod.cmdlist[key]).forEach((cmd) => {
                msg += `\n**${cmd.name.join('**, or **')}**`;
                });
        } else if (cmdBase.cmdlist[args[0]] && canUseCmd(cmdBase.cmdlist[args[0]],message))
            msg = cmdBase.cmdlist[args[0]].getUseage();
        else
            msg = `command ${args[0]} does not exist.`;

        function canUseCmd(cmdobj, message) {
            if (cmdobj.dmOnly && message.channel.type === 'text') return false;
            if (cmdobj.serverOnly && (message.channel.type === 'dm' || message.channel.type === 'group')) return false;
            if (cmdobj.ownerOnly && message.author.id !== config.ownerid) return false;
            return true;
        }
    } else {
        msg = `List of all modules:\n`
        console.log(cmdBase.modulelist);
        for (modname in cmdBase.modulelist) {
            let mod = cmdBase.modulelist[modname];
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
        msg += `\nUse ${this.getUseage(2)}`; 
    }
    return Promise.resolve({
        messageContent: msg,
        reply: true
    });
}
cmdModule.addCmd(helpcmd);

let about = new command(['about']);
about.usage = ["**\nGet some information about me, MeganeBot :D"];
about.process = function (message, args) {
    msg = `Name: ${package.name} \nVersion: ${package.version} \nDescription: ${package.description}\nMaster(owner): <@${config.ownerid}>`;
    let uptime = Math.floor(process.uptime());
    let hours = Math.floor(uptime / (60 * 60))
    let minutes = Math.floor((uptime % (60 * 60)) / 60);
    let seconds = uptime % 60;
    msg += `\nUptime: ${hours} Hours ${minutes} Mintues and ${seconds} Seconds`;
    return Promise.resolve({ messageContent: msg });
}
cmdModule.addCmd(about);

let prune = new command(['prune']);
prune.usage = [
    `[number of messages, max 100]**\nDelete your own messages`,
    `[number of messages, max 100] [@mentions]**\n`
    + `Delete messages from @mentions\n`
    + `NOTE: delete need "manage messages" permission to delete other's messages. `
];
prune.serverOnly = true;
prune.reqBotPerms = ["MANAGE_MESSAGES"];
prune.process = function (message, args) {
    return new Promise((resolve, reject) => {
        let messagecount = 0;
        console.log(args.length);
        let matchid = [message.author.id];
        if (args.length >= 1)
            messagecount = parseInt(args[0]);
        if (!messagecount) return reject(util.redel("invalid arguments"));
        if (args.length > 1) {//means other people have been mentioned?
            matchid = [];
            let mentiondict = util.getMentionedUsers(message);
            for (id in mentiondict)
                matchid.push(id);

            if (!message.member.hasPermission("MANAGE_MESSAGES"))
                return reject(util.redel("You don't have the \"manage messages\" permissions to delete other people's messages"));
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
                if (numOfFilteredMsgs > 1)
                    message.channel.bulkDelete(filteredMessageCollection).then(() => {
                        return resolve(util.redel(`${numOfFilteredMsgs} messages deleted. `));
                    }).catch((err) => {
                        console.error(err);
                        return reject(util.redel(`Cannot delete messages.`));
                    });
                else if (numOfFilteredMsgs === 1)
                    filteredMessageCollection.first().delete().then(() => {
                        return resolve(util.redel(`1 message deleted. `));
                    }).catch((err) => {
                        console.error(err);
                        return reject(util.redel(`Cannot delete message.`));
                    });
            });
    });
    
}
cmdModule.addCmd(prune);

let nick = new command(['nick']);
nick.usage = ["[desiredNickname]** Change my server nickname, need the MANAGE_NICKNAMES permission."];
nick.reqUserPerms = ["MANAGE_NICKNAMES"];
nick.serverOnly = true;
nick.process = function (message, args) {
    return util.justOnePromise(
        message.channel.members.get(client.user.id).setNickname(args.join(' ')),
        util.redel(`Changed my name to: ${args.join(' ')}.`),
        util.redel(`Cannot change nickname.`)
    );
}
cmdModule.addCmd(nick);

let emojify = new command(['emojify']);
emojify.usage = ["[string]** convert string to emojis"];
emojify.process = function (message, args) {
    if (!args || args.length === 0) return;
    let msg = args.join(` `).toUpperCase().split(``).map(char => {
        if (/\d/.test(char)) return util.getDigitSymbol(char);
        if (/[A-Z]/.test(char)) return util.getLetterSymbol(char);
        return char;
    }).join(' ');
    return Promise.resolve({ messageContent: msg });
}
cmdModule.addCmd(emojify);

let myidcmd = new command(['myid']);
myidcmd.usage = ["** get the sender's id."];
myidcmd.process = function (message, args) {
    return Promise.resolve({
        messageContent: `Your ID: \`\`\`${message.author.id}\`\`\``,
        reply:true,
        deleteTime: 5 * 60 * 1000,//15min
    });
}
cmdModule.addCmd(myidcmd);

let mypermscmd = new command(['myperms']);
mypermscmd.usage = ["** get the sender's permissions in this channel."];
mypermscmd.serverOnly = true;
mypermscmd.process = function (message, args) {
    let perms = message.channel.permissionsFor(message.author).serialize();
    return Promise.resolve({
        messageContent: `Your Permissions:\`\`\`JSON\n${JSON.stringify(perms, null, 2)}\`\`\``,
        reply: true,
        deleteTime: 15 * 60 * 1000,//15min
    });
}
cmdModule.addCmd(mypermscmd);

let saycmd = new command(['say']);
saycmd.usage = ["[some message to repeat]** repeat what the sender says."];
saycmd.process = function (message, args) {
    let start = message.content.indexOf(' ') + 1;
    return Promise.resolve({
        messageContent: `${message.content.slice(start)}`,
        deleteTime: 5 * 60 * 1000,
    });
}
cmdModule.addCmd(saycmd);

let sayttscmd = new command(['saytts']);
sayttscmd.usage = ["[some message to repeat]** repeat what the sender says, with tts."];
sayttscmd.process = function (message, args) {
    let start = message.content.indexOf(' ') + 1;
    return Promise.resolve({
        messageContent: `${message.content.slice(start)}`,
        deleteTime: 5 * 60 * 1000,
        messageOptions: { tts: true }
    });
}
cmdModule.addCmd(sayttscmd);

let topiccmd = new command(['topic']);
topiccmd.usage = ["[topic]** change channel topic."];
topiccmd.serverOnly = true;
topiccmd.channelCooldown = 5;
topiccmd.reqUserPerms = ['MANAGE_CHANNELS'];
topiccmd.reqBotPerms = ['MANAGE_CHANNELS'];
topiccmd.process = function (message, args) {
    return util.justOnePromise(
        message.channel.setTopic(args.join(' ')),
        util.redel(`Changed Topic to: ${args.join(' ')}`),
        util.redel(`Cannot change channel topic.`)
    );
}
cmdModule.addCmd(topiccmd);

/*
let testcmd = new command(['test']);
testcmd.process = function (message, args) {
    return new Promise((resolve, reject)=>{
        
        reject();
        resolve();
    })
}
cmdModule.addCmd(testcmd);*/