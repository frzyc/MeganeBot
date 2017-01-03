//const fs = require("fs");
const command = require('../command.js').command;
const util = require('../util.js');
//const client = require('../bot.js').client;

const playerData = require('./gambling.js').playerData;
const currency = require('./gambling.js').currency;

const cmdModuleobj = require('../command.js').cmdModuleobj;
let cmdModule = new cmdModuleobj('Minesweeper');
cmdModule.description = `a minesweeper game`;
exports.cmdModule = cmdModule;

let bomb = `💣`;//'b'
let blank = `⏹`;//'o'
let flag = `🚩`;//'f'
let wrongflag = `❌`;//'x'
let letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

minesweeperGame = function (xs, ys) {
    this.xsizemin = 10;
    this.ysizemin = 10;

    this.xsizemax = xs;
    this.ysizemax = ys;

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
            if (util.percentChance(10)) {
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
    if (this.playerboard[x][y] === 'o' && !this.gameover)
        this.playerboard[x][y] = 'f';
    if (this.board[x][y] === 'b')  this.addToPlayer(message.author.id, 1.0);

    this.boardmsg.edit(this.boardToString(this.playerboard));
}
minesweeperGame.prototype.dig = function (x, y, message) {
    if (this.gameover) return;
    console.log(`minesweeperGame.prototype.dig(${x},${y})`);
    if (this.playerboard[x][y] === 'o' || this.playerboard[x][y] === 'f') {
        if (this.board[x][y] === 0) {
            console.log("DUG ZERO");
            recursezero.bind(this)(x, y);
        } else if (this.board[x][y] === 'b') {
            console.log("GAME OVER GAME OVER");
            this.gameOver();
        } else {
            console.log("DUG NUMBA");
            this.playerboard[x][y] = this.board[x][y];//TODO detect BOMB for gameover
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
    if (this.checkWin()) {
        this.gamewin = true;
        this.gameOver();
        console.log("WIN GAME BOOO YEAH");
    }
    this.boardmsg.edit(this.boardToString(this.playerboard));
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
minesweeperGame.prototype.gameOver = function () {
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
    this.printWinners();
}
minesweeperGame.prototype.printWinners = function () {
    if (!this.tchannel) return;
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
    this.tchannel.sendMessage(msg);
}

msgames = {};
msgames.getOrCreateGame = function (channelid) {
    if (!msgames[channelid])
        msgames[channelid] = new minesweeperGame(35, 26);
    return msgames[channelid];
}
let minesweepercmd = new command(['minesweeper']);
minesweepercmd.usage = [
    `[xsize] [ysize]** Create a new minesweeper board with specified size.`,
];
minesweepercmd.channelCooldown = 5 * 60;//5 minutes
minesweepercmd.process = function (message, args) {
    let xy = getxy(args)
    if (!xy) return util.replyWithTimedDelete(message, "bad arguments");
    let msgame = msgames.getOrCreateGame(message.channel.id);
    msgame.newGame(xy.x, xy.y);
    //message.channel.sendMessage(msgame.boardToString(msgame.board));
    message.channel.sendMessage(msgame.boardToString(msgame.playerboard)).then(msg => {
        msgame.boardmsg = msg;
        msgame.tchannel = message.channel;
    }).catch(console.error);
    function getxy(args) {
        if (!args) return null;
        if (args.length < 2) return null;
        let chosex = parseInt(args[0]);
        let chosey = parseInt(args[1]);
        if (isNaN(chosex) || isNaN(chosey)) return null;
        return { x: chosex, y: chosey };
    }
}
cmdModule.addCmd(minesweepercmd);

let minesweeperdig = new command(['minesweeperdig','dig']);
minesweeperdig.usage = [
    `[x] [y]** Mine the block at (x,y)`,
];
minesweeperdig.process = function (message, args) {
    if (!msgames[message.channel.id]) return util.replyWithTimedDelete(message, "No current minesweeper game.");
    let msgame = msgames.getOrCreateGame(message.channel.id);
    if (message.channel.id !== msgame.tchannel.id) return;
    let xy = getxyfromargs(args, msgame);
    if (!xy) return util.replyWithTimedDelete(message, "bad arguments");
    msgame.dig(xy.x, xy.y, message);
    setTimeout(() => {
        message.delete().catch(console.error);
    }, 5000);
}
cmdModule.addCmd(minesweeperdig);


let minesweepermark = new command(['minesweepermark', 'mark']);
minesweepermark.usage = [
    `[x][y]** Mark the block at (x,y) as a possible mine`,
];
minesweepermark.process = function (message, args) {
    if (!msgames[message.channel.id]) return util.replyWithTimedDelete(message, "No current minesweeper game.");
    let msgame = msgames.getOrCreateGame(message.channel.id);
    if (message.channel.id !== msgame.tchannel.id) return;
    let xy = getxyfromargs(args, msgame);
    if (!xy) return util.replyWithTimedDelete(message, "bad arguments");
    msgame.mark(xy.x, xy.y, message);
    setTimeout(() => {
        message.delete().catch(console.error);
    }, 5000);
}
cmdModule.addCmd(minesweepermark);

let printboardcmd = new command(['printboard']);
printboardcmd.usage = [
    `** print the board, if the board is getting swamped by messages.`,
];
printboardcmd.process = function (message, args) {
    if (!msgames[message.channel.id]) return util.replyWithTimedDelete(message, "No current minesweeper game.");
    let msgame = msgames.getOrCreateGame(message.channel.id);
    if (message.channel.id !== msgame.tchannel.id) return;
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
    if (!msgames[message.channel.id]) return util.replyWithTimedDelete(message, "No current minesweeper game.");
    let msgame = msgames.getOrCreateGame(message.channel.id);
    if (message.channel.id !== msgame.tchannel.id) return;
    msgame.gameOver(); 
}
cmdModule.addCmd(endminesweepercmd);

function getxyfromargs(args, msgame) {
    if (!args) return null;
    if (args.length < 2) return null;
    let chosex = parseInt(args[0]);
    let chosey = args[1].toLowerCase().charCodeAt(0) - 97;
    if (isNaN(chosex) || chosex >= msgame.xsize || isNaN(chosey) || chosey >= msgame.ysize) return null;
    return { x:chosex, y:chosey };
}