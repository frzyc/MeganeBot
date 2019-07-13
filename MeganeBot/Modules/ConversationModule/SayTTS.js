const { Command } = require("@frzyc/meganeclient")
module.exports = class SayTTS extends Command {
  constructor(client) {
    super(client, {
      name: "Say TTS",
      commands:["say-tts","saytts"],
      examples: ["say-tts Speak your mind, human!"],
      usage: "I will TTS what you tell me to say!",
      args: [{
        label: "saying",
        type: "string",
        description: "The thing for me to tts."
      }]
    })
  }
  async execute(message, args) {
    this.client.autoMessageFactory({
      destination: message,
      messageContent: args["saying"],
      messageOptions: { tts: true },
      destinationDeleteTime: 0
    })
  }
}
