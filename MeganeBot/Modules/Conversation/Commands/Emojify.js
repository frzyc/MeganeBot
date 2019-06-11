const { Command, Util } = require("../../../../MeganeClient")
module.exports = class Emojify extends Command {
    constructor(client) {
        super(client, {
            name: "emojify",
            examples: ["emojify Hello!"],
            usage: "I will convert whatever you say to emojis",
            args: [{
                label: "string",
                type: "string",
                remaining: true,
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