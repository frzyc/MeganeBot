const { Command } = require("../../../")
module.exports = class addCommand extends Command {
    constructor(client) {
        super(client, {
            name: "Add numbers",
            commands: ["add-numbers", "add", "add-nums"],
            usage: "Adds numbers together.",
            description: "Gets the sum of numbers, good for testing arguments with multiple parameters",
            examples: ["add-numbers 42 1337"],
            args: [
                {
                    label: "numbers",
                    type: "float",
                    array: 0
                }
            ]
        })

    }
    execute(message, args) {
        message.reply(`${args.numbers.join(" + ")} = **${args.numbers.reduce((prev, arg) => prev + parseFloat(arg), 0)}**`)//TODO is parseFloat needed here?
    }
}
