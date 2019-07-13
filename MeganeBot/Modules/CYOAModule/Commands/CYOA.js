const { Command } = require("@frzyc/meganeclient")
module.exports = class CYOA extends Command {
  constructor(client) {
    super(client, {
      name: "Choose your own adventure",
      commands: "CYOA",
    })
  }
  async execute(message) {
    return this.module.library.getMessageResolvable(message)
  }
}
