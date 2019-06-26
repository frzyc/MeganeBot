const util = require.main.exports.getRequire("util")
const command = require.main.exports.getRequire("command")
const cmdModuleobj = require.main.exports.getRequire("commandmodule")

let cmdModule = new cmdModuleobj("General")
// cmdModule.description = "Some general commands."
// cmdModule.guildOnly = true
// module.exports = cmdModule

let prune = new command(["prune"])
prune.usage = [
    "**{0} [number of messages, max 100]** Delete your own messages",
    "**{0} [number of messages, max 100] [@mentions]** "
    + "Delete messages from @mentions"
    + "\nNOTE: delete need \"manage messages\" permission to delete other's messages. "
]
let amounttype = new util.customType(v => v > 0 && v <=100 ? v : null, util.staticArgTypes["int"])
prune.argsTemplate = [
    [amounttype, util.staticArgTypes["none"]],
    [amounttype, util.staticArgTypes["mentions"]]
]

prune.guildOnly = true
prune.reqBotPerms = ["MANAGE_MESSAGES"]
prune.process = function (message, args) {
    return new Promise((resolve, reject) => {
        let arg = args.reverse().find(val => val != null)//find the longest matching first
        let messagecount = arg[0]
        let matchid = [message.author.id]
        if (arg[1]) {//means other people have been mentioned?
            if (!message.member.hasPermission("MANAGE_MESSAGES"))
                return reject(util.redel("You don't have the \"manage messages\" permissions to delete other people's messages"))
            matchid = []
            let mentiondict = arg[1]
            for (let id in mentiondict)
                matchid.push(id)
        }
        message.channel.fetchMessages({ limit: 100, before: message.id })
            .then(messages => {
                let filteredMessageCollection = messages.filter(m => {
                    if (messagecount > 0 && matchid.includes(m.author.id)) {
                        messagecount--
                        return true
                    }
                    return false
                })
                let numOfFilteredMsgs = filteredMessageCollection.size
                if (numOfFilteredMsgs > 1)
                    message.channel.bulkDelete(filteredMessageCollection).then(() => {
                        return resolve(util.redel(`${numOfFilteredMsgs} messages deleted. `))
                    }).catch((err) => {
                        console.error(err)
                        return reject(util.redel("Cannot delete messages."))
                    })
                else if (numOfFilteredMsgs === 1)
                    filteredMessageCollection.first().delete().then(() => {
                        return resolve(util.redel("1 message deleted. "))
                    }).catch((err) => {
                        console.error(err)
                        return reject(util.redel("Cannot delete message."))
                    })
            })
    })
    
}
cmdModule.addCmd(prune)

let nick = new command("nick")
nick.usage = ["**{0} [desiredNickname]** Change my server nickname, need the MANAGE_NICKNAMES permission."]
nick.argsTemplate = [
    [util.staticArgTypes["string"]]
]
nick.reqUserPerms = ["MANAGE_NICKNAMES"]
nick.guildOnly = true
nick.process = function (message, args) {
    return util.justOnePromise(
        message.channel.members.get(this.client.user.id).setNickname(args[0][0]),
        util.redel(`Changed my name to: ${args[0][0]}.`),
        util.redel("Cannot change nickname.")
    )
}
cmdModule.addCmd(nick)

let topiccmd = new command("topic")
topiccmd.usage = ["**{0} [topic]** change channel topic."]
topiccmd.argsTemplate = [
    [util.staticArgTypes["oristring"]]
]
topiccmd.guildOnly = true
topiccmd.channelCooldown = 5
topiccmd.reqUserPerms = ["MANAGE_CHANNELS"]
topiccmd.reqBotPerms = ["MANAGE_CHANNELS"]
topiccmd.process = function (message, args) {
    return util.justOnePromise(
        message.channel.setTopic(args[0][0]),
        util.redel(`Changed Topic to: ${args[0][0]}`),
        util.redel("Cannot change channel topic.")
    )
}
cmdModule.addCmd(topiccmd)
