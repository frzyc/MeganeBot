const { Command } = require("../../")
module.exports = class GetBotVersion extends Command {
  constructor(client) {
    super(client, {
      name: "Get bot version",
      commands: ["get-bot-version", "getbotversion"],
      examples: ["get-bot-version"],
      usage: "Get the bot version.",
      description: "Returns the latest git commit message."
    })
  }
  async execute(message) {
    return new Promise(resolve=>{
      let returnMsg = {
        destination: message,
        deleteTime: 5 * 60 * 1000,
        destinationDeleteTime: 5 * 60 * 1000,
      }
      var commit = require("child_process").spawn("git", ["log", "-n", "1"])
      commit.stdout.on("data", data => {
        console.log(`stdout: ${data}`)
        returnMsg.messageContent = `\`\`\`${data}\`\`\``
        resolve(returnMsg)
      })
      commit.stderr.on("data", data => {
        console.log(`stderr: ${data}`)
        returnMsg.messageContent = `\`\`\`${data}\`\`\``
        resolve(returnMsg)
      })
      commit.on("close", code => {
        console.log(`code:${code}`)
        returnMsg.messageContent = `Failed checking git version! code:${code}`
        resolve(returnMsg)
      })
    })
  }
}
