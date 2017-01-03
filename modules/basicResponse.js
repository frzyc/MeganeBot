const command = require('../command.js').command;
const util = require('../util.js');
//const client = require('../bot.js').client;
const config = require('../data/config.json');

const cmdModuleobj = require('../command.js').cmdModuleobj;
let cmdModule = new cmdModuleobj('BasicResponse');
cmdModule.description = `Basic scripted responses to stuff... mostly memes`;
exports.cmdModule = cmdModule;

var basicResponse = {
    'hello': 'Hello.',//H-Hi... its not like I\'m replying back because I like you... BAKA
    'bestgirl': 'Kuriyama Mirai...obviously',
    'zone': 'Dont let me into my zone\nDont let me into my zone\nDont let me into my zone\nI\'m in my zone',
    'ping': 'pong',
    'pizza': ':pizza:',
    'surrender': ':flag_white: DEFEATED :flag_white:',
    'yeahiknow': `No... you don't know! BAKA!`,
    'pirate': `Do what you want, 'cause a pirate is free, YOU ARE A PIRATE!`
};
var masterResponse = {
    'hello': 'Hello Master :heart:'
};


var basicResponseCmd = function (cmdnames) {
    this.name = cmdnames;
}
basicResponseCmd.prototype = Object.create(command.prototype);//clone all properties
basicResponseCmd.prototype.process = function (message, args) {
    if (this.masterResponse && message.author.id === config.ownerid)
        util.simulateTypingReply(message, this.masterResponse);
    else if (this.basicResponse)
        util.simulateTypingReply(message, this.basicResponse);
}

for (var cmd in basicResponse) {
    let tempcmd = new basicResponseCmd([cmd]);
    tempcmd.basicResponse = basicResponse[cmd];
    if (masterResponse[cmd]) tempcmd.masterResponse = masterResponse[cmd];
    cmdModule.addCmd(tempcmd);
}

/*
let roll = new command(['roll']);
roll.usage = [`[# of sides] or [# of dice]d[# of sides]( + [# of dice]d[# of sides] + ...)`];
roll.process = function (message, args) {
}
cmdModule.addCmd(roll);
*/
