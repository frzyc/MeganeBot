﻿//my own function to send messages, should be able to queue messages, check length, segment/shorten messages, and do some parsing stuff
exports.createMessage = function (rmsg, message, channel) {
    //console.log(`createMessage:`);
    //console.log(rmsg);
    return new Promise((resolve, reject) => {
        if (!rmsg) return reject(Error('no resolve message obj'));
        if (rmsg.messageContent) {
            //TODO check 2000 character message limit
        }

        if (rmsg.message) {//basically an edit
            if (rmsg.messageContent) {
                rmsg.message.edit(rmsg.messageContent)
                    .then((msg) => {
                        return resolve(msg);
                    })
                    .catch((err) => {
                        console.log("createMessage: fail to edit message.");
                        console.error(err);
                        return reject(err);
                    });
            }
            if ('deleteTime' in rmsg) deletemsg(rmsg.message, message);
        } else if (rmsg.messageContent) {
            if (!message && !channel) return reject(new Error('no message or channel to send to.'));
            let sendCreatedMessage = () => {
                //console.log("sendCreatedMessage");
                return new Promise((resolve, reject) => {
                    let replyOrSend;
                    if (message)
                        replyOrSend = rmsg.reply ? message.reply(rmsg.messageContent, rmsg.messageOptions) : message.channel.sendMessage(rmsg.messageContent, rmsg.messageOptions);
                    else if (channel)
                        replyOrSend = channel.sendMessage(rmsg.messageContent, rmsg.messageOptions);

                    replyOrSend.then((re) => {
                        if (rmsg.then) rmsg.then(re);
                        if ('deleteTime' in rmsg) deletemsg(re, message);
                        //console.log("sendCreatedMessage: sent created message.");
                        return resolve(re);
                    }).catch((err) => {
                        console.log("createMessage: fail to send message.");
                        console.error(err);
                        return reject(err);
                    });
                });
            }

            if (rmsg.typing) {
                let channel = message ? message.channel : channel;
                if (!channel) return reject(new Error('no message or channel to send to.'));
                channel.startTyping();
                setTimeout(() => {
                    channel.stopTyping(true);
                    return sendCreatedMessage().then(resolve, reject);
                }, (rmsg.messageContent.length * 30 + 100))
            } else {
                return sendCreatedMessage().then(resolve, reject);
            }
        } else
            return reject(new Error('Not a resolvable message.'));

        function deletemsg(re, message) {
            if (rmsg.deleteTime === 0) {
                if (re.deletable) re.delete().catch(console.error);
                if (message && message.deletable) message.delete().catch(console.error);
                return;
            }
            setTimeout(() => {
                if (re.deletable) re.delete().catch(console.error);
                if (message && message.deletable && re.id !== message.id) message.delete().catch(console.error);
            }, rmsg.deleteTime);
        }
    });
}


exports.formatTime = function formatTime(seconds) {
    return `${Math.round((seconds - Math.ceil(seconds % 60)) / 60)}:${String('00' + Math.ceil(seconds % 60)).slice(-2)}`;
};




//if i need to do a = item.pro1.pro2.pro3, i dont have to incrementally check each layer's existence
exports.getChain = function (obj, key) {
    return key.split(".").reduce(function (o, x) {
        return (typeof o == "undefined" || o === null) ? o : o[x];
    }, obj);
}

//check the existence of nested object key, see getChain
exports.hasChain = function (obj, key) {
    return key.split(".").every(function (x) {
        if (obj === null || typeof obj == 'undefined' || !(x in obj))
            return false;
        obj = obj[x];
        return true;
    });
}
/*
//reply with the message with a reply, then delete the message and the reply after timeout.
exports.replyWithTimedDelete = function (message, msgstr, deletetime, options) {
    return new Promise((resolve, reject) => {
        if (!deletetime) deletetime = 10 * 1000;//10 second by default, so undefined, null, or zero gets a default value.
        message.reply(msgstr, options).then(re => {
            setTimeout(() => {
                if (re.deletable) re.delete().catch(console.error);
                if (message.deletable) message.delete().catch(console.error);
            }, deletetime);
            resolve();
        }).catch(err => {
            console.err(err);
            reject();
        });
    }); 
}

//reply with the message with a reply, then delete the message and the reply after timeout.
exports.sendMessageWithTimedDelete = function (message, msgstr, deletetime, options) {
    return new Promise((resolve, reject) => {
        if (!deletetime) deletetime = 10 * 1000;//10 second by default
        message.channel.sendMessage(msgstr, options).then(re => {
            setTimeout(() => {
                if (re.deletable) re.delete().catch(console.error);
                if (message.deletable) message.delete().catch(console.error);
            }, deletetime);
            resolve();
        }).catch(err => {
            console.err(err);
            reject();
        });
    });
}*/
//since this gets used so much, im creating a shortcut template for this
exports.redel = function (msg) {
    let smdelobj = exports.smdel(msg)
    smdelobj.reply = true;
    return smdelobj;
    /*
    return {
        messageContent: msg,
        deleteTime: 10 * 1000,
        reply: true
    }*/
}
//since this gets used so much, im creating a shortcut template for this
exports.smdel = function (msg, suc) {
    return {
        messageContent: msg,
        deleteTime: 10 * 1000,
    }
}

