const util = require.main.exports.getRequire("util")
const command = require.main.exports.getRequire("command")
const cmdModuleobj = require.main.exports.getRequire("commandmodule")

const playerData = require.main.exports.getRequire("playerdata").playerData
const currency = require.main.exports.getRequire("playerdata").currency

let cmdModule = new cmdModuleobj("Gambling")
cmdModule.description = "gambling stuff with money"

module.exports = cmdModule

let eightBallResponse = [
    "It is certain",
    "It is decidedly so",
    "Without a doubt",
    "Yes, definitely",
    "You may rely on it",
    "As I see it, yes",
    "Most likely",
    "Outlook good",
    "Yes",
    "Signs point to yes",
    "Reply hazy try again",
    "Ask again later",
    "Better not tell you now",
    "Cannot predict now",
    "Concentrate and ask again",
    "Don't count on it",
    "My reply is no",
    "My sources say no",
    "Outlook not so good",
    "Very doubtful",
]

let eightball = new command("8ball")
eightball.userCooldown = 5 * 60//5 minutes
eightball.cost = 5
eightball.usage = [`[Question] **\nPay ${currency.symbol}${eightball.cost} and ask the Magic 8ball a question. Affirmative answers awards you ${currency.nameplural}.`,]
eightball.argsTemplate = [
    [util.staticArgTypes["string"]]
]
eightball.process = function (message, args) {

    let player8 = playerData.getOrCreatePlayer(message.author.id)

    let answerid = util.getRandomIntInclusive(0, 19)

    let answer = `You paid the 9-ball ${currency.symbol}${eightball.cost} and asked, "${args[0][0]}"\nThe Magic 8 Ball answers: "${eightBallResponse[answerid]}"\n`
    if (answerid < 10) {
        answer += `Since the Magic 8 Ball answered affirmatively, you get ${this.cost * 2}${currency.nameplural}! :smiley: `
        player8.wallet.addMoney(this.cost)
    } else if (answerid < 15) {
        answer += `Since the Magic 8 Ball answered non-committally, you get your ${this.cost}${currency.nameplural} back! :neutral_face: `
    } else {
        answer += `Since the Magic 8 Ball answered negatively, you don't get your ${currency.nameplural} back! :disappointed: `
        player8.wallet.subMoney(this.cost)
    }
    return Promise.resolve({
        messageContent: answer,
        reply: true,
        deleteTime:60*1000
    })
}
cmdModule.addCmd(eightball)


let dicecmd = new command("dice")
dicecmd.userCooldown = 15//15 seconds
dicecmd.usage = [
    "** roll a 6-sided die",
    "[x]** roll x number of 6-sided dice",
    "d[y]** roll one y-sided dice",
    "[x]d[y]** roll x number of y-sided dice\nNOTE: max 30 dice can be rolled at once, max 1337 sides.\nNOTE: if you get max number on all the dice in a roll, you get an exponential reward",
]
dicecmd.argsTemplate = [
    [new util.customType(() => {
        return [1, 6]
    }, util.staticArgTypes["none"])],
    [new util.customType(arg => {
        let x, y
        let xy = arg.toLowerCase().split("d")
        if (xy.length === 2) {//xdy notation
            x = parseInt(xy[0])
            if (!x) x = 1
            y = parseInt(xy[1])
        } else {//asssume its x notation
            x = parseInt(arg)
            y = 6
        }
        if (!x || x <= 0 || !y || y <= 1 || y > 1337) return null
        if (x > 30) x = 30//limit number of dice rolls to 30;
        return [x, y]
    }, util.staticArgTypes["word"])]
]
dicecmd.process = function (message, args) {
    return new Promise((resolve) => {
        let [x, y] = args.reverse().find(val => val != null)[0]
        //x = number of dices
        //y = number of faces
        this.setCooldown(message)//set cooldown now cause things might get desynced
        let results = []
        let rolls = []
        for (var i = 0; i < x; i++) {
            rolls.push(util.getRandomIntInclusive(1, 5))
            results.push(util.getRandomIntInclusive(1, y))
        }
        let msgini1 = `<@${message.author.id}>, 🎲 Rolling `
        let msgini2 = `<@${message.author.id}>, 🎲 Rolled `
        let msgini = ""
        if (x === 1) msgini += "one "
        else msgini += `${x} `
        msgini += `${y}-sided `
        if (x === 1) msgini += "die"
        else msgini += "dice"
        msgini += "🎲 \n"

        util.createMessage({
            messageContent: msgini1 + msgini + dicestring()
        }, message).then((msg) => {
            let timer = setInterval(() => {
                for (var i = 0; i < x; i++) {
                    if (rolls[i] > 0) {
                        rolls[i] = rolls[i] - 1
                        results[i] = util.getRandomIntInclusive(1, y)
                    }
                }
                if (!rolls.every(ele => ele === 0)) {
                    return util.createMessage({
                        message: msg,
                        messageContent: msgini1 + msgini + dicestring()
                    })
                } else {
                    clearInterval(timer)
                    let result = ""
                    if (y >= 4 && results.every(val => val === y)) {
                        let rewardamount = Math.pow((y - 3), x)
                        result += `\n**CRITICAL ROLL!!!**, you have been rewarded ${currency.symbol}${rewardamount}`
                        playerData.getOrCreatePlayer(message.author.id).wallet.addMoney(rewardamount)
                    }
                    return resolve({
                        message: msg,
                        messageContent: msgini2 + msgini + dicestring() + result,
                        deleteTime: 2 * 60 * 1000
                    })

                }
            }, 700)
        }).catch(console.error)
        function dicestring() {
            return y <= 10 ? results.map(ele => util.getDigitSymbol(ele)).join(" ") : `**${results.join(", ")}**`
        }
    })
}
cmdModule.addCmd(dicecmd)

