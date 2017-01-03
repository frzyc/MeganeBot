const fs = require("fs");
const command = require('../command.js').command;
const currency = require('./gambling.js').currency;
const playerData = require('./gambling.js').playerData;
let colorfile = '../data/color.json';
const util = require('../util.js');
var colorList = require(colorfile);
if (!colorList) colorList = {};

const cmdModuleobj = require('../command.js').cmdModuleobj;
let cmdModule = new cmdModuleobj('Color');
cmdModule.description = `Allows the player to change their name color using roles.`;
cmdModule.serverOnly = true;
exports.cmdModule = cmdModule;

//lets user change their own color.
//the color roles are roles with only a color, they should not grant any permissions.
let colorcmd = new command(['color']);
colorcmd.usage = [`[desired color] pay 10${currency.nameplural} to change your color.**\nNOTE: choosing "White" will reset current color, but costs nothing.`];
colorcmd.userCooldown = 30;//30 seconds
colorcmd.process = function (message, args) {
    if (!colorList || !colorList[message.guild.id]) return;
    if (args[0].toLowerCase() === "white") {
        removeColorRoles(() => {
            message.reply(`resetted your color to default.`);
            message.delete();
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
    if (needtopay && playerwallet.getAmount() < 10) return util.replyWithTimedDelete(message, `You don't have enough money to change your color`);
    console.log("selected role: " + colorrole.name);
    removeColorRoles(() => {
        console.log("add role: " + colorrole.name);
        message.member.addRole(colorrole);
        if (needtopay) {
            playerwallet.subMoney(10);
            util.replyWithTimedDelete(message, `changed your color to ${color}.`);
        } else {
            util.replyWithTimedDelete(message, `You already have ${color}.`);
        }
        this.setCooldown(message);
        
    })
    
    function removeColorRoles(callback) {
        let currColors = message.member.roles.filter((r) => colorList[message.guild.id].includes(r.name));
        message.member.removeRoles(currColors).then(callback).catch(console.error);
    }
}
cmdModule.addCmd(colorcmd);

let colorlistcmd = new command(['colorlist']);
colorlistcmd.usage = [`**\nprints out a list of colors on the server`];
colorlistcmd.process = function (message, args) {
    if (!colorList || !colorList[message.guild.id]) return;
    if (colorList[message.guild.id].length === 0) return message.reply(`There is no color roles on this server.`);
    let res = colorList[message.guild.id].join(", ");
    message.channel.sendMessage(res);
}
cmdModule.addCmd(colorlistcmd);

let coloraddcmd = new command(['coloradd']);
coloraddcmd.usage = [`[color role]**\nNOTE: all role permissions will be removed. Color "White" cannot be added.`];
coloraddcmd.reqperms = ["MANAGE_ROLES_OR_PERMISSIONS"]
coloraddcmd.process = function (message, args) {
    if (!colorList) return;
    if (!colorList[message.guild.id]) colorList[message.guild.id] = [];
    if (args[0] && args[0].toLowerCase() === "white") return message.reply("Color \"White\" cannot be added.");
    if (colorList[message.guild.id].find(val => val.toLowerCase() === args[0].toLowerCase())) return message.reply("Color already added.");
    let colorrole = message.guild.roles.find(val => val.name.toLowerCase() === args[0].toLowerCase());
    if (!colorrole) return message.reply("Invalid role");
    if (colorrole.color === 0) return message.reply("Role does not have a color.");
    let colorname = colorrole.name;
    colorrole.setPermissions([]);
    colorList[message.guild.id].push(colorname);
    colorList[message.guild.id] = colorList[message.guild.id].sort();
    fs.writeFile(__dirname+'/'+colorfile, JSON.stringify(colorList), 'utf8', (err) => {
        if (err) return console.log(err);
        message.reply(`${colorname} added, json file updated.`);
    });
}
cmdModule.addCmd(coloraddcmd);

//TODO coloraddnew //add a new color using the hex code
//todo coloredit //edit the color using a hex code
