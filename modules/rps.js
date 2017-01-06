const command = require('../command.js').command;
const util = require('../util.js');

const playerData = require('./gambling.js').playerData;
const currency = require('./gambling.js').currency;

const cmdModuleobj = require('../command.js').cmdModuleobj;
let cmdModule = new cmdModuleobj('RockPaperScissors');
cmdModule.description = `RockPaperScissors, with some more advanced modes.`
cmdModule.serverOnly = true;
exports.cmdModule = cmdModule;

rpslist = ['Rock', 'Paper', 'Scissors'];
rpslslist = rpslist.concat(['Lizard', 'Spock']);
rpslssbwglist = rpslslist.concat(['Spiderman', 'Batman', 'wizard', 'Glock']);
rpsDB = {};

//pl1,pl2 inputs have to be elements from the rpslists
function checkWin(list, pl1, pl2) {
    if (util.hasChain(rpsDB, pl1 + '.' + pl2)) return true;
    else if (util.hasChain(rpsDB, pl2 + '.' + pl1)) return false;
}
function getWin(list, pl1, pl2) {
    let w1 = util.getChain(rpsDB, pl1 + '.' + pl2);  
    let w2 = util.getChain(rpsDB, pl2 + '.' + pl1);
    return w1 ? w1 : w2;
}

//very basic check, return undefined if not exist.
function getfromrpslist(list,str) {
    return list.find((element) => {
        return element.toLowerCase() === str.toLowerCase();
    })
}

function addrpsoutcome(list,val1, val2, formatstr) {
    v1 = getfromrpslist(list,val1);
    v2 = getfromrpslist(list, val2);
    if (!v1 || !v2) return;
    if (!rpsDB[v1]) rpsDB[v1] = {};
    rpsDB[v1][v2] = formatstr;
}
var parsestring =
`Scissors cuts Paper.
Paper covers Rock.
Rock crushes Lizard.
Lizard poisons Spock.
Spock zaps Wizard.
Wizard stuns Batman.
Batman scares Spiderman.
Spiderman disarms Glock.
Glock breaks Rock.
Rock interrupts Wizard.
Wizard burns Paper.
Paper disproves Spock.
Spock befuddles Spiderman.
Lizard confuses Batman.
Spiderman defeats Lizard.
Lizard confuses Batman (presumably because it looks like Killer Croc).
Batman dismantles scissors.
Scissors cut Wizard.
Wizard transforms Lizard.
Lizard eats Paper.
Paper jams Glock. 
Glock kills Batman's mum.
Batman explodes Rock.
Rock crushes Scissors.
Scissors decapitate Lizard.
Lizard is too small for Glock.
Glock shoots Spock.
Spock vaporizes Rock.
Rock knocks out Spiderman.
Spiderman rips Paper.
Paper delays Batman.
Batman hangs Spock.
Spock smashes Scissors.
Scissors cut Spiderman.
Spiderman annoys Wizard.
Wizard melts Glock.
Glock dents Scissors.`;
function parsefromString() {
    let strings = parsestring.split('\n');
    let reg = new RegExp(rpslssbwglist.map((ele) => { return `\\b` + ele + `\\b`}).join("|"),'gi');
    strings.forEach((line) => {
        let match = line.match(reg);
        if (match.length > 2) {
            console.log(`improper RPS string: ${line}`);
            return;
        }
        addrpsoutcome(rpslssbwglist, match[0], match[1], line);
    });
}
parsefromString();

function handlerpsmessage(message, list, arg, winamount) {
    if (!arg) return util.replyWithTimedDelete(message, `Invalid entry. Use one of [${list.join(', ')}]`);
    let meganans = list[util.getRandomInt(0, list.length)];
    let playerans = getfromrpslist(list, arg);
    if (!playerans) return util.replyWithTimedDelete(message, `Invalid entry. Use one of [${list.join(', ')}]`);
    let boolwin = false;
    if (meganans !== playerans) boolwin = checkWin(list, playerans, meganans);
    let ans = `You chose ${playerans}, I chose ${meganans}`;
    if (meganans !== playerans) ans += `\n` + getWin(list, playerans, meganans);
    if (meganans === playerans) ans += `\nIT'S A TIE!`;
    else if (boolwin) {
        ans += '\nYOU WIN!';
        playerData.getOrCreatePlayer(message.author.id).wallet.addMoney(winamount);
        ans += `\n<@${message.author.id}> has received ${currency.symbol}${winamount}.\n`;
    } else ans += '\nYOU LOSE!';
    util.replyWithTimedDelete(message, ans);
    return true;
}
/*
let rpscmd = new command(['rockpaperscissors', 'rps']);
rpscmd.userCooldown = 10;
rpscmd.usage = [`[${rpslist.join(', ')}]** choose an option to play`]
rpscmd.process = function (message, args) {
    if (handlerpsmessage(message, rpslist, args[0],1)) this.setCooldown(message);
}
cmdModule.addCmd(rpscmd);
let rpslscmd = new command(['rockpaperscissorslizardspock', 'rpsls']);
rpslscmd.userCooldown = 20;
rpslscmd.usage = [`[${rpslslist.join(', ')}]** choose an option to play`]
rpslscmd.process = function (message, args) {
    if (handlerpsmessage(message, rpslslist, args[0],2)) this.setCooldown(message);
}
cmdModule.addCmd(rpslscmd);
let rpslssbwgcmd = new command(['rockpaperscissorslizardspockspidermanbatmanwizardglock', 'rpslssbwg']);
rpslssbwgcmd.userCooldown = 30;
rpslssbwgcmd.usage = [`[${rpslssbwglist.join(', ')}]** choose an option to play`]
rpslssbwgcmd.process = function (message, args) {
    if (handlerpsmessage(message, rpslssbwglist, args[0],3)) this.setCooldown(message);
}
cmdModule.addCmd(rpslssbwgcmd);
*/
function addrpsvariation(cmds,list, amount, cooldown) {
    let rpsvariation = new command(cmds);
    rpsvariation.userCooldown = cooldown;
    rpsvariation.usage = [`[${list.join(', ')}]** choose an option to play`]
    rpsvariation.process = function (message, args) {
        if (handlerpsmessage(message, list, args[0], amount)) this.setCooldown(message);
    }
    cmdModule.addCmd(rpsvariation);
}
addrpsvariation(['rockpaperscissors', 'rps'], rpslist, 1, 10);
addrpsvariation(['rockpaperscissorslizardspock', 'rpsls'], rpslslist, 2, 20);
addrpsvariation(['rockpaperscissorslizardspockspidermanbatmanwizardglock', 'rpslssbwg'], rpslssbwglist, 3, 30);