const fs = require("fs");
const util = require.main.exports.getRequire('util');
const command = require.main.exports.getRequire('command');
const cmdModuleobj = require.main.exports.getRequire('commandmodule');
const package = require('../package.json');

let cmdModule = new cmdModuleobj('General');
cmdModule.description = `Contains general server commands`;
module.exports = cmdModule;

//general help command. He keeps track of all the commands, and process usages
let helpcmd = new command("help");
helpcmd.aliases = ["h"]
helpcmd.usage = [
    "**{0}** List the modules.",
    "**{0} all** get all the commands.",
    "**{0} [module]** get all commands in this module",
    "**{0} [cmd]** get help on indvidual cmd usage."
]
helpcmd.argsTemplate = [
    [new util.customType(arg => {
        return {usage:0};
    }, util.staticArgTypes['none'])],
    [new util.customType(arg => {
        arg = arg.toLowerCase();
        if (arg.startsWith(helpcmd.client.prefix))
            arg = arg.slice(helpcmd.client.prefix.length);//incase someone asked !help !command
        if (arg === 'all') return { usage: 1 }
        if (helpcmd.client.cmdBase.modulelist[arg]) return { usage: 2, module: helpcmd.client.cmdBase.modulelist[arg] }
        if (helpcmd.client.cmdBase.cmdlist[arg]) return { usage: 3, command: helpcmd.client.cmdBase.cmdlist[arg] }
        return {usage:-1, arg:arg}
    }, util.staticArgTypes['word'])]
]
helpcmd.process = function (message, args) {
    let arg = args.reverse().find(val => val != null)[0];
    let msg = '';
    if (arg.usage === 0) {//"**\nList the modules."
        msg = `List of all modules:\n`
        for (modname in this.client.cmdBase.modulelist) {
            let mod = this.client.cmdBase.modulelist[modname];
            if (mod.dmOnly && message.channel.type === 'text') continue;
            if (mod.serverOnly && (message.channel.type === 'dm' || message.channel.type === 'group')) continue;
            if (mod.ownerOnly && !this.client.isOwner(message.author.id)) continue;
            msg += `**${mod.name}** - `;
            if (mod.description)
                msg += `${mod.getDesc()}`
            else
                msg += `This module does not have a description.`
            msg += `\n`;
        }
        msg += `\nUse ${this.getUseage(2)}`;
    } else if (arg.usage === 1) {//"all **\nget all the commands."
        msg = `List of all commands:\n`
        msg += `**${Object.keys(this.client.cmdBase.cmdlist).filter((cmd) => {
            return this.client.cmdBase.cmdlist[cmd].checkRestriction(message) === '';
        }).sort().join(' ')}**`;
    } else if (arg.usage === 2) {//"[module]**\nget all commands in this module",
        let mod = arg.module;
        let restriction = mod.checkRestriction(message);
        if (restriction === '') {
            msg = `List of all commands in module **${mod.name}**:`
            let sortedcmdkeys = Object.keys(mod.cmdlist).filter((cmd) => {
                return this.client.cmdBase.cmdlist[cmd].checkRestriction(message) === '';
            }).sort().map(key => mod.cmdlist[key]).forEach((cmd) => {
                msg += `\n**${cmd.name.join('**, or **')}**`;
            });
        } else {
            msg = `This module is restricted to ${restriction} only.`;
        }
    } else if (arg.usage === 3) {//"[cmd]**\nget help on indvidual cmd usage."
        let restriction = arg.command.checkRestriction(message);
        if (restriction === '')  msg = arg.command.getUseage();
        else  msg = `This command is restricted to ${restriction} only.`;
    } else
        msg = `command ${arg.arg} does not exist.`;
    return Promise.resolve({
        messageContent: msg,
        reply: true,
        deleteTime: 3*60*1000
    });
}
cmdModule.addCmd(helpcmd);

let about = new command('about');
about.usage = ["**{0}** Get some information about me, MeganeBot :D"];
about.process = function (message, args) {
    msg = `Name: ${package.name} \nVersion: ${package.version} \nDescription: ${package.description}\n`;
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
    `**{0} [number of messages, max 100]** Delete your own messages`,
    `**{0} [number of messages, max 100] [@mentions]** `
    + `Delete messages from @mentions`
    + `\nNOTE: delete need "manage messages" permission to delete other's messages. `
];
let amounttype = new util.customType(v => v > 0 && v <=100 ? v : null, util.staticArgTypes['int']);
prune.argsTemplate = [
    [amounttype, util.staticArgTypes['none']],
    [amounttype, util.staticArgTypes['mentions']]
];

