const fs = require("fs")
const path = require("path")

/**
 * @namespace Util
 */

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

exports.getMentionStrings = function (message) {
  let str = message.content
  return str.match(/(<@\d+>)|(<@!\d+>)|(<@&\d+>)|(@everyone)/g)
}

exports.getMentionedUsers = function (message) {
  let userarr = {}
  if (message.mentions.everyone) {
    message.guild.members.map(member => {
      let user = member.user
      if (!userarr[user.id])
        userarr[user.id] = user
    })
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

/**
 * Given a percentage chance, generate a boolean.
 * @function Util.percentChance
 * @param {digit} percent 
 */
exports.percentChance = function (percent) {
  return (Math.random() < (percent / 100))
}

/**
 * get the emoji representation of a letter.
 * @function Util.getDigitSymbol
 * @param {digit} letter Between 0-10 inclusive
 */
exports.getDigitSymbol = function (digit) {
  //let digitarr = [`:zero:`, `:one:`, `:two:`, `:three:`, `:four:`, `:five:`, `:six:`, `:seven:`, `:eight:`, `:nine:`, `:keycap_ten:`];
  let digitarr = ["0⃣", "1⃣", "2⃣", "3⃣", "4⃣", "5⃣", "6⃣", "7⃣", "8⃣", "9⃣", "🔟"]
  if (digit <= 10)
    return digitarr[digit]
  return ""
}

/**
 * get the emoji representation of a letter.
 * @function Util.getLetterSymbol
 * @param {String} letter Will take the 1st char if its a long string
 */
exports.getLetterSymbol = function (letter) {
  letter = letter.charAt(0)
  const letterarr = {
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
    while (this.queueQueue[0]) {
      let guesslength = msgcontent.length + "\n".length + this.queueQueue[0].length
      if (guesslength < 2000) {//limit to 2000
        if (msgcontent.length > 0) msgcontent += "\n"
        msgcontent += this.queueQueue.shift()
      } else
        break
    }
    if (msgcontent.length === 0) return
    //console.log(`NEW MESSAGE: msgcontent.length(${msgcontent.length})`);
    this.tchannel.send(msgcontent).then(() => { }).catch(console.error)
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
    promise.then().then(() => {
      return resolve(resolveResponse)
    }).catch((err) => {
      console.error(err)
      return reject(rejectResponse)
    })
  })
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

/**
 * Get all files in a directory, and returns an array of all of them after require() them.
 * @function Util.requireAllInDirectory
 * @param directory The directory to acquire at.
 * @return {object[]} array of all the exported module content from all files in directory
 */
exports.requireAllInDirectory = function (directory) {
  if (!fs.existsSync(directory)) throw new Error(`"${directory}" is not an valid directory.`)
  let files = fs.readdirSync(directory)
  let cmdfile = []
  for (let file of files) {
    if (path.extname(file) != ".js") continue
    cmdfile.push(file)
  }
  return cmdfile.map(file => require(path.join(directory, file)))
}

/**
 * Returns a Promise that resolves in some time
 * @param ms the ms to timeout
 */
exports.sleep = function (ms) {
  return new Promise(res => setTimeout(res, ms))
}