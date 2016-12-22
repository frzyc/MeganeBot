const fs = require("fs");
const command = require('./command.js');
const util = require('../util.js')
const client = require('../bot.js').client;
const config = require('../data/config.json');

let clist = []
exports.cmdlist = clist;

//general commands


//general help command. He keeps track of all the commands, and process usages
let helpcmd = new command(["help", "h"]);
helpcmd.usage = ["**\nget some help mate, seriously."]
helpcmd.cmdlist = [];//this keep track of all the commands
helpcmd.process = function (message, args) {
    if (args && args[0]) {// if ask for a specific command
        if (args[0].startsWith(config.prefix))
            args[0] = args[0].slice(config.prefix.length).toLowerCase();//incase someone asked !help !command
        if (cmdList[args[0]])
            message.reply(cmdList[args[0]].getUseage());
        else
            message.reply(`command ${args[0]} does not exist.`);
    } else {
        msg = `List of commands:\n`
        msg += `**${this.cmdlist.sort().join(' ')}**`;
        msg += `\nUse !help [commandname] to get specific usage.`
        message.reply(msg);
    }
}
clist.push(helpcmd);


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
clist.push(about);

let prune = new command(['prune']);
prune.usage = [
    `[number of messages, max 100]**\nDelete your own messages`,
    `[number of messages, max 100] [optional: @mention1] [optional: @mention2] ...**`
    + `\nDelete messages from @mentions`
    + `\nNOTE: delete need "manage messages" permission to delete other's messages. `
];
prune.process = function (message, args) {
    let messagecount = 0;
    console.log(args.length);
    let matchid = [message.author.id];
    if (args.length >= 1)
        messagecount = parseInt(args[0]);
    if (args.length > 1) {//means other people have been mentioned?
        matchid = [];
        message.mentions.users.map(u => { matchid.push(u.id); });
        if (matchid.length != args.length - 1)
            return message.reply(`argument number mismatch. use "${config.prefix}help ${this.name[0]}" to check usage`);
        if (!message.member.hasPermission("MANAGE_MESSAGES"))
            return message.reply("You don't have the \"manage messages\" permissions to delete other people's messages");
    }
    message.channel.fetchMessages({ limit: 100 })
        .then(messages => {
            let msg_array = messages.array();
            msg_array = msg_array.filter(m => (matchid.includes(m.author.id) && m.id !== message.id));
            // limit to the requested number + 1 for the command message
            if (msg_array.length > messagecount)
                msg_array.length = messagecount;
            let msgdel = msg_array.length;
            msg_array.map(m => m.delete().catch(console.error));
            message.reply(`${msgdel} messages deleted. `);
            message.delete();
        });
}
clist.push(prune);

let nick = new command(['nick']);
nick.usage = ["[desiredNickname]** NOTE: botowner only."];
nick.reqperms = ["MANAGE_NICKNAMES"];
nick.process = function (message, args) {
    let newname = args.join(' ');
    message.channel.members.get(client.user.id).setNickname(newname);
}
clist.push(nick);

let glassescmd = new command(['glasses']);
glassescmd.usage = ['**\nChange my display picture.\nNOTE:Botowner only.'];
glassescmd.owneronly = true;
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
clist.push(glassescmd);


let evalcmd = new command(['eval']);
evalcmd.usage = ["[string]** \nNOTE: bot owner only"];
evalcmd.owneronly = true;
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
clist.push(evalcmd);
