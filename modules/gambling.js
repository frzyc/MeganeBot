const fs = require("fs");
const command = require('../command.js').command;
const util = require('../util.js');
//const client = require('../bot.js').client;

const cmdModuleobj = require('../command.js').cmdModuleobj;
let cmdModule = new cmdModuleobj('Gambling');
cmdModule.description = `gambling stuff with money`;

var datafile = '../data/playerData.json';

var currencyobj = function () {
    this.name = "MeganeBuck";
    this.nameplural = "MeganeBucks";
    this.symbol = "M$";
    this.emoji = "💵";
}
var currency = new currencyobj();

var wallet = function (val) {
    else this.amount = 0;
    this.checkvalid();
}
wallet.prototype.addMoney = function (val) {
    //console.log(`addMoney(${val}) before: ${this.amount}`);
    this.checkvalid();
    this.amount += val;
    //console.log(`addMoney(${val}) after: ${this.amount}`);
}
wallet.prototype.subMoney = function (val) {
    this.checkvalid();
    if (this.amount >= val) {
        this.amount -= val;
    } else this.amount = 0;
}
wallet.prototype.getAmount = function () {
    this.checkvalid();
    return this.amount;
}
wallet.prototype.checkvalid = function () {
    //console.log(`checkvalid() before: ${this.amount}`);
    if (!isFinite(this.amount)) 
        this.amount = 0;
    //console.log(`checkvalid() beforetrunc: ${this.amount}`);
    this.amount = Math.trunc(this.amount);
    //console.log(`checkvalid() after: ${this.amount}`);
}

var player = function (id) {
    this.id = id;
    this.wallet = new wallet();
}

var playerDataObj = function () {
    this.playerList = {};
    
    setInterval(()=> {
        this.saveData();
    }, 300*1000);
}

playerDataObj.prototype.addPlayer = function (id) {
    console.log(`playerDataObj.prototype.addPlayer(${id})`);
    this.playerList[id] = new player(id);
    return this.playerList[id];
}
playerDataObj.prototype.removePlayer = function (id) {
    console.log(`playerDataObj.prototype.removePlayer(${id})`);
    if (this.playerList[id]) delete this.playerList[id]; 
}
playerDataObj.prototype.readData = function () {
    console.log(`playerDataObj.prototype.readData()`);
    fs.readFile(__dirname + '/' + datafile, 'utf8', (err, data)=> {
        if (err) {
            this.playerList = {};
            return console.log(err);
        }
        try {
            this.playerList = JSON.parse(data);
        } catch (e) {
            console.log(e);
            this.playerList = {};
        }
        if (!this.playerList) this.playerList = {};
        for (id in this.playerList) {
            //console.log(`reconstructing wallet for ${id}`);
            let player = this.playerList[id];
            if (player.wallet && player.wallet.amount) 
                player.wallet = new wallet(player.wallet.amount);
            else 
                player.wallet = new wallet();
            
            
        }
    });
}
playerDataObj.prototype.saveData = function () {
    console.log(`playerDataObj.prototype.saveData`);
    fs.writeFile(__dirname + '/' + datafile, JSON.stringify(this.playerList), 'utf8', (err) => {
        if (err) return console.log(err);
        console.log(`saved player data to file...`);
    });
}

playerDataObj.prototype.hasPlayer = function (id) {
    console.log(`playerDataObj.prototype.hasPlayer(${id})`);
    if (this.playerList[id]) return true;
    else return false;
}
playerDataObj.prototype.getOrCreatePlayer = function (id) {
    console.log(`playerDataObj.prototype.getOrCreatePlayer(${id})`);
    if (this.hasPlayer(id)) return this.playerList[id];
    else return this.addPlayer(id);
}

var playerData = new playerDataObj();
playerData.readData();

module.exports = {
    cmdModule : cmdModule,
    playerData: playerData,
    playerDataObj: playerDataObj,
    player: player,
    currency: currency,
    currencyobj: currencyobj,
    wallet: wallet,
}
let walletcmd = new command(['wallet']);
walletcmd.usage = [
    `** Get how much ${currency.nameplural} in your wallet.`,
];
walletcmd.process = function (message, args) {
    let amount = playerData.getOrCreatePlayer(message.author.id).wallet.getAmount();
    return util.replyWithTimedDelete(message, `You currently have ${currency.emoji} ${currency.symbol}${amount} ${currency.nameplural} ${currency.emoji} in your wallet.`, 30*1000);
}
cmdModule.addCmd(walletcmd);

