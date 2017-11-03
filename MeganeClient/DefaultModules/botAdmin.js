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

let glassescmd = new command('glasses');
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
            let prom2 = this.client.user.setAvatar(`./glassesicon/${randicon}`);
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

let statuscmd = new command('status');
statuscmd.statuses = [`online`, `idle`, `invisible`, `dnd`];
statuscmd.usage = [`[${statuscmd.statuses.join('/')}]** set bot status.`];
statuscmd.argsTemplate = [
    [new util.customType(s => statuscmd.statuses.includes(s) ? s : null)]
];
statuscmd.process = function (message, args) {
    return new Promise((resolve, reject) => {
        let status = args[0][0];
        if (status === this.client.user.presence.status) return reject(util.redel(`I am currently ${status}!`));
        this.client.user.setStatus(status).then(user => {
            resolve(util.redel(`Changed my status to ${status}!`));
        }).catch((err) => {
            console.err(err);
            reject(util.redel(`Cannot change my status to ${status}!`));
        });
    })
}
cmdModule.addCmd(statuscmd);

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

let versionscmd = new command('version');
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

let pullanddeploycmd = new command('pullanddeploy');
pullanddeploycmd.usage = ["** returns the git commit this bot is running."];
pullanddeploycmd.process = function (message, args) {
    util.createMessage({ messageContent: "fetching updates..." }, message).then(function (sentMsg) {
        console.log("updating...");
        let spawn = require('child_process').spawn;
        var fetch = spawn('git', ['fetch']);
        fetch.stdout.on('data', function (data) {
            console.log(data.toString());
        });
        fetch.on("close", function (code) {
            var reset = spawn('git', ['reset', '--hard', 'origin/master']);
            reset.stdout.on('data', function (data) {
                console.log(data.toString());
            });
            reset.on("close", function (code) {
                let isWin = /^win/.test(process.platform);
                let npmspawn = null;
                if (isWin) {
                    npmspawn = spawn('npm.cmd', ['install']);
                }else
                    npmspawn = spawn('npm', ['install']);
                npmspawn.stdout.on('data', function (data) {
                    console.log(data.toString());
                });
                npmspawn.on("close", function (code) {
                    console.log("goodbye");
                    sentMsg.edit("brb!").then(function () {
                        this.client.destroy().then(function () {
                            process.exit();
                        });
                    });
                });
            });
        });
    });

}
cmdModule.addCmd(pullanddeploycmd);

let killyourselfcmd = new command('killyourself');
killyourselfcmd.usage = ["** Kill the process. If pm2 is installed, node process will restart."];
killyourselfcmd.process = function (message, args) {
    util.createMessage({ messageContent: "NANI?" }, message).then(function (sentMsg) {
        process.exit();
    });
}
cmdModule.addCmd(killyourselfcmd);
