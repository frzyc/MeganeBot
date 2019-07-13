const { Command } = require("@frzyc/meganeclient")
module.exports = class Say extends Command {
  constructor(client) {
    super(client, {
      name: "Say",
      commands: "say",
      examples: ["say Hello!"],
      usage: "I will say what you tell me to say!",
      args: [{
        label: "saying",
        type: "string",
        description: "The thing for me to say."
      }]
    })
  }
  async execute(message, args) {
    this.client.autoMessageFactory({
      destination: message,
      messageContent: args["saying"],
      destinationDeleteTime: 0
    })
  }
}
