//a helper function to format strings
if (!String.prototype.format) {
    String.prototype.format = function () {
        var args = arguments
        return this.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] != "undefined" ? args[number] : match
        })
    }
}

exports.formatTime = function formatTime(seconds) {
    return `${Math.round((seconds - Math.ceil(seconds % 60)) / 60)}:${String("00" + Math.ceil(seconds % 60)).slice(-2)}`
}

//if i need to do a = item.pro1.pro2.pro3, i dont have to incrementally check each layer's existence
exports.getChain = function (obj, key) {
    return key.split(".").reduce(function (o, x) {
        return (typeof o == "undefined" || o === null) ? o : o[x]
    }, obj)
}

//check the existence of nested object key, see getChain
exports.hasChain = function (obj, key) {
    return key.split(".").every(function (x) {
        if (obj === null || typeof obj == "undefined" || !(x in obj))
            return false
        obj = obj[x]
        return true
    })
}

exports.requireFile = function (filepath) {
    try {
        require(filepath)
    }
    catch (e) {
        console.log(`requireF(): The file "${filepath}" couldn't be loaded.`)
    }
}
exports.getMentionStrings = function (message) {
    let str = message.content
    return str.match(/(<@\d+>)|(<@!\d+>)|(<@&\d+>)|(@everyone)/g)
}

exports.getMentionedUsers = function (message) {
    //console.log('getMentionedUsers');
    let userarr = {}
    if (message.mentions.everyone) {
        message.guild.members.map(member => {
            let user = member.user
            if (!userarr[user.id])
                userarr[user.id] = user
        })
        //console.log(`everyone mention added. size: ${Object.keys(userarr).length}`);
        return userarr
    }

    //TODO nothing on channels

    if (message.guild && message.guild.available) {
        message.mentions.roles.map((role => {
            role.members.map(member => {
                let user = member.user
                if (!userarr[user.id])
                    userarr[user.id] = user
            })
        }))
    }
    //console.log(`role mention added. size: ${Object.keys(userarr).length}`);
    message.mentions.users.map((user => {
        if (!userarr[user.id])
            userarr[user.id] = user
    }))
    //console.log(`user mention added. size: ${Object.keys(userarr).length}`);


    return userarr
}

// Returns a random number between 0 (inclusive) and 1 (exclusive)
exports.getRandom = function () {
    return Math.random()
}
// Returns a random number between min (inclusive) and max (exclusive)
exports.getRandomArbitrary = function (min, max) {
    return Math.random() * (max - min) + min
}
// Returns a random integer between min (included) and max (excluded)
// Using Math.round() will give you a non-uniform distribution!
exports.getRandomInt = function (min, max) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min)) + min
}
// Returns a random integer between min (included) and max (included)
// Using Math.round() will give you a non-uniform distribution!
exports.getRandomIntInclusive = function (min, max) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min + 1)) + min
}


exports.percentChance = function (percent) {
    return (Math.random() < (percent / 100))
}

exports.getDigitSymbol = function (digit) {
    //let digitarr = [`:zero:`, `:one:`, `:two:`, `:three:`, `:four:`, `:five:`, `:six:`, `:seven:`, `:eight:`, `:nine:`, `:keycap_ten:`];
    let digitarr = ["0⃣", "1⃣", "2⃣", "3⃣", "4⃣", "5⃣", "6⃣", "7⃣", "8⃣", "9⃣", "🔟"]
    if (digit <= 10)
        return digitarr[digit]
    return ""
}

exports.getLetterSymbol = function (letter) {
    let letterarr = {
        A: "🇦",
        B: "🇧",
        C: "🇨",
        D: "🇩",
        E: "🇪",
        F: "🇫",
        G: "🇬",
        H: "🇭",
        I: "🇮",
        J: "🇯",
        K: "🇰",
        L: "🇱",
        M: "🇲",
        N: "🇳",
        O: "🇴",
        P: "🇵",
        Q: "🇶",
        R: "🇷",
        S: "🇸",
        T: "🇹",
        U: "🇺",
        V: "🇻",
        W: "🇼",
        X: "🇽",
        Y: "🇾",
        Z: "🇿",
    }
    letter = letter.toUpperCase()
    return letterarr[letter] ? letterarr[letter] : ""
}
exports.otherCharSymbol = function (char) {
    let symarr = {}
    symarr["!"] = "❕"
    symarr["?"] = "❔"
    symarr["#"] = ":hash:"
    symarr["*"] = ":asterisk:"
    return symarr[char] ? symarr[char] : char
}
var messageQueue = function (channel) {
    this.id = channel.id
    this.tchannel = channel
    this.queueQueue = []
    this.queueTimeOut = null
}
messageQueue.prototype.queue = function (msg) {
    this.queueQueue.push(msg)
    if (this.queueTimeOut) return//means it already been set
    this.queueTimeOut = setInterval(() => {
        if (this.queueQueue.length === 0) {//queue is empty
            if (this.queueTimeOut) {
                clearTimeout(this.queueTimeOut)
                this.queueTimeOut = null
            }
            return
        }
        if (!this.tchannel) return
        let msgcontent = ""
        while (true) {
            if (!this.queueQueue[0]) break
            let guesslength = msgcontent.length + "\n".length + this.queueQueue[0].length
            if (guesslength < 2000) {//limit to 2000
                if (msgcontent.length > 0) msgcontent += "\n"
                msgcontent += this.queueQueue.shift()
            } else
                break
        }
        if (msgcontent.length === 0) return
        //console.log(`NEW MESSAGE: msgcontent.length(${msgcontent.length})`);
        this.tchannel.send(msgcontent).then(msg => { }).catch(console.error)
    }, 3000)
}

