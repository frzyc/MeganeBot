const fs = require("fs")

const util = require.main.exports.getRequire("util")
const Command = require.main.exports.getRequire("command")
const CommandModule = require.main.exports.getRequire("commandmodule")

let cmdModule = new CommandModule("PlayerData")
cmdModule.description = "Stuff that have to deal with the data stored for each player."

var datafile = "../data/playerData.json"

var currencyobj = function () {
    this.name = "MeganeBuck"
    this.nameplural = "MeganeBucks"
    this.symbol = "M$"
    this.emoji = "💵"
}
/*var currencyobj = function () {
    this.name = "Pizza";
    this.nameplural = "Pizzas";
    this.symbol = "P$";
    this.emoji = "🍕";
}*/
var currency = new currencyobj()

var wallet = function (val) {
    if (val && isFinite(val)) this.amount = val
    else this.amount = 0
    this.checkvalid()
}
wallet.prototype.addMoney = function (val) {
    //console.log(`addMoney(${val}) before: ${this.amount}`);
    this.checkvalid()
    this.amount += val
    //console.log(`addMoney(${val}) after: ${this.amount}`);
}
wallet.prototype.subMoney = function (val) {
    this.checkvalid()
    if (this.amount >= val) {
        this.amount -= val
    } else {
        let temp = this.amount
        this.amount = 0
        return temp
    }
}
wallet.prototype.getAmount = function () {
    this.checkvalid()
    return this.amount
}
wallet.prototype.checkvalid = function () {
    //console.log(`checkvalid() before: ${this.amount}`);
    if (!isFinite(this.amount)) 
        this.amount = 0
    //console.log(`checkvalid() beforetrunc: ${this.amount}`);
    this.amount = Math.trunc(this.amount)
    //console.log(`checkvalid() after: ${this.amount}`);
}

var player = function (id) {
    this.id = id
    this.wallet = new wallet()
}

var playerDataObj = function () {
    this.playerList = {}
    
    setInterval(()=> {
        this.saveData()
    }, 300*1000)
}

playerDataObj.prototype.addPlayer = function (id) {
    console.log(`playerDataObj.prototype.addPlayer(${id})`)
    this.playerList[id] = new player(id)
    return this.playerList[id]
}
playerDataObj.prototype.removePlayer = function (id) {
    console.log(`playerDataObj.prototype.removePlayer(${id})`)
    if (this.playerList[id]) delete this.playerList[id] 
}
playerDataObj.prototype.readData = function () {
    console.log("playerDataObj.prototype.readData()")
    fs.readFile(__dirname + "/" + datafile, "utf8", (err, data)=> {
        if (err) {
            this.playerList = {}
            return console.log(err)
        }
        try {
            this.playerList = JSON.parse(data)
        } catch (e) {
            console.log(e)
            this.playerList = {}
        }
        if (!this.playerList) this.playerList = {}
        for (let id in this.playerList) {
            //console.log(`reconstructing wallet for ${id}`);
            let player = this.playerList[id]
            if (player.wallet && player.wallet.amount) 
                player.wallet = new wallet(player.wallet.amount)
            else 
                player.wallet = new wallet()
            
            
        }
    })
}
playerDataObj.prototype.saveData = function () {
    console.log("playerDataObj.prototype.saveData")
    fs.writeFile(__dirname + "/" + datafile, JSON.stringify(this.playerList), "utf8", (err) => {
        if (err) return console.log(err)
        console.log("saved player data to file...")
    })
}

playerDataObj.prototype.hasPlayer = function (id) {
    console.log(`playerDataObj.prototype.hasPlayer(${id})`)
    if (this.playerList[id]) return true
    else return false
}
playerDataObj.prototype.getOrCreatePlayer = function (id) {
    console.log(`playerDataObj.prototype.getOrCreatePlayer(${id})`)
    if (this.hasPlayer(id)) return this.playerList[id]
    else return this.addPlayer(id)
}

var playerData = new playerDataObj()
playerData.readData()

module.exports = cmdModule

