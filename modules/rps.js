const util = require.main.exports.getRequire('util');
const command = require.main.exports.getRequire('command');
const cmdModuleobj = require.main.exports.getRequire('commandmodule');
const playerData = require.main.exports.getRequire('playerdata').playerData;
const currency = require.main.exports.getRequire('playerdata').currency;

let cmdModule = new cmdModuleobj('RockPaperScissors');
cmdModule.description = `RockPaperScissors, with some more advanced modes.`
cmdModule.serverOnly = true;
module.exports = cmdModule;

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

function addrpsvariation(cmds,list, amount, cooldown) {
    let rpsvariation = new command(cmds);
    rpsvariation.userCooldown = cooldown;
    rpsvariation.usage = [`**{0} [${list.join(', ')}]** choose an option to play`]
    rpsvariation.argsTemplate = [
        [new util.customType(arg => getfromrpslist(list, arg))]
    ];
    rpsvariation.process = function (message, args) {
        return new Promise((resolve, reject) => {
            let playerans = args[0][0];
            let meganans = list[util.getRandomInt(0, list.length)];
            let boolwin = false;
            if (meganans !== playerans) boolwin = checkWin(list, playerans, meganans);
            let ans = `You chose ${playerans}, I chose ${meganans}`;
            if (meganans !== playerans) ans += `\n` + getWin(list, playerans, meganans);
            if (meganans === playerans) ans += `\nIT'S A TIE!`;
            else if (boolwin) {
                ans += '\nYOU WIN!';
                playerData.getOrCreatePlayer(message.author.id).wallet.addMoney(amount);
                ans += `\n<@${message.author.id}> has received ${currency.symbol}${amount}.\n`;
            } else ans += '\nYOU LOSE!';
            return resolve({
                messageContent: ans,
                deleteTime: 60 * 1000,
                reply: true
            });
        });
    }
    cmdModule.addCmd(rpsvariation);
}
addrpsvariation(['rockpaperscissors', 'rps'], rpslist, 1, 10);
addrpsvariation(['rockpaperscissorslizardspock', 'rpsls'], rpslslist, 2, 20);
addrpsvariation(['rockpaperscissorslizardspockspidermanbatmanwizardglock', 'rpslssbwg'], rpslssbwglist, 3, 30);