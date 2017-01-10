const fs = require("fs");
const util = require.main.exports.getRequire('util');
const command = require.main.exports.getRequire('command').command;
const cmdModuleobj = require.main.exports.getRequire('command').cmdModuleobj;
const config = require.main.exports.getRequire('config');
const client = require.main.exports.client;
const cmdBase = require.main.exports.cmdBase
const package = require('../package.json');

let cmdModule = new cmdModuleobj('BotAdmin');
cmdModule.description = `Contains bot administration commands`;
cmdModule.ownerOnly = true;
exports.cmdModule = cmdModule;

let glassescmd = new command(['glasses']);
glassescmd.usage = ['**\nChange my display picture.\nNOTE:Botowner only.'];
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

let statuscmd = new command(['status']);
statuscmd.usage = ["[online/idle/invisible/dnd(do not disturb)]** set bot status."];
statuscmd.process = function (message, args, client) {
    let statuses = [`online`, `idle`, `invisible`, `dnd`];
    statuses.forEach(sta => {
        if (args[0] === sta) {
            client.user.setStatus(sta);
            util.replyWithTimedDelete(message, `Changed my status to ${sta}!`, 5 * 60 * 1000);
        }
    })
}
cmdModule.addCmd(statuscmd);

let getpermscmd = new command(['getperms']);
getpermscmd.usage = ["[@mentions]** get the users' permissions in this channel."];
getpermscmd.serverOnly = true;
getpermscmd.process = function (message, args) {
    let users = util.getMentionedUsers(message);
    for (userid in users) {
        let user = users[userid];
        let perms = message.channel.permissionsFor(user).serialize();
        util.sendMessageWithTimedDelete(message, `<@${userid}> Permissions:\`\`\`JSON\n${JSON.stringify(perms, null, 2)}\`\`\``, 15 * 60 * 1000);
    }
}
cmdModule.addCmd(getpermscmd);