let walletcmd = new Command("wallet")
walletcmd.usage = [
    `**{0}** Get how much ${currency.nameplural} in your wallet.`,
]
walletcmd.process = function (message) {
    let amount = playerData.getOrCreatePlayer(message.author.id).wallet.getAmount()
    return Promise.resolve({
        messageContent: `You currently have ${currency.emoji} ${currency.symbol}${amount} ${currency.nameplural} ${currency.emoji} in your wallet.`, 
        deleteTime: 30 * 1000,
        reply: true
    })
}
cmdModule.addCmd(walletcmd)

let amounttype = new util.customType(v => v > 0 ? v : null, util.staticArgTypes["int"])
let givecmd = new Command("give")
givecmd.usage = [
    `**{0} [amount] [mention someguy]** Give some amount of ${currency.nameplural} from your wallet to some guy.`,
    `**{0} [amount] [mention someguy] [mention anotherguy] [mention more guys]** Give some amount of ${currency.nameplural} to each person you mention.`,
    `**{0} [amount] [mention somerole] ** Give everyone with that role a specified amount of ${currency.nameplural} each.`,
    `**{0} [amount] [mention everyone] ** Give everyone in the server a specified amount of ${currency.nameplural} each.`,
]
givecmd.argsTemplate = [
    [amounttype, util.staticArgTypes["mentions"]]
]
givecmd.cost = 1//you need to give at least one
givecmd.process = function (message, args) {
    return new Promise((resolve, reject) => {
        let amount = args[0][0]
        let giverid = message.author.id
        let giver = playerData.getOrCreatePlayer(giverid)
        console.log(giver)
        if (giver.wallet.getAmount() === 0) return reject(util.redel(`You have no ${currency.nameplural} to give`))
        let mentionedusers = args[0][1]
        let mentioneduserscount = Object.keys(mentionedusers).length
        console.log(`ALL MENTIONS size: ${mentioneduserscount}`)
        let total = mentioneduserscount * amount
        console.log(`giver amount: ${giver.wallet.getAmount()}`)
        if (giver.wallet.getAmount() < total) return reject(util.redel(`You don't have enough ${currency.nameplural} to give, need ${currency.symbol}${total}.`))

        //start giving
        giver.wallet.subMoney(total)
        for (var id in mentionedusers) {
            let receiver = playerData.getOrCreatePlayer(id)
            receiver.wallet.addMoney(amount)
        }
        return resolve({
            messageContent: `You gave ${currency.symbol}${amount} each to ${util.getMentionStrings(message).join(", and ")}!`,
            deleteTime: 60 * 1000,
            reply: true
        })
    })
}
cmdModule.addCmd(givecmd)

let awardcmd = new Command("award")
awardcmd.usage = [
    "**{0} [amount] [mention someguy or guys or role or everyone]** Award the mentions some money.\nNOTE: botowner only.",
]
awardcmd.argsTemplate = [
    [amounttype, util.staticArgTypes["mentions"]]
]
awardcmd.ownerOnly = true
awardcmd.process = function (message, args) {
    return new Promise((resolve) => {
        let amount = args[0][0]
        let mentionedusers = args[0][1]
        //start giving
        for (var id in mentionedusers) {
            let receiver = playerData.getOrCreatePlayer(id)
            receiver.wallet.addMoney(amount)
        }
        return resolve({
            messageContent: `You awarded ${currency.symbol}${amount} each to ${util.getMentionStrings(message).join(", and ")}!`,
            deleteTime: 60 * 1000,
            reply: true
        })
    })
    
}
cmdModule.addCmd(awardcmd)

let takecmd = new Command("take")
takecmd.usage = [
    "**{0} [amount] [mention someguy or guys or role or everyone]** ake some money from everyone in the mentions.\nNOTE: botowner only.",
]
takecmd.argsTemplate = [
    [amounttype, util.staticArgTypes["mentions"]]
]
takecmd.ownerOnly = true
takecmd.process = function (message, args) {
    return new Promise((resolve) => {
        let amount = args[0][0]
        let mentionedusers = args[0][1]
        //start taking
        for (var id in mentionedusers) {
            let receiver = playerData.getOrCreatePlayer(id)
            receiver.wallet.subMoney(amount)
        }
        return resolve({
            messageContent: `You took ${currency.symbol}${amount} each from ${util.getMentionStrings(message).join(", and ")}!`,
            deleteTime: 60 * 1000,
            reply: true
        })
    })
}
cmdModule.addCmd(takecmd)