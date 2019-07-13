const { Command } = require("../../")

module.exports = class Test extends Command {
  constructor(client) {
    super(client, {
      name: "Test Command",
      commands: "test"
    })

  }
  execute(message) {
    message.reply("test")
  }
}
