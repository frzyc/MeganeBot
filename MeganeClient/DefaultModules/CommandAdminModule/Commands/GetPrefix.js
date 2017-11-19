const Command = require('../../../Command');

module.exports = class GetPrefix extends Command {
    constructor(client) {
        super(client, {
            name: 'get-prefix',
            aliases: ['getprefix'],
            examples: ['get-prefix'],
            usage: `get command prefix for the guild/chat you are in`,
            description: `Use this command to get the command prefix for the guild/chat you are in. `
        });

    }
    execute(message, args) {
        if (message.guild) {
            if (message.guild.prefix)
                message.reply(`The command prefix for this guild: ${message.guild.prefix}`);
            else
                message.reply(`This guild has no command prefix. You can still use commands by mentioning me!`);
        } else if (message.channel.type === 'dm') {
            if (this.client.prefix)
                message.reply(`The command prefix is: ${this.client.prefix}`);
            else
                message.reply(`The global command prefix has been removed. You can still use commands by mentioning me!`);
        }

    }
}