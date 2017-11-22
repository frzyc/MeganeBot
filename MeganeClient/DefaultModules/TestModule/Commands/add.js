const Command = require('../../../Command');

module.exports = class addCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'add-numbers',
            aliases: ['add', 'add-nums'],
            usage: 'Adds numbers together.',
            description: `This is an incredibly useful command that finds the sum of numbers. This command is the envy of all other commands.`,
            examples: ['add-numbers 42 1337'],
            args: [
                {
                    label: 'numbers',
                    prompt: 'What numbers would you like to add? Every message you send will be interpreted as a single number.',
                    type: 'float',
                    multiple: true
                }
            ]
        })

    }
    execute(message, args) {
        message.reply(`${args.numbers.join(' + ')} = **${args.numbers.reduce((prev, arg) => prev + parseFloat(arg), 0)}**`);
    }
}