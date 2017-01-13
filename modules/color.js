const fs = require("fs");
const util = require.main.exports.getRequire('util');
const command = require.main.exports.getRequire('command').command;
const cmdModuleobj = require.main.exports.getRequire('command').cmdModuleobj;

const playerData = require.main.exports.getRequire('playerdata').playerData;
const currency = require.main.exports.getRequire('playerdata').currency;
let colorfile = '../data/color.json';
var colorList = require(colorfile);
if (!colorList) colorList = {};

let cmdModule = new cmdModuleobj('Color');
cmdModule.description = `Allows the player to change their name color using roles.`;
cmdModule.serverOnly = true;
exports.cmdModule = cmdModule;

//lets user change their own color.
//the color roles are roles with only a color, they should not grant any permissions.
let colorcmd = new command(['color']);
colorcmd.cost = 10;
colorcmd.usage = [`[desired color] pay ${colorcmd.cost} ${currency.nameplural} to change your color.**\nNOTE: choosing "White" will reset current color, but costs nothing.`];
//colorcmd.userCooldown = 10;//10 seconds
colorcmd.process = function (message, args) {
    return new Promise((resolve, reject) => {
        if (!colorList || !colorList[message.guild.id]) return;
        if (args[0].toLowerCase() === "white") {
            removeColorRoles().then(() => {
                reject(util.redel(`resetted your color to default.`));
            });
            return;
        }
        if (colorList[message.guild.id].length === 0) return;
        let color = colorList[message.guild.id].find(val => val.toLowerCase() === args[0].toLowerCase())
        let colorrole = message.guild.roles.find(val => val.name.toLowerCase() === args[0]);
        if (!colorrole) return;

        let needtopay = true;
        if (message.member.roles.has(colorrole.id)) needtopay = false;
        let playerwallet = playerData.getOrCreatePlayer(message.author.id).wallet;
        if (needtopay && playerwallet.getAmount() < this.cost) return reject(util.redel(`You don't have enough money to change your color`));

        console.log("selected role: " + colorrole.name);
        removeColorRoles().then(() => {
            console.log("add role: " + colorrole.name);
            message.member.addRole(colorrole);
            if (needtopay) {
                playerwallet.subMoney(10);
                return resolve({
                    messageContent: `You paid ${colorcmd.cost} ${currency.nameplural} to change your color to ${color}.`,
                    reply: true,
                    deleteTime: 3*60*1000
                });
            } else {
                return reject(util.redel(`You already have ${color}.`));
            }
        })

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
coloraddcmd.reqUserPerms = ["MANAGE_ROLES_OR_PERMISSIONS"]
coloraddcmd.process = function (message, args) {
    return new Promise((resolve, reject) => {
        if (!colorList) return reject(util.redel(`There is no color database for this server.`));
        if (!colorList[message.guild.id]) colorList[message.guild.id] = [];
        if (!args || !args[0]) return reject(util.redel(`Invalid Parameters`)); 
        if (args[0] && args[0].toLowerCase() === "white") return reject(util.redel(`Color "White" cannot be added.`)); 
        if (colorList[message.guild.id].find(val => val.toLowerCase() === args[0].toLowerCase())) return reject(util.redel("Color already added."));
        let colorrole = message.guild.roles.find(val => val.name.toLowerCase() === args[0].toLowerCase());
        if (!colorrole) return reject(util.redel("Invalid role"));
        if (colorrole.color === 0) return reject(util.redel("Role does not have a color."));
        let colorname = colorrole.name;
        colorrole.setPermissions([]);
        colorList[message.guild.id].push(colorname);
        colorList[message.guild.id] = colorList[message.guild.id].sort();
        fs.writeFile(__dirname + '/' + colorfile, JSON.stringify(colorList), 'utf8', (err) => {
            if (err) {
                console.error(err);
                return reject(util.redel('Problem with writing to file'));
            }
            return resolve(util.redel(`${colorname} added, json file updated.`)) 
        });
    });
    
}
cmdModule.addCmd(coloraddcmd);

//TODO colorremove
//TODO coloraddnew //add a new color using the hex code
//todo coloredit //edit the color using a hex code
