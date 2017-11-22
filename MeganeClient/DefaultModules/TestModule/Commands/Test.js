const Command = require('../../../Command');

module.exports = class Test extends Command {
    constructor(client) {
        super(client, {
            name: 'test'
        })

    }
    execute(message, args) {
        message.reply('test');
    }
}