const Command = require('../../../Command');

module.exports = class SetPrefix extends Command {
    constructor(client) {
        super(client, {
            name: 'set-prefix',
            aliases: ['setprefix'],
            examples: ['set-prefix !', 'setprefix command?'],
            usage: `Change the command prefix for the guild.`,
            description: `Use this command to change the command prefix for the guild. It must contain no whitespacecharacter. If nothing is put in, Then the prefix is removed, and only mentions can be used for commands.`,
            guildOnly: true,
            userPermissions:['ADMINISTRATOR'],
            args: [
                {
                    label:'newprefix',
                    type: 'string',
                    default: "",
                    description: "The new value to set a prefix for the commands in this guild. Can be anything without a whitespacecharacter. "
                }
            ]
        });

    }
    execute(message, args) {
        //TODOBREAKING putting empty doesnt actually empty?
        message.guild.prefix = args['newprefix'];
        if (message.guild.prefix)
            message.reply(`A new prefix is set for this guild: ${message.guild.prefix}`);
        else
            message.reply(`The prefix for this guild has been removed. You can still use commands by mentioning me!`);
    }
}