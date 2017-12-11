const { Command } = require('../../../../MeganeClient');
module.exports = class SayTTS extends Command {
    constructor(client) {
        super(client, {
            name: 'say-tts',
            aliases:['saytts'],
            examples: ['say-tts Speak your mind, human!'],
            usage: 'I will TTS what you tell me to say!',
            args: [{
                label: 'saying',
                type: 'string',
                remaining: true,
                description: "The thing for me to tts."
            }]
        });
    }
    async execute(message, args) {
        this.client.autoMessageFactory({
            destination: message,
            messageContent: args['saying'],
            messageOptions: { tts: true },
            destinationDeleteTime: 0
        });
    }
}