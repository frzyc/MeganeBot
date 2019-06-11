const fs = require("fs")
const path = require("path")
const discord = require("discord.js")
const Command = require("./Command")
const CommandAndModule = require("./CommandAndModule")
/**
 * A module to hold commands. All commands belong in a module.
 * @class
 */
class CommandModule extends CommandAndModule {
    /**
     * @typedef {Object} CommandModuleOptions
     * @property {name} name - An outward-exposed name for the module.
     * @property {id} id  - This value is not outwardly exposed, but its an unique key to reference the module. Will be generated from CommandModuleOptions#name if not specified
     * @property {string} [usage] - A short usage description of the module. U
     * @property {string} [description] - A detailed description of the module
     * @property {Command[]} commands - A array of commands.
     * @property {boolean} [ownerOnly=false] - This module and all its commands should only be used for bot owners.
     * @property {boolean} [guildOnly=false] - This module and all its commands should only be used on a sever, not DM.
     * @property {boolean} [dmOnly=false] - This module and all its commands should only be used on DM channels.
     * @property {boolean } [defaultDisable=false] - Determines whether if this module is disabled by default.
     * @property {PermissionResolvable[]} [clientPermissions] - Permissions required by the client to use the commands in this module.
	 * @property {PermissionResolvable[]} [userPermissions] - Permissions required by the user to use the command in this module.
     */

    /**
     * @param {MeganeClient} client
     * @param {CommandModuleOptions} options
     */
    constructor(client, options) {
        super(client, options)
        this.constructor.CommandModulePreCheck(client, options)

        /**
         * A collection of commands
         * @type {external:Collection<string, Command>}
         */
        this.commands = new discord.Collection()
        if (options.commands) for (const command of options.commands) this.addCommand(command)

        /**
         * @todo a map to determine if this module is disabled in a guild. Should be saved to the database as well.
         * @type {Map<string, boolean>}
         */
        this.enabledInGuild = new Map()
    }

    /**
     * Adds a command to this module. This command will inherent some of the properties of this module.
     * @param {Command} command - Command to add
     * @returns {CommandModule} - This CommandModule so methods can be chained.
     */
    addCommand(command) {
        if (typeof command === "function") command = new command(this.client)
        if (!(command instanceof Command)) return this.client.emit("warn", `Attempting to add an invalid command object: ${command}; skipping.`)
        if (!command.name || typeof command.name !== "string") throw new TypeError("Command name must be a string.")
        this.commands.set(command.name, command)
        command.moduleID = this.id

        //these values are passed down to the command.
        if (command.guildOnly !== undefined && this.guildOnly !== undefined && command.guildOnly !== this.guildOnly)
            this.client.emit("warn", `Module ${this.name}'s guildOnly will override the command ${command.name}'s guildOnly.`)
        if (command.dmOnly !== undefined && this.dmOnly !== undefined && command.dmOnly !== this.dmOnly)
            this.client.emit("warn", `Module ${this.name}'s dmOnly will override the command ${command.name}'s dmOnly.`)
        if (command.ownerOnly !== undefined && this.ownerOnly !== undefined && command.ownerOnly !== this.ownerOnly)
            this.client.emit("warn", `Module ${this.name}'s ownerOnly will override the command ${command.name}'s ownerOnly.`)
        if (command.defaultDisable !== undefined && this.defaultDisable !== undefined && command.defaultDisable !== this.defaultDisable)
            this.client.emit("warn", `Module ${this.name}'s defaultDisable will override the command ${command.name}'s defaultDisable.`)
        if (this.clientPermissions)
            command.clientPermissions = command.clientPermissions ? Array.from(new Set(command.clientPermissions.concat(this.clientPermissions))) : this.clientPermissions
        if (this.userPermissions)
            command.userPermissions = command.userPermissions ? Array.from(new Set(command.userPermissions.concat(this.userPermissions))) : this.userPermissions

        command.guildOnly = this.guildOnly
        command.dmOnly = this.dmOnly
        command.ownerOnly = this.ownerOnly
        command.defaultDisable = this.defaultDisable
        return this
    }

    /**
     * Adds a array of commands into this module.
     * @param {Command[]} commands - Array of commands
     * @returns {CommandModule} - This CommandModule so methods can be chained.
     */
    addCommands(commands) {
        if (!Array.isArray(commands)) throw new TypeError("Commands must be an Array.")
        for (let command of commands)
            this.addCommand(command)
        return this
    }

    /**
     * Adds all files in an directory as commands into this module.
     * @param {string} directory - directory of commands
     * @returns {CommandModule} - This CommandModule so methods can be chained.
     */
    addCommandsIn(directory) {
        if (!fs.existsSync(directory)) throw new Error(`"${directory}" is not an valid directory.`)
        let files = fs.readdirSync(directory)
        let cmdfile = []
        for (let file of files) {
            if (path.extname(file) != ".js") continue
            cmdfile.push(file)
        }
        this.addCommands(cmdfile.map(file => require(path.join(directory, file))))
        return this
    }

    /**
     * Generate a usage embed message for this module. Mainly used for the help command.
     * @returns {MessageResolvable} - The generated message that can be fed right into a MessageFactory.
     */
    getUsageEmbededMessageObject() {
        //TODO getUsageEmbededMessageObject
        let title = `Module: ${this.name}`
        let desc = `${this.usage}`
        let msgobj = {
            deleteTimeCmdMessage: 5 * 60 * 1000,
            messageOptions: {
                embed: {
                    color: 3447003,
                    title: title,
                    description: desc,
                }
            },
            reactions: [{
                emoji: "❌",
                execute: (reactionMessage) => {
                    reactionMessage.message.delete()
                }
            }],
        }
        msgobj.messageOptions.embed.fields = []
        if (this.hasDescription()) {
            msgobj.messageOptions.embed.fields.push({
                name: "Description",
                value: `${this.description}`
            })
        }
        for (let [key, cmd] of this.commands) {
            msgobj.messageOptions.embed.fields.push({
                name: `Command: ${cmd.name}${cmd.aliases && cmd.aliases.length > 0 ? ", " + cmd.aliases.join(", ") : ""}`,
                value: `Usage: ${cmd.usage}`
            })
        }
        return msgobj
    }

    /**
     * A helper function to validate the options before the class is created.
     * @private
     * @param {MeganeClient} client
     * @param {CommandModuleOptions} options
     */
    static CommandModulePreCheck(client, options) {
        if (options.commands && !Array.isArray(options.commands)) throw new TypeError("CommandModuleOptions.commands must be an Array of Commands.")
    }
}
module.exports = CommandModule