var messageQueues = {}
exports.queueMessages = function (channel, queuestring) {
    //if (channel.type !== 'text') return;//only work for guild text channel
    if (!messageQueues[channel.id]) messageQueues[channel.id] = new messageQueue(channel)
    messageQueues[channel.id].queue(queuestring)
}

exports.justOnePromise = function (promise, resolveResponse, rejectResponse) {
    return new Promise((resolve, reject) => {
        promise.then().then((channel) => {
            return resolve(resolveResponse)
        }).catch((err) => {
            console.error(err)
            return reject(rejectResponse)
        })
    })
}
/**
 * @deprecated Deprecated by the type parsing of the new system.
 */
exports.staticArgTypes = {
    "none": {
        type: "none",//special process for none
        process: (arg) => {
            if (arg == null || arg.length === 0) return ""
            else return null
        }
    },
    "string": {
        type: "string",//special process for string
    },
    "oristring": {
        type: "oristring",//special process for string
        process: (arg, message) => {
            if (arg == null || arg.length === 0) return null
            let cont = message.content
            let index = cont.indexOf(arg)
            if (index >= 0)
                return cont.slice(index)
            return null
        }
    },
    "word": {//a word, can be literally anything in it
        type: "word",
        process: (arg) => {
            if (arg == null) return null
            //console.log(`process:word(${arg})`);
            if (arg.length === 0)
                return null
            return arg
        }
    },
    "int": {
        type: "int",
        process: (arg) => {
            if (arg == null) return null
            //console.log(`process:int(${arg})`);
            if (!/^[-+]?[0-9]+$/.test(arg)) return null
            let ret = parseInt(arg)
            if (isFinite(ret))
                return ret
            else
                return null
        }
    },
    "posint": {
        type: "posint",
        process: (arg) => {
            if (arg == null) return null
            //console.log(`process:int(${arg})`);
            if (!/^[0-9]+$/.test(arg)) return null
            let ret = parseInt(arg)
            if (isFinite(ret))
                return ret
            else
                return null
        }
    },
    "float": {
        type: "float",
        process: (arg) => {
            if (arg == null) return null
            //console.log(`process:float(${arg})`);
            //strict parsing
            //  /^([-+]?(\d+\.?\d*|\d*\.?\d+))$/
            if (!/^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$/.test(arg)) return null
            let ret = parseFloat(arg)
            if (isFinite(ret)) return ret
            else
                return null
        }
    },
    "mentions": {
        type: "mentions",
        process: (arg, message) => {
            let mentionedusers = exports.getMentionedUsers(message)
            let mentioneduserscount = Object.keys(mentionedusers).length
            if (mentioneduserscount === 0) return null
            return mentionedusers
        }
    }
}
let customType = function (evalfunc, statictype) {
    this.type = "custom"
    this.evalfunc = evalfunc
    //this.base = exports.int;
    if (statictype && "process" in statictype)
        this.baseprocess = statictype.process
}
customType.prototype.process = function (arg, message) {
    //console.log(`process:customType(${arg}:${typeof arg})`);
    if (this.baseprocess) {
        arg = this.baseprocess(arg, message)
    }
    if (arg == null) return null
    return this.evalfunc(arg, message)
}
exports.customType = customType

let customTypeRegex = function (regex, statictype) {
    this.type = "customregex"
    this.reg = regex
    if (statictype && "process" in statictype)
        this.baseprocess = statictype.process
}
customTypeRegex.prototype.process = function (arg, message) {
    //console.log(`process:customTypeRegex(${arg}:${typeof arg})`);
    if (arg == null) return null
    let match = arg.match(this.reg)//TODO this doesnt really work for some reason
    if (match == null) return null
    console.log(match)
    return match.map(m => { this.baseprocess(m, message) })
}
exports.customTypeRegex = customTypeRegex

var reOperatorsToEscape = /[|\\{}()[\]^$+*?.]/g
exports.escapeRegexString = function (str) {
    if (typeof str !== "string") throw new TypeError("Expected a string")
    return str.replace(reOperatorsToEscape, "\\$&")
}
/*
console.log('100% 200%'.match(/(\d{0,3})%/g));
console.log(/(\d{0,3})%/g.exec('100% 200%'));

var myString = '100% 200%';
var myRegexp = /\d{0,3}%/g;
match = myRegexp.exec(myString);
while (match != null) {
    // matched text: match[0]
    // match start: match.index
    // capturing group n: match[n]
    console.log(match[1])
    match = myRegexp.exec(myString);
}

const at = exports.staticArgTypes;
const ct = exports.customType;
const ctr = exports.customTypeRegex;
let testtem = [at['word'], at['int'], at['float'], new ct((v) => {
    if (v >= 0 && v < 10) return v;
    else return null;
}, at['int']), new ctr(/^([0 - 9]{0,3})%$/g, at['posint']), at['none']
];
let teststring = `test 12345 -.12e-19 9 100%`;
console.log("TEST PARSE");
console.log(exports.parseArgs(testtem, teststring.split(' ')));
*/