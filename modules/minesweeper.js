const util = require.main.exports.getRequire('util');
const command = require.main.exports.getRequire('command');
const cmdModuleobj = require.main.exports.getRequire('commandmodule');

const playerData = require.main.exports.getRequire('playerdata').playerData;
const currency = require.main.exports.getRequire('playerdata').currency;

let cmdModule = new cmdModuleobj('Minesweeper');
cmdModule.description = `a minesweeper game`;
module.exports = cmdModule;

let bomb = `💣`;//'b'
let blank = `⏹`;//'o'
let flag = `🚩`;//'f'
let wrongflag = `❌`;//'x'
let letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

minesweeperGame = function (xsmin, ysmin, xsmax, ysmax) {
    this.xsizemin = xsmin;
    this.ysizemin = ysmin;

    this.xsizemax = xsmax;
    this.ysizemax = ysmax;

    this.xsize = 0;
    this.ysize = 0;

    this.board = [];
    this.playerboard = [];
    this.numbombs = 0;
    this.boardmsg = null;
    this.tchannel = null;
    this.gameover = false;
    this.gamewin = false;

    this.players = {};
}
minesweeperGame.prototype.newGame = function (xs, ys) {
    console.log(`minesweeperGame.prototype.newGame(${xs},${ys})`);
    if (this.boardmsg) {
        this.boardmsg.delete().then().catch(console.error);
    }
    this.boardmsg = null;
    this.players = {};
    if (xs < this.xsizemin) xs = this.xsizemin;
    if (xs > this.xsizemax) xs = this.xsizemax;
    this.xsize = xs;

    if (ys < this.ysizemin) ys = this.ysizemin;
    if (ys > this.ysizemax) ys = this.ysizemax;
    this.ysize = ys;

    this.gameover = false;
    this.gamewin = false;
    this.numbombs = 0;
    this.board = [];
    for (var x = 0; x < this.xsize; x++) {
        let col = [];
        for (var y = 0; y < this.ysize; y++)
            col.push(0);
        this.board.push(col);
    }
    this.playerboard = [];
    for (var x = 0; x < this.xsize; x++) {
        let col = [];
        for (var y = 0; y < this.ysize; y++)
            col.push('o');
        this.playerboard.push(col);
    }
    for (var x = 0; x < this.xsize; x++) {
        for (var y = 0; y < this.ysize; y++) {
            if (util.percentChance(15)) {
                this.numbombs++;
                this.board[x][y] = 'b';
                for (var xoff = -1; xoff < 2; xoff++) {
                    for (var yoff = -1; yoff < 2; yoff++) {
                        let curxoff = x + xoff;
                        let curyoff = y + yoff;
                        if (curxoff >= 0 && curxoff < this.xsize && curyoff >= 0 && curyoff < this.ysize && this.board[curxoff][curyoff] !== 'b')
                            this.board[curxoff][curyoff] = this.board[curxoff][curyoff] + 1;
                    }
                }
            }
        }
    }
}
minesweeperGame.prototype.addToPlayer = function (id, amount) {
    if (!this.players[id])
        this.players[id] = 0.0;
    this.players[id] += amount;
}

minesweeperGame.prototype.mark = function (x, y, message) {
    if (this.gameover) return;
    if (x > this.xsize || y > this.ysize) return;
    if (this.playerboard[x][y] === 'o' && !this.gameover) {
        this.playerboard[x][y] = 'f';
        if (this.board[x][y] === 'b') this.addToPlayer(message.author.id, 1.0);
    }
    util.createMessage({
        message: this.boardmsg,
        messageContent: this.boardToString(this.playerboard)
    });
}
minesweeperGame.prototype.dig = function (x, y, message) {
    if (this.gameover) return;
    if (x > this.xsize || y > this.ysize) return;
    if (this.playerboard[x][y] === 'o' || this.playerboard[x][y] === 'f') {
        if (this.board[x][y] === 0) {
            recursezero.bind(this)(x, y);
        } else if (this.board[x][y] === 'b') {
            this.gameOver(message);
        } else {
            this.playerboard[x][y] = this.board[x][y];
        }
        if (this.board[x][y] !== 'b') this.addToPlayer(message.author.id , 0.1);
        
    }
    function recursezero(rx, ry) {
        this.playerboard[rx][ry] = this.board[rx][ry];
        if (this.board[rx][ry] !== 0) return;
        for (var xoff = -1; xoff < 2; xoff++) {
            for (var yoff = -1; yoff < 2; yoff++) {
                let curxoff = rx + xoff;
                let curyoff = ry + yoff;
                if (curxoff >= 0 && curxoff < this.xsize && curyoff >= 0 && curyoff < this.ysize && this.playerboard[curxoff][curyoff] === 'o')
                    recursezero.bind(this)(curxoff, curyoff);
            }
        }
    }
    util.createMessage({
        message: this.boardmsg,
        messageContent: this.boardToString(this.playerboard)
    });

    if (this.checkWin()) {
        this.gamewin = true;
        this.gameOver(message);
        console.log("WIN GAME BOOO YEAH");
    }
}

