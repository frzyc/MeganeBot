exports.formatTime = function formatTime(seconds) {
    return `${Math.round((seconds - Math.ceil(seconds % 60)) / 60)}:${String('00' + Math.ceil(seconds % 60)).slice(-2)}`;
};


//helper functions
//This function prevents the use of actual mentions within the return line by adding a zero-width character between the @ and the first character of the mention - blocking the mention from happening.
exports.clean = function clean(text) {
    if (typeof (text) === "string")
        return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
    else
        return text;
}

//if i need to do a = item.pro1.pro2.pro3, i dont have to incrementally check each layer's existence
exports.getChain = function (obj, key) {
    return key.split(".").reduce(function (o, x) {
        return (typeof o == "undefined" || o === null) ? o : o[x];
    }, obj);
}

//check the existence of nested object key, see getChain
exports.hasChain = function (obj, key) {
    return key.split(".").every(function (x) {
        if (typeof obj != "object" || obj === null || !x in obj)
            return false;
        obj = obj[x];
        return true;
    });
}

//reply with the message with a reply, then delete the message and the reply after timeout.
exports.replyWithTimedDelete = function (message, msgstr, deletetime) {
    if (!deletetime) deletetime = 10 * 1000;//10 second by default
    message.reply(msgstr).then(re => {
        setTimeout(()=> {
                re.delete().catch(console.error);
                message.delete().catch(console.error);
            }, deletetime);
    });
}

exports.simulateTyping = function (message, time, callback) {
    message.channel.startTyping();
    setTimeout(function () {
        callback();
        message.channel.stopTyping(true);
    }, time);
}
exports.simulateTypingReply = function (message, msg) {
    exports.simulateTyping(message, (msg.length * 30 + 100), function () {
        message.reply(msg);
    });
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
    if (channel.type !== 'text') return;//only work for guild text channel
    if (!messageQueues[channel.id]) messageQueues[channel.id] = new messageQueue(channel);
    messageQueues[channel.id].queue(queuestring);
}