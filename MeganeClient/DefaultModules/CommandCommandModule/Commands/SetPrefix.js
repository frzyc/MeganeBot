const Command = require('../../../Command');

module.exports = class SetPrefix extends Command {
    constructor(client) {
        super(client, {
            name: 'set-prefix',
            aliases: ['setprefix'],
            examples: ['set-prefix !', 'setprefix command?'],
            usage: `Change the command prefix for the guild.`,
            description: `Use this command to change the command prefix for the guild. It must contain no whitespacecharacter. If nothing is put in, Then the prefix is removed, and only mentions can be used for commands.`,
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
        if(message.guild){
            message.guild.prefix = args['newprefix'];
            if (message.guild.prefix)
                message.reply(`A new prefix is set for this guild: ${message.guild.prefix}`);
            else
                message.reply(`The prefix for this guild has been removed. You can still use commands by mentioning me!`);
        }else if(message.channel.type === 'dm'){
            //TODO check owner and then change global prefix

        }

    }
}