let givecmd = new command(['give']);
givecmd.usage = [
    `[amount] [mention someguy]**\nGive some amount of ${currency.nameplural} from your wallet to some guy.`,
    `[amount] [mention someguy] [mention anotherguy] [mention more guys]**\nGive some amount of ${currency.nameplural} to each person you mention.`,
    `[amount] [mention somerole] **\nGive everyone with that role a specified amount of ${currency.nameplural} each.`,
    `[amount] [mention everyone] **\nGive everyone in the server a specified amount of ${currency.nameplural} each.`,
];
givecmd.process = function (message, args) {
    if (!args || !args[0]) return util.replyWithTimedDelete(message, `Invalid amount`);
    let amount = parseInt(args[0]);
    if (!amount ||amount <= 0) return util.replyWithTimedDelete(message, `Invalid amount`);

    console.log(`give amount: ${amount}`);
    let giverid = message.author.id;
    let giver = playerData.getOrCreatePlayer(giverid);
    console.log(giver);
    if (giver.wallet.getAmount() === 0) return util.replyWithTimedDelete(message, `You have no ${currency.nameplural} to give`);
    let mentionedusers = util.getMentionedUsers(message);
    let mentioneduserscount = Object.keys(mentionedusers).length;
    console.log(`ALL MENTIONS size: ${mentioneduserscount}`);
    let total = mentioneduserscount * amount;
    if (giver.wallet.getAmount() < total) return util.replyWithTimedDelete(message, `You don't have enough ${currency.nameplural} to give, need ${currency.symbol}${total}.`);

    //start giving
    giver.wallet.subMoney(total);
    for (var id in mentionedusers) {
        let receiver = playerData.getOrCreatePlayer(id);
        receiver.wallet.addMoney(amount);
    }
    return util.replyWithTimedDelete(message, `You gave ${currency.symbol}${amount} each to these people!`, 60 * 1000);
}
cmdModule.addCmd(givecmd);

let awardcmd = new command(['award']);
awardcmd.usage = [
    `[amount] [mention someguy or guys or role or everyone]**\nAward the mentions some money.\nNOTE: botowner only.`,
];
awardcmd.ownerOnly = true;
awardcmd.process = function (message, args) {
    if (!args || !args[0]) return util.replyWithTimedDelete(message, `Invalid amount`);
    let amount = parseInt(args[0]);
    if (!amount || amount <= 0) return util.replyWithTimedDelete(message, `Invalid amount`);
    let mentionedusers = util.getMentionedUsers(message);
    //start giving
    for (var id in mentionedusers) {
        let receiver = playerData.getOrCreatePlayer(id);
        receiver.wallet.addMoney(amount);
    }
    return util.replyWithTimedDelete(message, `You awarded ${currency.symbol}${amount} each to these people!`, 60 * 1000);
}
cmdModule.addCmd(awardcmd);

let takecmd = new command(['take']);
takecmd.usage = [
    `[amount] [mention someguy or guys or role or everyone]**\Take some money from everyone in the mentions.\nNOTE: botowner only.`,
];
takecmd.ownerOnly = true;
takecmd.process = function (message, args) {
    if (!args || !args[0]) return util.replyWithTimedDelete(message, `Invalid amount`);
    let amount = parseInt(args[0]);
    if (!amount || amount <= 0) return util.replyWithTimedDelete(message, `Invalid amount`);
    let mentionedusers = util.getMentionedUsers(message);
    //start taking
    for (var id in mentionedusers) {
        let receiver = playerData.getOrCreatePlayer(id);
        receiver.wallet.subMoney(amount);
    }
    return util.replyWithTimedDelete(message, `You took ${currency.symbol}${amount} each from these people!`, 60 * 1000);
}
cmdModule.addCmd(takecmd);


let eightBallResponse = [
    `It is certain`,
    `It is decidedly so`,
    `Without a doubt`,
    `Yes, definitely`,
    `You may rely on it`,
    `As I see it, yes`,
    `Most likely`,
    `Outlook good`,
    `Yes`,
    `Signs point to yes`,
    `Reply hazy try again`,
    `Ask again later`,
    `Better not tell you now`,
    `Cannot predict now`,
    `Concentrate and ask again`,
    `Don't count on it`,
    `My reply is no`,
    `My sources say no`,
    `Outlook not so good`,
    `Very doubtful`,
]

let eightball = new command(['8ball']);
eightball.userCooldown = 5 * 60;//5 minutes
eightball.cost = 5;
eightball.usage = [`[Question] **\nPay ${currency.symbol}${eightball.cost} and ask the Magic 8ball a question. Affirmative answers awards you ${currency.nameplural}.`,];

