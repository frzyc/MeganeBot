const { Command } = require('../../../../MeganeClient');
module.exports = class Say extends Command {
    constructor(client) {
        super(client, {
            name: 'say',
            examples: ['say Hello!'],
            usage: 'I will say what you tell me to say!',
            args: [{
                label: 'saying',
                type: 'string',
                remaining: true,
                description: "The thing for me to say."
            }]
        });
    }
    async execute(message, args) {
        this.client.autoMessageFactory({
            destination: message,
            messageContent: args['saying'],
            destinationDeleteTime: 0
        });
    }
}