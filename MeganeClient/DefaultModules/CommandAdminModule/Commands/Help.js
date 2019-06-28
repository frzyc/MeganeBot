const { Command } = require("../../../")

module.exports = class Help extends Command {
    constructor(client) {
        super(client, {
            name: "Help",
            commands: ["help", "h"],
            examples: ["help list", "help command:example-command"],
            usage: "Print out usage for commands/modules.",
            description: "Use this command to search through all the commands and modules, and get specific usage information on specific commands",
            args: [
                {
                    label: "cmdsOrMods",
                    default: "list",
                    remaining: true,
                    description:
                        "**<\"list\"|\"\">** List all commands & modules available to you\n" +
                        "**<\"command:\"|\"cmd:\"|\"module:\"|\"mod:\"searchquery>** search specifically for modules/commands\n" +
                        "**<searchquery>** Should resolve to either one or several Commands or Mods...",
                    validate: (value) => {
                        if (value.toLowerCase() === "list") return true
                        let re = /^command:(.+)|^cmd:(.+)|^module:(.+)|^mod:(.+)/gi
                        let match = re.exec(value)
                        if (match) {
                            if (match[1])
                                if (this.client.depot.findCommands(match[1].trim()).length > 0) return true
                            if (match[2])
                                if (this.client.depot.findCommands(match[2].trim()).length > 0) return true
                            if (match[3])
                                if (this.client.depot.findModules(match[3].trim()).length > 0) return true
                            if (match[4])
                                if (this.client.depot.findModules(match[4].trim()).length > 0) return true
                        }
                        if (!value) return false
                        if (this.client.depot.findCommands(value).length > 0) return true
                        if (this.client.depot.findModules(value).length > 0) return true
                        return false
                    },
                    parse: (value) => {
                        if (value.toLowerCase() === "list") return "list"
                        let re = /^command:(.+)|^cmd:(.+)|^module:(.+)|^mod:(.+)/gi
                        let match = re.exec(value)
                        if (match) {
                            if (match[1])
                                return { commands: this.client.depot.findCommands(match[1].trim()) }
                            if (match[2])
                                return { commands: this.client.depot.findCommands(match[2].trim()) }
                            if (match[3])
                                return { modules: this.client.depot.findModules(match[3].trim()) }
                            if (match[4])
                                return { modules: this.client.depot.findModules(match[4].trim()) }
                        }
                        let retobj = {}
                        let cmds = this.client.depot.findCommands(value)
                        if (cmds.length)
                            retobj.commands = cmds
                        let mods = this.client.depot.findModules(value)
                        if (mods.length)
                            retobj.modules = mods
                        return retobj
                    }
                }
            ]
        })
    }
    execute(message, args) {
        if (typeof args["cmdsOrMods"] === "string" && args["cmdsOrMods"] === "list")
            args["cmdsOrMods"] = { modules: this.client.depot.findModules() }//since return all, don't need to go through and find commands.
        let commands = args["cmdsOrMods"].commands
        let modules = args["cmdsOrMods"].modules
        if (commands && commands.length === 1) {
            let command = commands[0]
            let usageObj = command.getUsageEmbededMessageObject(message)
            usageObj.destination = message
            this.client.autoMessageFactory(usageObj)
            return
        }
        if (modules && modules.length === 1) {
            let mod = modules[0]
            let usageObj = mod.getUsageEmbededMessageObject(message)
            usageObj.destination = message
            this.client.autoMessageFactory(usageObj)
            return
        }
        //TODO add commands' modules to modules, and then print out the modules along with commands
        let usageObj = {
            destinationDeleteTime: 5 * 60,
            messageOptions: {
                embed: {
                    color: 3447003,
                    title: "List of results",
                    description: `${modules ? modules.length + " Modules" : ""}${commands ? "and " + commands.length + " Commands" : ""} found.`,
                }
            },
            reactions: [{
                emoji: "❌",
                execute: (reactionMessage) => {
                    reactionMessage.message.delete()
                }
            }],
        }
        usageObj.messageOptions.embed.fields = []
        if (modules) {
            for (let mod of modules) {
                usageObj.messageOptions.embed.fields.push({
                    name: `Module: ${mod.name}, ${mod.usage}`,
                    value: `Commands: ${mod.commands.map((cmd) => cmd.name).join(", ")}`
                })
            }
        }
        if (commands) {
            for (let cmd of commands) {
                usageObj.messageOptions.embed.fields.push({
                    name: `Command: ${cmd.name} (${cmd.commands.join(", ")})`,
                    value: `Usage: ${cmd.usage}`
                })
            }
        }
        usageObj.destination = message
        this.client.autoMessageFactory(usageObj)
    }
}