minesweeperGame.prototype.boardToString = function(brd){
    msg = '';
    for (var y = 0; y < this.ysize; y++) {
        msg += util.getLetterSymbol(letters[y]) + '  ';
        for (var x = 0; x < this.xsize; x++) {
            if (brd[x][y] === 'b')
                msg += bomb;
            else if (brd[x][y] === 'o')
                msg += blank;
            else if (brd[x][y] === 'f')
                msg += flag;
            else if (brd[x][y] === 'x')
                msg += wrongflag;
            else
                msg += util.getDigitSymbol(brd[x][y]);
        }
        msg += '\n';
    }
    msg += '\n';
    if (this.gameover) {
        if (this.gamewin) {
            msg += "😎"
        } else {
            msg += "😖"
        }
    } else {
        msg += "😀"
    }
    msg += `  ` + `0123456789012345678901234567890123456789`.slice(0, this.xsize).split(``).map(util.getDigitSymbol).join('');
    console.log("MINESWEEPER BOARD STRING SIZE:" + msg.length);
    msg += `\n`;
    if (this.gameover) {
        if (this.gamewin) {
            msg += "YOU WIN!";
        } else {
            msg += "YOU LOSE!";
        }
    }
    return msg;
}
minesweeperGame.prototype.checkWin = function () {
    if (this.playerboard.every((col, x) => {
        return col.every((ele, y) => {
            if (ele === 'o' && this.board[x][y] !== 'b') return false;
            if (ele === 'f' && this.board[x][y] !== 'b') return false;
            return true;
        });
    })) return true;


    return false;
}
minesweeperGame.prototype.gameOver = function (message) {
    if (this.gameover) return '';
    this.gameover = true;
    let unmarkedbombs = 0;
    for (var ix = 0; ix < this.xsize; ix++) {
        for (var iy = 0; iy < this.ysize; iy++) {
            if (this.board[ix][iy] === 'b' && this.playerboard[ix][iy] !== 'f') {
                this.playerboard[ix][iy] = 'b';
                unmarkedbombs++;
            }if (this.playerboard[ix][iy] === 'f' && this.board[ix][iy] !== 'b')
                this.playerboard[ix][iy] = 'x';
        }
    }
    if (this.gamewin && Object.keys(this.players).length !== 0 && unmarkedbombs != 0) {
        let average = unmarkedbombs / Object.keys(this.players).length;
        for (var player in this.players)
            this.players[player] += average;
    }
    return this.printWinners(message);
}
minesweeperGame.prototype.printWinners = function (message) {
    msg = 'Player earnings:\n';
    if (Object.keys(this.players).length === 0) {
        msg = `No one earned anything! better luck next time.`
    } else {
        for (var player in this.players) {
            let money = Math.floor(this.players[player]);
            playerData.getOrCreatePlayer(player).wallet.addMoney(money);
            msg += `<@${player}> has received ${currency.symbol}${money}.\n`;
        }
    }
    return util.createMessage({
        messageContent: msg
    }, message);
}

const xmin = 15;
const ymin = 15;
const xmax = 35;
const ymax = 26;

msgames = {};
msgames.getOrCreateGame = function (channelid) {
    if (!msgames[channelid])
        msgames[channelid] = new minesweeperGame(xmin, ymin, xmax, ymax);
    return msgames[channelid];
}

