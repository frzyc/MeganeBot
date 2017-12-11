const Command = require('../../../Command');

module.exports = class GetUserPermissions extends Command {
    constructor(client) {
        super(client, {
            name: 'get-user-permissions',
            aliases: ['getusrperms'],
            examples: ['get-user-permissions @someone', 'getusrperms <user id>'],
            usage: `Get member permissions`,
            description: `Get the permissions of this guildmember in the context of this channel.`,
            userPermissions: ['MANAGE_ROLES'],
            args: [
                {
                    label: 'member',
                    type: 'guildmember',
                    description: "The member to get the permissions for."
                }
            ]
        });

    }
    execute(message, args) {
        let guildmember = args['member'];
        let perms = message.channel.permissionsFor(guildmember).serialize();
        return `<@${guildmember.id}>'s Permissions:\`\`\`JSON\n${JSON.stringify(perms, null, 2)}\`\`\``
    }
}