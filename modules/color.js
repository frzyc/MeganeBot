const fs = require("fs");
const command = require('./command.js');

let colorfile = '../data/color.json';
var colorList = require(colorfile);
if (!colorList) colorList = {};

let cmdlist = [];
exports.cmdlist = cmdlist;

//lets user change their own color.
//the color roles are roles with only a color, they should not grant any permissions.
let colorcmd = new command(['color']);
colorcmd.usage = [`[desired color]**\nNOTE: choosing "White" will reset current color`];
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
    console.log("selected role: " + colorrole.name);
    removeColorRoles(() => {
        console.log("add role: " + colorrole.name);
        message.member.addRole(colorrole);
        message.reply(`changed your color to ${color}.`);
        message.delete();
    })
    
    function removeColorRoles(callback) {
        let currColors = message.member.roles.filter((r) => colorList[message.guild.id].includes(r.name));
        message.member.removeRoles(currColors).then(callback).catch(console.error);
    }
}
cmdlist.push(colorcmd);

let colorlistcmd = new command(['colorlist']);
colorlistcmd.usage = [`**\nprints out a list of colors on the server`];
colorlistcmd.process = function (message, args) {
    if (!colorList || !colorList[message.guild.id]) return;
    if (colorList[message.guild.id].length === 0) return message.reply(`There is no color roles on this server.`);
    let res = colorList[message.guild.id].join(", ");
    message.channel.sendMessage(res);
}
cmdlist.push(colorlistcmd);

let coloraddcmd = new command(['coloradd']);
coloraddcmd.usage = `[color role]**\nNOTE: all role permissions will be removed. Color "White" cannot be added.`;
coloraddcmd.reqperms = ["MANAGE_ROLES_OR_PERMISSIONS"]
coloraddcmd.process = function (message, args) {
    if (!colorList) return;
    if (!colorList[message.guild.id]) colorList[message.guild.id] = [];
    if (args[0].toLowerCase() === "white") return message.reply("Color \"White\" cannot be added.");
    if (colorList[message.guild.id].find(val => val.toLowerCase() === args[0].toLowerCase())) return message.reply("Color already added.");
    let colorrole = message.guild.roles.find(val => val.name.toLowerCase() === args[0].toLowerCase());
    if (!colorrole) return message.reply("Invalid role");
    if (colorrole.color === 0) return message.reply("Role does not have a color.");
    let colorname = colorrole.name;
    colorrole.setPermissions([]);
    colorList[message.guild.id].push(colorname);
    colorList[message.guild.id] = colorList[message.guild.id].sort();
    console.log(colorList);
    fs.writeFile(__dirname+'/'+colorfile, JSON.stringify(colorList), 'utf8', (err) => {
        if (err) return console.log(err);
        console.log(JSON.stringify(colorList));
        message.reply(`${colorname} added, json file updated.`);
    });
}
cmdlist.push(coloraddcmd);

//TODO coloraddnew //add a new color using the hex code
//todo coloredit //edit the color using a hex code
