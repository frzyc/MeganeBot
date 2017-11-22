const fs = require("fs");
const util = require.main.exports.getRequire('util');
const command = require.main.exports.getRequire('command');
const cmdModuleobj = require.main.exports.getRequire('commandmodule');
const cmdBase = require.main.exports.cmdBase
const package = require('../package.json');

let cmdModule = new cmdModuleobj('BotAdmin');
cmdModule.description = `Contains bot administration commands`;
cmdModule.ownerOnly = true;
module.exports = cmdModule;

let setplaying = new command('playing');
setplaying.usage = ["[desired game/message]** Change what im playing."];
setplaying.argsTemplate = [
    [util.staticArgTypes['string']]
];
setplaying.process = function (message, args) {
    return util.justOnePromise(
        this.client.user.setGame(args[0][0]),
        util.redel(`Changed my playing to: ${args[0][0]}.`),
        util.redel(`Cannot change playing.`)
    );
}
cmdModule.addCmd(setplaying);

let evalcmd = new command('eval');
evalcmd.usage = ["[string]** \nNOTE: bot owner only"];
evalcmd.process = function (message, args) {

    //helper functions
    //This function prevents the use of actual mentions within the return line by adding a zero-width character between the @ and the first character of the mention - blocking the mention from happening.
    function clean(text) {
        if (typeof (text) === "string")
            return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
        else
            return text;
    }
    return new Promise((resolve,reject)=>{
        try {
            let code = message.content.split('eval')[1];
            if (!code || code.length === 0) return reject(util.redel("Invalid Input."));
            let evaled = eval(code);

            if (typeof evaled !== "string")
                evaled = require("util").inspect(evaled);
            let msg = '```xl\n' + clean(evaled) + '\n```';
            resolve({ messageContent: msg });
            //message.channel.sendCode("xl", clean(evaled));
        } catch (err) {
            reject({ messageContent: `ERROR :${clean(err)}\n`})
        }
    })
    
}
cmdModule.addCmd(evalcmd);

let getpermscmd = new command('getperms');
getpermscmd.usage = ["[@mentions]** get the users' permissions in this channel."];
getpermscmd.guildOnly = true;
getpermscmd.argsTemplate = [
    [util.staticArgTypes['mentions']]
];
getpermscmd.process = function (message, args) {
    let users = args[0][0];
    for (userid in users) {
        let user = users[userid];
        let perms = message.channel.permissionsFor(user).serialize();
        util.createMessage({
            messageContent: `<@${userid}> Permissions:\`\`\`JSON\n${JSON.stringify(perms, null, 2)}\`\`\``,
            deleteTime: 15 * 60 * 1000
        },message);
    }
    return Promise.resolve();
}
cmdModule.addCmd(getpermscmd);

