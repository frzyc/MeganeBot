const fs = require("fs");
const util = require.main.exports.getRequire('util');
const command = require.main.exports.getRequire('command').command;
const cmdModuleobj = require.main.exports.getRequire('command').cmdModuleobj;

const playerData = require.main.exports.getRequire('playerdata').playerData;
const currency = require.main.exports.getRequire('playerdata').currency;
let colorfile = '../data/color.json';
let colorList = {};
fs.readFile(__dirname + '/' + colorfile, 'utf8', (err, data) => {
    if (err)
        console.log(err);
    else {
        try {
            colorList = JSON.parse(data);
        } catch (e) {
            console.log(e);
            colorList = {};
        }
    }
});
//if (!colorList) colorList = {};

let cmdModule = new cmdModuleobj('Color');
cmdModule.description = `Allows the player to change their name color using roles.`;
cmdModule.serverOnly = true;
exports.cmdModule = cmdModule;

//lets user change their own color.
//the color roles are roles with only a color, they should not grant any permissions.
let colorcmd = new command(['color']);
colorcmd.cost = 10;
colorcmd.usage = [`[desired color] pay ${colorcmd.cost} ${currency.nameplural} to change your color.**\nNOTE: choosing "White" will reset current color, but costs nothing.`];
colorcmd.argsTemplate = [
    [new util.customType((s,message) => {
        if (!colorList || !colorList[message.guild.id]) return null;
        if (s.toLowerCase() === "white") {
            return 'White';
        }
        return null;
    }, util.staticArgTypes['word'])],
    [new util.customType((s, message) => {
        if (!colorList || !colorList[message.guild.id]) return null;
        if (colorList[message.guild.id].length === 0) return;
        if (colorList[message.guild.id].length === 0) return;
        let color = colorList[message.guild.id].find(val => val.toLowerCase() === s.toLowerCase())
        if (!color) return null;
        let colorrole = message.guild.roles.find(val => val.name === color);
        if (!colorrole) return null;
        return colorrole;
    }, util.staticArgTypes['word'])]
];
//colorcmd.userCooldown = 10;//10 seconds
colorcmd.process = function (message, args) {
    return new Promise((resolve, reject) => {
        if (args[0]) {
            removeColorRoles().then(() => {
                reject(util.redel(`resetted your color to default.`));
            });
            return;
        }
        if (args[1]) {
            let colorrole = args[1][0];

            let needtopay = true;
            if (message.member.roles.has(colorrole.id)) needtopay = false;
            let playerwallet = playerData.getOrCreatePlayer(message.author.id).wallet;

            console.log("selected role: " + colorrole.name);
            removeColorRoles().then(() => {
                console.log("add role: " + colorrole.name);
                message.member.addRole(colorrole);
                if (needtopay) {
                    playerwallet.subMoney(10);
                    return resolve({
                        messageContent: `You paid ${colorcmd.cost} ${currency.nameplural} to change your color to <@&${colorrole.id}>.`,
                        reply: true,
                        deleteTime: 3 * 60 * 1000
                    });
                } else {
                    return reject(util.redel(`You already have <@&${colorrole.id}>.`));
                }
            })
        }

        function removeColorRoles(callback) {
            return new Promise((resolve, reject) => {
                let currColors = message.member.roles.filter((r) => colorList[message.guild.id].includes(r.name));
                message.member.removeRoles(currColors).then(resolve, reject);
            });
        }
    });
    
}
cmdModule.addCmd(colorcmd);

let colorlistcmd = new command(['colorlist']);
colorlistcmd.usage = [`**\nprints out a list of colors on the server`];
colorlistcmd.process = function (message, args) {
    if (!colorList || !colorList[message.guild.id]) return Promise.reject(util.redel(`There is no color database for this server.`));
    if (colorList[message.guild.id].length === 0) return Promise.reject(util.redel(`There is no color roles on this server.`));
    let res = colorList[message.guild.id].join(", ");
    return Promise.resolve(util.redel(res));
}
cmdModule.addCmd(colorlistcmd);

let coloraddcmd = new command(['coloradd']);
coloraddcmd.usage = [`[rolename]**\nNOTE: only works if a role with a color is present. All role permissions will be removed. Color "White" cannot be added.`];
coloraddcmd.argsTemplate = [[util.staticArgTypes['word']]];
coloraddcmd.reqUserPerms = ["MANAGE_ROLES_OR_PERMISSIONS"]
coloraddcmd.process = function (message, args) {
    return new Promise((resolve, reject) => {
        let arg = args[0][0]
        if (!colorList) return reject(util.redel(`There is no color database for this server.`));
        if (!colorList[message.guild.id]) colorList[message.guild.id] = [];
        if (arg && arg.toLowerCase() === "white") return reject(util.redel(`Color "White" cannot be added.`)); 
        if (colorList[message.guild.id].find(val => val.toLowerCase() === arg.toLowerCase())) return reject(util.redel("Color already added."));
        let colorrole = message.guild.roles.find(val => val.name.toLowerCase() === arg.toLowerCase());
        if (!colorrole) return reject(util.redel("Invalid role"));
        if (colorrole.color === 0) return reject(util.redel("Role does not have a color."));
        console.log(colorrole);
        colorrole.edit({
            mentionable: true,
            permissions:[]
        }).then(role => {
            console.log(role.serialize());
            colorList[message.guild.id].push(colorrole.name);
            colorList[message.guild.id] = colorList[message.guild.id].sort();
            fs.writeFile(__dirname + '/' + colorfile, JSON.stringify(colorList), 'utf8', (err) => {
                if (err) {
                    console.error(err);
                    return reject(util.redel('Problem with writing to file'));
                }
                return resolve(util.redel(`<@&${colorrole.id}> added, file updated.`))
            });
        }).catch(err => {
            console.error(err);
            return reject(util.redel('Problem with setting permissions'));
        });
    });
    
}
cmdModule.addCmd(coloraddcmd);

//TODO colorremove
//TODO coloraddnew //add a new color using the hex code
//todo coloredit //edit the color using a hex code
