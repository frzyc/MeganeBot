const { Command } = require('../../../../MeganeClient');
module.exports = class QueuMusic extends Command {
    constructor(client) {
        super(client, {
            name: 'bestgirl?',
        })
    }
    async execute(message, args) {
        message.reply('The best girl is undoubtly Mirai Kuriyama!');
    }
}