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
    console.log("GLASSES");
    return new Promise((resolve, reject) => {
        let prom1 = util.createMessage({ messageContent: "Changing my glasses..." }, message);
        console.log(prom1);
        fs.readdir('./glassesicon', (err, files) => { 
            if (err) {
                console.error(err);
                return reject({ messageContent: 'cannot change my glasses!' });
            }
            files.forEach(file => {
                console.log(file);
            });
            let randicon = files[Math.floor(Math.random() * files.length)];
            console.log(`randicon:${randicon}`);
            let prom2 = client.user.setAvatar(`./glassesicon/${randicon}`);
            console.log(prom1);
            console.log(prom2);
            Promise.all([prom1, prom2]).then(values => {
                console.log(`promise.ALL`);
                console.log(values);
                let reply = values[0];
                return resolve({
                    message: reply,
                    messageContent: `Changed my glasses! :eyeglasses: `
                });  
            }).catch((err) => {
                console.error(err);
                return reject({ messageContent: 'cannot change my glasses!' });
            });
        });
    })
}
cmdModule.addCmd(glassescmd);


let evalcmd = new command(['eval']);
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
            let code = args.join(' ');
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

let statuscmd = new command(['status']);
statuscmd.usage = ["[online/idle/invisible/dnd(do not disturb)]** set bot status."];
statuscmd.process = function (message, args, client) {
    let statuses = [`online`, `idle`, `invisible`, `dnd`];
    return new Promise((resolve, reject) => {
        if (!args || args.length < 1 || !status.includes(args[0])) return util.redel('Invalid parameters.');
        client.user.setStatus(args[0]).then(user => {
            resolve(util.redel(`Changed my status to ${args[0]}!`));
        }).catch(reject(util.redel(`Cannot change my status to ${args[0]}!`)));
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
        util.createMessage({
            messageContent: `<@${userid}> Permissions:\`\`\`JSON\n${JSON.stringify(perms, null, 2)}\`\`\``,
            deleteTime: 15 * 60 * 1000
        },message);
    }
    return Promise.resolve({});
}
cmdModule.addCmd(getpermscmd);