eightball.process = function (message, args) {
    if (!args) return util.replyWithTimedDelete(message, `Invalid Question`, 10 * 1000);

    let player8 = playerData.getOrCreatePlayer(message.author.id);

    let answerid = util.getRandomIntInclusive(0, 19);
    
    let answer = `Asked, "${args.join(' ')}"\nThe Magic 8 Ball answers: "${eightBallResponse[answerid]}"\n`
    if (answerid < 10) {
        answer += `Since the Magic 8 Ball answered affirmatively, you get ${this.cost * 2}${currency.nameplural}! :smiley: `
        player8.wallet.addMoney(this.cost);
    } else if (answerid < 15) {
        answer += `Since the Magic 8 Ball answered non-committally, you get your ${this.cost}${currency.nameplural} back! :neutral_face: `
    } else {
        answer += `Since the Magic 8 Ball answered negatively, you don't get your ${currency.nameplural} back! :disappointed: `
        player8.wallet.subMoney(this.cost);
    }
    util.replyWithTimedDelete(message, answer, 60 * 1000);//1min
    this.setCooldown(message);
}
cmdModule.addCmd(eightball);


let dicecmd = new command(['dice']);
dicecmd.userCooldown = 30;//30 seconds
dicecmd.usage = [
    `** roll a 6-sided die`,
    `[x]** roll x number of 6-sided dice`,
    `d[y]** roll one y-sided dice`,
    `[x]d[y]** roll x number of y-sided dice\nNOTE: max 30 dice can be rolled at once, max 1337 sides.\nNOTE: if you get max number on all the dice in a roll, you get an exponential reward`,
]
dicecmd.process = function (message, args) {
    let results = [];
    let x, y;
    if (!args || !args[0]) {//roll 6-sided die
        x = 1;
        y = 6;
    } else {
        let xy = args[0].toLowerCase().split('d');
        if (xy.length === 2) {//xdy notation
            x = parseInt(xy[0]);
            if (!x) x = 1;
            y = parseInt(xy[1]);
        } else {//asssume its x notation
            x = parseInt(args[0]);
            y = 6;
        }
    }
    if (!x || x <= 0 || !y || y <= 1 || y > 1337) return util.replyWithTimedDelete(message, `Invalid parameter`, 10 * 1000);
    if (x > 30) x = 30;//limit number of dice rolls to 30;
    for (var i = 0; i < x; i++)
        results.push(util.getRandomIntInclusive(1, y));

    let msg = `:game_die: Rolled `;
    if (x === 1) msg += `one `;
    else msg += `${x} `;
    msg += `${y}-sided `
    if (x === 1) msg += `die`;
    else msg += `dice`;
    msg += `:game_die: \n`;

    if (y <= 10) {
        results.forEach((digit) => {
            msg += ` ${util.getDigitSymbol(digit)} `;
        })
    } else {
        msg += `**${results.join(', ')}**`;
    }
    if (y>= 4 && results.every((val) => { return val === y })) {
        let rewardamount = Math.pow((y-3), x);
        msg += `\n**CRITICAL ROLL!!!**, you have been rewarded ${currency.symbol}${rewardamount}`;
        playerData.getOrCreatePlayer(message.author.id).wallet.addMoney(rewardamount);
    }
    util.replyWithTimedDelete(message, msg, 5 * 60 * 1000);//5min

    this.setCooldown(message);
}
cmdModule.addCmd(dicecmd);

let betHundred = new command(['bethundred']);
betHundred.userCooldown = 5 * 60;//5 minutes
betHundred.usage = [`[Amount] **\nBets a certain amount of ${currency.nameplural} and get a number between 1-100. Getting over 66 yields x2 of your currency, over 90 - x3 and 100 x10.`,];

betHundred.process = function (message, args) {

    if (!args || !args[0]) return util.replyWithTimedDelete(message, `Invalid amount`);
    let amount = parseInt(args[0]);
    if (!amount || amount <= 0) return util.replyWithTimedDelete(message, `Invalid amount`);

    let player = playerData.getOrCreatePlayer(message.author.id);
    if (player.wallet.getAmount() < amount) return util.replyWithTimedDelete(message, `You don't have enough ${currency.nameplural} to bet.`);

    let value = util.getRandomIntInclusive(1, 100);
    //value = 100;
    player.wallet.subMoney(amount);
    let msg = `You bet ${currency.symbol}${amount}, and rolled ${value}. \n`;

    if (value < 67) {
        msg += `Better luck next time.`;
    }
    else if (value < 91) {
        msg += `Congratulations! You won ${currency.symbol}${amount * 2} for rolling above 66`;
        player.wallet.addMoney(amount * 2);
    }
    else if (value < 100) {
        msg += `Congratulations! You won ${currency.symbol}${amount * 3} for rolling above 90.`;
        player.wallet.addMoney(amount * 3);
    }
    else {
        msg += `👑 Congratulations! You won ${currency.symbol}${amount * 10} for rolling **100**. 👑`;
        player.wallet.addMoney(amount * 10);
    }
    util.replyWithTimedDelete(message, msg, 60 * 1000);//1min
    this.setCooldown(message);
}
cmdModule.addCmd(betHundred);