const Command = require("../../../Command")
module.exports = class addCommand extends Command {
    constructor(client) {
        super(client, {
            name: "add-numbers",
            aliases: ["add", "add-nums"],
            usage: "Adds numbers together.",
            description: "Gets the sum of numbers, good for testing arguments with multiple parameters",
            examples: ["add-numbers 42 1337"],
            args: [
                {
                    label: "numbers",
                    type: "float",
                    multiple: true
                }
            ]
        })

    }
    execute(message, args) {
        message.reply(`${args.numbers.join(" + ")} = **${args.numbers.reduce((prev, arg) => prev + parseFloat(arg), 0)}**`)
    }
}
