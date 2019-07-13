const { Command, Util } = require("@frzyc/meganeclient")
module.exports = class Emojify extends Command {
  constructor(client) {
    super(client, {
      name: "Emojify",
      commands: "emojify",
      examples: ["emojify Hello!"],
      usage: "I will convert whatever you say to emojis",
      args: [{
        label: "string",
        type: "string",
        description: "The thing for me to convert."
      }]
    })
  }
  async execute(message, args) {
    return args["string"].toUpperCase().split("").map(char => {
      if (/\d/.test(char)) return Util.getDigitSymbol(char)
      if (/[A-Z]/.test(char)) return Util.getLetterSymbol(char)
      return Util.otherCharSymbol(char)
    }).join(" ")
  }
}
