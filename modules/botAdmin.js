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

let statuscmd = new command(['status']);
statuscmd.statuses = [`online`, `idle`, `invisible`, `dnd`];
statuscmd.usage = [`[${statuscmd.statuses.join('/')}]** set bot status.`];
statuscmd.argsTemplate = [
    [new util.customType(s => statuscmd.statuses.includes(s) ? s : null)]
];
statuscmd.process = function (message, args, client) {
    return new Promise((resolve, reject) => {
        let status = args[0][0];
        if (status === client.user.presence.status) return reject(util.redel(`I am currently ${status}!`));
        client.user.setStatus(status).then(user => {
            resolve(util.redel(`Changed my status to ${status}!`));
        }).catch((err) => {
            console.err(err);
            reject(util.redel(`Cannot change my status to ${status}!`));
        });
    })
}
cmdModule.addCmd(statuscmd);

let getpermscmd = new command(['getperms']);
getpermscmd.usage = ["[@mentions]** get the users' permissions in this channel."];
getpermscmd.serverOnly = true;
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

let versionscmd = new command(['version']);
versionscmd.usage = ["** returns the git commit this bot is running."];
versionscmd.process = function (message, args) {
    return new Promise((resolve, reject) => {
        var commit = require('child_process').spawn('git', ['log', '-n', '1']);
        commit.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
            return resolve({ messageContent: `\`\`\`${data}\`\`\`` })
        });
        commit.stderr.on('data', (data) => {
            console.log(`stderr: ${data}`);
            return reject({ messageContent: `\`\`\`${data}\`\`\`` })
        });
        commit.on('close', function (code) {
            console.log(`code:${code}`);
            if (code != 0) {
                return reject({ messageContent: `failed checking git version!` });
            }
        });
    });
}
cmdModule.addCmd(versionscmd);

let testcmd = new command(['test']);
testcmd.process = function (message, args) {
    return Promise.resolve({
        messageContent: 'testing',
        //emojis: ['🇦', '🇧','🇨']
        emojiButtons: [
            {
                emoji: '🇦',
                process: (messageReaction, user) => {
                    console.log("PROCESSA");
                    return Promise.resolve({ msg: messageReaction.message, messageContent: '🇦'})
                }
            },
            {
                emoji: '🇧',
                process: (messageReaction, user) =>{
                    console.log("PROCESSB");
                    return Promise.resolve({ msg: messageReaction.message, messageContent: '🇧' })
                }
            },
            {
                emoji: '🇨',
                process: (messageReaction, user) => {
                    console.log("PROCESSC");
                    return Promise.resolve({ msg: messageReaction.message, messageContent: '🇨' })
                }
            }
        ],
    });
}
cmdModule.addCmd(testcmd);

