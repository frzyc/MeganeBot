const cleverbot = require("cleverbot.io");
const util = require('../util.js');
const command = require('../command.js').command;
const cmdModuleobj = require('../command.js').cmdModuleobj;
let cmdModule = new cmdModuleobj('Cleverbot');
cmdModule.description = `Allows the users to talk to Meganebot using a cleverbot API.\nNOTE: doesnt really work due to a session bug`;
exports.cmdModule = cmdModule;

let bot = new cleverbot('eIRPlUcquvMCKx3B', 'w34gNMkPVgJEAiCETZf9ybDLpuqWOKVC', 'MeganeBot');
bot.setNick("MeganeBot"); // Set a nickname
/*
bot.ask("Just a small town girl", function (err, response) {
    console.log(response); // Will likely be: "Living in a lonely world"
});*/
bot.create(function (err, session) { // Initialize Cleverbot
    if (session) {
    } else {
        console.log(`CLEVERBOT CREATE ERROR:${err}`);
    }
});

let cleverbotcmd = new command(['talk']);
cleverbotcmd.usage = [`[message]**\nTalk to Meganebot`];
cleverbotcmd.process = function (message, args) {
    if (!args || args.length===0) return;
    console.log(`ASK:'${args}'`);
    
    
        
            console.log(`session:${session}`);
            bot.ask(args, function (err, response) {
                if (response) {
                    util.simulateTypingReply(message, response);
                    console.log(response);
                } else {
                    console.log(`CLEVERBOT ASK ERROR:${err}`);
                }
            });
        
        
    
}
cmdModule.addCmd(cleverbotcmd);