let slotscmd = new command("slots")
slotscmd.userCooldown = 10//10 seconds
slotscmd.cost = 5
slotscmd.usage = [
    `** pay ${slotscmd.cost} dollars to roll the slots
Rolling 2 of the same number gets ${slotscmd.cost} x number
Rolling 3 of the same number gets ${slotscmd.cost} x number^2
`
]
slotscmd.process = function (message) {
    return new Promise((resolve) => {
        let player = playerData.getOrCreatePlayer(message.author.id)
        if (player.wallet.getAmount() < this.cost) return Promise.reject(redel(`You you need ${this.cost} ${currency.nameplural} to bet.`))
        player.wallet.subMoney(this.cost)
        let slotarr = ["💩", "2⃣", "3⃣", "4⃣", "5⃣", "6⃣", "7⃣", "8⃣", "9⃣", "🔟"]
        let results = []
        let rolls = []
        for (var i = 0; i < 3; i++) {
            rolls.push(util.getRandomInt(0, slotarr.length))
            results.push(6)//start with 777
        }
        let msgini1 = `<@${message.author.id}>, You paid ${this.cost} ${currency.nameplural}\n🎰 Rolling 🎰\n`
        let msgini2 = `<@${message.author.id}>, You paid ${this.cost} ${currency.nameplural}\n🎰 Rolled 🎰\n`

        util.createMessage({
            messageContent: msgini1 + slotstring(),
        }, message).then((msg) => {
            let timer = setInterval(() => {
                for (var i = 0; i < 3; i++) {
                    if (rolls[i] > 0) {
                        rolls[i] = rolls[i] - 1
                        results[i] = (results[i] + 1) % slotarr.length
                    }
                }
                if (!rolls.every(ele => ele === 0))
                    return util.createMessage({
                        message: msg,
                        messageContent: msgini1 + slotstring()
                    })

                clearInterval(timer)
                let result = ""
                if (results[0] === results[1] && results[1] === results[2] && results[1] != 0) {
                    let rewardamount = this.cost * Math.pow((results[1] + 1), 2)
                    result += `\n**Triple Roll!!!**, you have been rewarded ${currency.symbol}${rewardamount}`
                    player.wallet.addMoney(rewardamount)
                }
                else if (
                    (results[0] === results[1] && results[0] != 0) ||
                    (results[1] === results[2] && results[1] != 0) ||
                    (results[0] === results[2] && results[0] != 0)
                ) {
                    let number = 0
                    if (results[0] === results[1] || results[1] === results[2]) number = results[1] + 1
                    else if (results[0] === results[2]) number = results[0] + 1
                    let rewardamount = this.cost * number
                    result += `\n**Double Roll!**, you have been rewarded ${currency.symbol}${rewardamount}`
                    player.wallet.addMoney(rewardamount)
                }
                else {
                    result += "\n**Bad Roll.**, Better luck next time."
                }
                return resolve({
                    message: msg,
                    messageContent: msgini2 + slotstring() + result,
                    deleteTime: 2* 60 *1000
                })
            }, 750)
        }).catch(console.error)
        function slotstring() {
            return results.map(ele => slotarr[ele]).join(" ")
        }
    })

}
cmdModule.addCmd(slotscmd)


let betHundred = new command("bethundred")
betHundred.userCooldown = 5 * 60//5 minutes
betHundred.usage = [`[Amount] **\nBets a certain amount of ${currency.nameplural} and get a number between 1-100. Getting over 66 yields x2 of your currency, over 90 - x3 and 100 x10.`,]
betHundred.argsTemplate = [
    [new util.customType(v => v > 0 ? v : null, util.staticArgTypes["int"])]
]

betHundred.process = function (message, args) {
    let amount = args[0][0]
    let player = playerData.getOrCreatePlayer(message.author.id)
    if (player.wallet.getAmount() < amount) Promise.reject(util.redel(`You don't have enough ${currency.nameplural} to bet.`))

    let value = util.getRandomIntInclusive(1, 100)
    //value = 100;
    player.wallet.subMoney(amount)
    let msg = `You bet ${currency.symbol}${amount}, and rolled ${value}. \n`

    if (value < 67) {
        msg += "Better luck next time."
    }
    else if (value < 91) {
        msg += `Congratulations! You won ${currency.symbol}${amount * 2} for rolling above 66`
        player.wallet.addMoney(amount * 2)
    }
    else if (value < 100) {
        msg += `Congratulations! You won ${currency.symbol}${amount * 3} for rolling above 90.`
        player.wallet.addMoney(amount * 3)
    }
    else {
        msg += `👑 Congratulations! You won ${currency.symbol}${amount * 10} for rolling **100**. 👑`
        player.wallet.addMoney(amount * 10)
    }
    return Promise.resolve({
        messageContent: msg,
        reply: true,
        deleteTime: 60 * 1000
    })
}
cmdModule.addCmd(betHundred)