prune.serverOnly = true;
prune.reqBotPerms = ["MANAGE_MESSAGES"];
prune.process = function (message, args) {
    return new Promise((resolve, reject) => {
        let arg = args.reverse().find(val => val != null);//find the longest matching first
        let messagecount = arg[0];
        let matchid = [message.author.id];
        if (arg[1]) {//means other people have been mentioned?
            if (!message.member.hasPermission("MANAGE_MESSAGES"))
                return reject(util.redel("You don't have the \"manage messages\" permissions to delete other people's messages"));
            matchid = [];
            let mentiondict = arg[1];
            for (id in mentiondict)
                matchid.push(id);
        }
        message.channel.fetchMessages({ limit: 100, before: message.id })
            .then(messages => {
                let filteredMessageCollection = messages.filter(m => {
                    if (messagecount > 0 && matchid.includes(m.author.id)) {
                        messagecount--;
                        return true;
                    }
                    return false
                });
                let numOfFilteredMsgs = filteredMessageCollection.size;
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

let nick = new command('nick');
nick.usage = ["**{0} [desiredNickname]** Change my server nickname, need the MANAGE_NICKNAMES permission."];
nick.argsTemplate = [
    [util.staticArgTypes['string']]
];
nick.reqUserPerms = ["MANAGE_NICKNAMES"];
nick.serverOnly = true;
nick.process = function (message, args) {
    return util.justOnePromise(
        message.channel.members.get(this.client.user.id).setNickname(args[0][0]),
        util.redel(`Changed my name to: ${args[0][0]}.`),
        util.redel(`Cannot change nickname.`)
    );
}
cmdModule.addCmd(nick);

let emojify = new command('emojify');
emojify.usage = ["**{0} [string]** convert string to emojis"];
emojify.argsTemplate = [
    [util.staticArgTypes['oristring']]
];
emojify.process = function (message, args) {
    let msg = args[0][0].toUpperCase().split(``).map(char => {
        if (/\d/.test(char)) return util.getDigitSymbol(char);
        if (/[A-Z]/.test(char)) return util.getLetterSymbol(char);
        return util.otherCharSymbol(char);
    }).join(' ');
    return Promise.resolve({ messageContent: msg });
}
cmdModule.addCmd(emojify);

let myidcmd = new command('myid');
myidcmd.usage = ["**{0}** get the sender's id."];
myidcmd.process = function (message, args) {
    return Promise.resolve({
        messageContent: `Your ID: \`\`\`${message.author.id}\`\`\``,
        reply:true,
        deleteTime: 5 * 60 * 1000,//15min
    });
}
cmdModule.addCmd(myidcmd);

let mypermscmd = new command('myperms');
mypermscmd.usage = ["**{0}** get the sender's permissions in this channel."];
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

let saycmd = new command('say');
saycmd.usage = ["**{0} [some message to repeat]** repeat what the sender says."];
saycmd.argsTemplate = [
    [util.staticArgTypes['oristring']]
];
saycmd.process = function (message, args) {
    return Promise.resolve({
        messageContent: `${args[0][0]}`,
        deleteTimeCmdMessage: 3 * 1000,
    });
}
cmdModule.addCmd(saycmd);

let sayttscmd = new command('saytts');
sayttscmd.usage = ["**{0} [some message to repeat]** repeat what the sender says, with tts."];
sayttscmd.argsTemplate = [
    [util.staticArgTypes['oristring']]
];
sayttscmd.process = function (message, args) {
    return Promise.resolve({
        messageContent: `${args[0][0]}`,
        messageOptions: { tts: true },
        deleteTimeCmdMessage: 3 * 1000,
    });
}
cmdModule.addCmd(sayttscmd);

let topiccmd = new command('topic');
topiccmd.usage = ["**{0} [topic]** change channel topic."];
topiccmd.argsTemplate = [
    [util.staticArgTypes['oristring']]
];
topiccmd.serverOnly = true;
topiccmd.channelCooldown = 5;
topiccmd.reqUserPerms = ['MANAGE_CHANNELS'];
topiccmd.reqBotPerms = ['MANAGE_CHANNELS'];
topiccmd.process = function (message, args) {
    return util.justOnePromise(
        message.channel.setTopic(args[0][0]),
        util.redel(`Changed Topic to: ${args[0][0]}`),
        util.redel(`Cannot change channel topic.`)
    );
}
cmdModule.addCmd(topiccmd);