let xyargsTemplate = [
    [new util.customType(x => x >= 0 ? x : null, util.staticArgTypes['int']), new util.customType(y => {
            if (y.length > 1) return null;
            y = y.toLowerCase().charCodeAt(0) - 97;
            return y >= 0 ? y : null;
        })]
];


let minesweepercmd = new command(['minesweeper']);
minesweepercmd.usage = [
    `[xsize] [ysize]** Create a new minesweeper board with specified size. Minimum: ${xmin}x${ymin}, Maximum: ${xmax}x${ymax}`,
];
minesweepercmd.argsTemplate = [
    [new util.customType(x => x >= xmin && x <= xmax ? x : null, util.staticArgTypes['int']), new util.customType(y => y >= ymin && y <= ymax ? y : null, util.staticArgTypes['int'])]
];
minesweepercmd.channelCooldown = 10;//10 seconds
minesweepercmd.process = function (message, args) {
    if (msgames[message.channel.id] && !msgames[message.channel.id].gameover) return Promise.reject(util.redel("There is still a game going on!"));
    let msgame = msgames.getOrCreateGame(message.channel.id);
    msgame.newGame(args[0][0], args[0][1]);
    
    /*message.channel.sendMessage(msgame.boardToString(msgame.playerboard))*/
    return util.createMessage({ messageContent: msgame.boardToString(msgame.playerboard) },message).then(msg => {
        msgame.boardmsg = msg;
        msgame.tchannel = message.channel;
    })
}
cmdModule.addCmd(minesweepercmd);

let minesweeperdig = new command(['minesweeperdig','dig']);
minesweeperdig.usage = [
    `[x] [y]** Mine the block at (x,y)`,
];
minesweeperdig.argsTemplate = xyargsTemplate;
minesweeperdig.process = function (message, args) {
    if (!msgames[message.channel.id]) return Promise.reject(util.redel("No current minesweeper game."));
    let msgame = msgames.getOrCreateGame(message.channel.id);
    if (message.channel.id !== msgame.tchannel.id) return Promise.reject(util.redel('Bad channel binding'));
    msgame.dig(args[0][0], args[0][1], message);
    return Promise.resolve({
        message: message,
        deleteTime: 5 * 1000
    });
}
cmdModule.addCmd(minesweeperdig);


let minesweepermark = new command(['minesweepermark', 'mark']);
minesweepermark.usage = [
    `[x][y]** Mark the block at (x,y) as a possible mine`,
];
minesweepermark.argsTemplate = xyargsTemplate;
minesweepermark.process = function (message, args) {
    if (!msgames[message.channel.id]) return Promise.reject(util.redel("No current minesweeper game."));
    let msgame = msgames.getOrCreateGame(message.channel.id);
    if (message.channel.id !== msgame.tchannel.id) return Promise.reject(util.redel('Bad channel binding'));

    msgame.mark(args[0][0], args[0][1], message);
    return Promise.resolve({
        message: message,
        deleteTime: 5 * 1000
    });
}
cmdModule.addCmd(minesweepermark);

let printboardcmd = new command(['printboard']);
printboardcmd.usage = [
    `** print the board, if the board is getting swamped by messages.`,
];
printboardcmd.process = function (message, args) {
    if (!msgames[message.channel.id]) return Promise.reject(util.redel("No current minesweeper game."));
    let msgame = msgames.getOrCreateGame(message.channel.id);
    if (message.channel.id !== msgame.tchannel.id) return Promise.reject(util.redel('Bad channel binding'));
    message.channel.sendMessage(msgame.boardToString(msgame.playerboard)).then(msg => {
        msgame.boardmsg.delete().then(() => {
            msgame.boardmsg = msg;
        }).catch(console.error);
    }).catch(console.error);
}
cmdModule.addCmd(printboardcmd);

let endminesweepercmd = new command(['endminesweeper']);
endminesweepercmd.usage = [
    `** End the current minesweeper game, and collect earned ${currency.nameplural}.`,
];
endminesweepercmd.process = function (message, args) {
    if (!msgames[message.channel.id] || msgames[message.channel.id].gameover) return Promise.reject(util.redel("No current minesweeper game."));
    let msgame = msgames.getOrCreateGame(message.channel.id);
    if (message.channel.id !== msgame.tchannel.id) return Promise.reject(util.redel('Bad channel binding'));
    msgame.gameOver();
}
cmdModule.addCmd(endminesweepercmd);