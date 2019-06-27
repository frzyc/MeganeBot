const command = require.main.exports.getRequire("command")
const cmdModuleobj = require.main.exports.getRequire("commandmodule")

let cmdModule = new cmdModuleobj("BasicResponse")
cmdModule.description = "Basic scripted responses to stuff... mostly memes"
module.exports = cmdModule

var basicResponse = {
    "hello": "Hello.",
    "bestgirl": "Kuriyama Mirai...obviously",
    "zone": "Dont let me into my zone\nDont let me into my zone\nDont let me into my zone\nI'm in my zone",
    "ping": "pong",
    "pizza": ":pizza:",
    "surrender": ":flag_white: DEFEATED :flag_white:",
    "yeahiknow": "No... you don't know! BAKA!",
    "pirate": "Do what you want, 'cause a pirate is free, YOU ARE A PIRATE!"
}
var masterResponse = {
    "hello": "H-Hi... its not like I'm replying back because I like you... BAKA",//'Hello Master :heart:'
}

var basicResponseCmd = function (cmdnames) {
    this.name = cmdnames
}
basicResponseCmd.prototype = Object.create(command.prototype)//clone all properties
basicResponseCmd.prototype.usage = ["**{0}** MeganeBot will reply with something personal!"]
basicResponseCmd.prototype.process = function (message) {
    let res = {
        typing: true,
        reply: true,
        deleteTime: 2 * 60 * 1000
    }
    if (this.masterResponse && this.client.isOwner(message.author.id))
        res.messageContent = this.masterResponse
    else if (this.basicResponse)
        res.messageContent = this.basicResponse
    return Promise.resolve(res)
}

for (var cmd in basicResponse) {
    let tempcmd = new basicResponseCmd([cmd])
    tempcmd.basicResponse = basicResponse[cmd]
    if (masterResponse[cmd]) tempcmd.masterResponse = masterResponse[cmd]
    cmdModule.addCmd(tempcmd)
}
