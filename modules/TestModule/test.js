const Command = require.main.exports.getRequire('command');

module.exports = class TestCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'test'
        })

    }
    execute(message, args) {
        return Promise.resolve({
            destination: message,
            messageContent: 'testing',
            deleteTimeCmdMessage: 5 * 1000,
            //emojis: ['🇦', '🇧','🇨']
            messageOptions: {
                embed: {
                    color: 3447003,
                    author: {
                        name: this.client.user.username,
                        icon_url: this.client.user.avatarURL
                    },
                    title: 'This is an embed',
                    url: 'http://google.com',
                    description: 'This is a test embed to showcase what they look like and what they can do.',
                    fields: [
                        {
                            name: 'Fields',
                            value: 'They can have different fields with small headlines.'
                        },
                        {
                            name: 'Masked links',
                            value: 'You can put [masked links](http://google.com) inside of rich embeds.'
                        },
                        {
                            name: 'Markdown',
                            value: 'You can put all the *usual* **__Markdown__** inside of them.'
                        }
                    ],
                    timestamp: new Date(),
                    footer: {
                        icon_url: this.client.user.avatarURL,
                        text: '© Example'
                    }
                }
            },
            reactions: [
                {
                    emoji: '🇦',
                    execute: (messageReaction, user) => {
                        console.log("PROCESSA");
                        return Promise.resolve({ destination: messageReaction.message, messageContent: '🇦' })
                    }
                },
                {
                    emoji: '🇧',
                    execute: (messageReaction, user) => {
                        console.log("PROCESSB");
                        return Promise.resolve({ destination: messageReaction.message, messageContent: '🇧' })
                    }
                },
                {
                    emoji: '🇨',
                    execute: (messageReaction, user) => {
                        console.log("PROCESSC");
                        return Promise.resolve({ destination: messageReaction.message, messageContent: '🇨' })
                    }
                }
            ],
        });
    }
}