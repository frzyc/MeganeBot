const { Command } = require("../../../")

module.exports = class PullAndDeploy extends Command {
    constructor(client) {
        super(client, {
            name: "Pull and Deploy",
            commands: ["pull-and-deploy", "pullanddeploy", "dumbledores-pet"],
            examples: ["pull-and-deploy"],
            usage: "Get the latest updates from git repo, and restarts the bot.",
            description: "Do a git fetch to get the latest update from the git repo, and kill its process. If pm2 or similiar is running, then the bot should restart."
        })

    }
    async execute(message) {
        let updateMsg = await this.client.autoMessageFactory({
            destination: message,
            messageContent: "fetching updates...",
        })
        let spawn = require("child_process").spawn
        var fetch = spawn("git", ["fetch"])
        fetch.stdout.on("data", data => {
            console.log(data.toString())
        })
        fetch.on("close", () => {
            var reset = spawn("git", ["reset", "--hard", "origin/master"])
            reset.stdout.on("data", data => {
                console.log(data.toString())
            })
            reset.on("close", () => {
                let isWin = /^win/.test(process.platform)
                let npmspawn = null
                if (isWin) {
                    npmspawn = spawn("npm.cmd", ["install"])
                } else
                    npmspawn = spawn("npm", ["install"])
                npmspawn.stdout.on("data", data => {
                    console.log(data.toString())
                })
                npmspawn.on("close", async () => {
                    console.log("goodbye")
                    await updateMsg.edit("brb!")
                    await this.client.destructor()
                    process.exit()
                })
            })
        })


    }
}