exports.requireFile = function (filepath) {
    try {
        require(filepath);
    }
    catch (e) {
        console.log(`requireF(): The file "${filepath}" couldn't be loaded.`);
    }
}

exports.getMentionedUsers = function (message) {
    let userarr = {};
    if (message.mentions.everyone) {
        message.guild.members.map(member => {
            let user = member.user;
            if (!userarr[user.id])
                userarr[user.id] = user;
        })
        console.log(`everyone mention added. size: ${Object.keys(userarr).length}`);
        return userarr;
    }

    //TODO nothing on channels
    if (message.guild && message.guild.available) {
        message.mentions.roles.map((role => {
            role.members.map(member => {
                let user = member.user;
                if (!userarr[user.id])
                    userarr[user.id] = user;
            })
        }));
    }
    console.log(`role mention added. size: ${Object.keys(userarr).length}`);
    message.mentions.users.map((user => {
        if (!userarr[user.id])
            userarr[user.id] = user;
    }));
    console.log(`user mention added. size: ${Object.keys(userarr).length}`);
    
    
    return userarr;
}

// Returns a random number between 0 (inclusive) and 1 (exclusive)
exports.getRandom = function() {
    return Math.random();
}
// Returns a random number between min (inclusive) and max (exclusive)
exports.getRandomArbitrary = function(min, max) {
    return Math.random() * (max - min) + min;
}
// Returns a random integer between min (included) and max (excluded)
// Using Math.round() will give you a non-uniform distribution!
exports.getRandomInt = function(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}
// Returns a random integer between min (included) and max (included)
// Using Math.round() will give you a non-uniform distribution!
exports.getRandomIntInclusive = function(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


exports.percentChance = function (percent) {
    return (Math.random() < (percent/100));
}

exports.getDigitSymbol = function (digit) {
    //let digitarr = [`:zero:`, `:one:`, `:two:`, `:three:`, `:four:`, `:five:`, `:six:`, `:seven:`, `:eight:`, `:nine:`, `:keycap_ten:`];
    let digitarr = [`0⃣`, `1⃣`, `2⃣`, `3⃣`, `4⃣`, `5⃣`, `6⃣`, `7⃣`, `8⃣`, `9⃣`, `🔟`];
    if (digit <= 10)
        return digitarr[digit];
    return ``;
}

exports.getLetterSymbol = function (letter) {
    let letterarr = {
        A: `🇦`,
        B: `🇧`,
        C: `🇨`,
        D: `🇩`,
        E: `🇪`,
        F: `🇫`,
        G: `🇬`,
        H: `🇭`,
        I: `🇮`,
        J: `🇯`,
        K: `🇰`,
        L: `🇱`,
        M: `🇲`,
        N: `🇳`,
        O: `🇴`,
        P: `🇵`,
        Q: `🇶`,
        R: `🇷`,
        S: `🇸`,
        T: `🇹`,
        U: `🇺`,
        V: `🇻`,
        W: `🇼`,
        X: `🇽`,
        Y: `🇾`,
        Z: `🇿`,
    }
    letter = letter.toUpperCase();
    return letterarr[letter] ? letterarr[letter] : ``;
}

var messageQueue = function (channel) {
    this.id = channel.id;
    this.tchannel = channel;
    this.queueQueue = [];
    this.queueTimeOut = null;
}
messageQueue.prototype.queue = function(msg){
    this.queueQueue.push(msg);
    if (this.queueTimeOut) return;//means it already been set
    this.queueTimeOut = setInterval(() => {
        if (this.queueQueue.length === 0) {//queue is empty
            if (this.queueTimeOut) {
                clearTimeout(this.queueTimeOut);
                this.queueTimeOut = null;
            }
            return;
        }
        if (!this.tchannel) return;
        let msgcontent = ``;
        while (true) {
            if (!this.queueQueue[0]) break;
            let guesslength = msgcontent.length + '\n'.length + this.queueQueue[0].length;
            if (guesslength < 2000) {//limit to 2000
                if (msgcontent.length > 0) msgcontent += '\n';
                msgcontent += this.queueQueue.shift();
            } else
                break;
        }
        if (msgcontent.length === 0) return;
        //console.log(`NEW MESSAGE: msgcontent.length(${msgcontent.length})`);
        this.tchannel.sendMessage(msgcontent).then(msg => {}).catch(console.error);
    }, 3000);
}

var messageQueues = {};
exports.queueMessages = function (channel, queuestring) {
    //if (channel.type !== 'text') return;//only work for guild text channel
    if (!messageQueues[channel.id]) messageQueues[channel.id] = new messageQueue(channel);
    messageQueues[channel.id].queue(queuestring);
}

exports.justOnePromise = function(promise,resolveResponse, rejectResponse){
    return new Promise((resolve, reject) => {
        promise.then().then((channel) => {
            return resolve(resolveResponse);
        }).catch((err) => {
            console.error(err);
            return reject(rejectResponse);
        });
    });
}
