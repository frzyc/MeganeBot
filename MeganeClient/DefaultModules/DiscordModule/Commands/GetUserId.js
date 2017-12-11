const Command = require('../../../Command');

module.exports = class GetUserId extends Command {
    constructor(client) {
        super(client, {
            name: 'get-user-id',
            aliases: ['getusrid'],
            examples: ['get-user-id @someone', 'getusrid'],
            usage: `Get member id`,
            description: `Get the id of the member, will default to the sender of the message.`,
            args: [
                {
                    label: 'member',
                    type: 'guildmember',
                    default: 'message-author',
                    description: "The member to get the id from."
                }
            ]
        });

    }
    execute(message, args) {
        let guildmember = args['member'];
        if(!guildmember) guildmember = message.author;
        return `<@${guildmember.id}>'s id:\`\`\`JSON\n${guildmember.id}\`\`\``
    }
}