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
                    description:
                        "**<\"list\"|\"\">** List all commands & modules available to you\n" +
                        "**<\"command:\"|\"cmd:\"|\"module:\"|\"mod:\"searchquery>** search specifically for modules/commands\n" +
                        "**<searchquery>** Should resolve to either one or several Commands or Mods...",
                    validate: (value) => {
                        if (value.toLowerCase() === "list") return { value: "list" }
                        let re = /^command:(.+)|^cmd:(.+)|^module:(.+)|^mod:(.+)/gi
                        let match = re.exec(value)
                        if (match) {
                            if (match[1])
                                return { value: { commands: this.client.depot.findCommands(match[1].trim()) } }
                            if (match[2])
                                return { value: { commands: this.client.depot.findCommands(match[2].trim()) } }
                            if (match[3])
                                return { value: { modules: this.client.depot.findModules(match[3].trim()) } }
                            if (match[4])
                                return { value: { modules: this.client.depot.findModules(match[4].trim()) } }
                        }
                        const retobj = {}
                        const cmds = this.client.depot.findCommands(value)
                        const mods = this.client.depot.findModules(value)
                        if (cmds.length || mods.length) {
                            retobj.commands = cmds.length ? cmds : undefined
                            retobj.modules = mods.length ? mods : undefined
                            return { value: retobj }
                        } else
                            return { error: "no command/module resolved." }
                    },
                    parse: (value) => {
                        return value
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
        if (commands && commands.length === 1)
            return commands[0].getUsageEmbededMessageObject(message)
        if (modules && modules.length === 1)
            return modules[0].getUsageEmbededMessageObject(message)

        let usageObj = {
            destination: message,
            destinationDeleteTime: 5 * 60 * 1000,
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
        usageObj
    }
}
