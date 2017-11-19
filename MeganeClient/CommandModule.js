const discord = require('discord.js');
const Command = require('./Command');
const CommandAndModule = require('./CommandAndModule');
/**
 * A module to hold commands. All commands belong in a module.
 */
class CommandModule extends CommandAndModule{
    /**
     * @typedef {Object} CommandModuleOptions
     * @property {name} name
     * @property {id} id can be generated from name, as long as it is unique. This value is not outwardly exposed, but its an unique key to reference the module.
     * @property {string} [usage] - A short usage description of the module. U
     * @property {string} [description] - A detailed description of the module
     * @property {Array[Command]} commands
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
        super(client,options);
        this.constructor.CommandModulePreCheck(client, options);
        this.commands = new discord.Collection();
        if (options.commands) for (const command of options.commands) this.addCommand(command);
        this.enabledInGuild = new Map();
    }
    addCommand(command) {
        if (typeof command === 'function') command = new command(this.client);
        if (!(command instanceof Command)) return this.client.emit('warn', `Attempting to add an invalid command object: ${command}; skipping.`);
        if (!command.name || typeof command.name !== 'string') throw new TypeError('Command name must be a string.');
        this.commands.set(command.name, command);
        command.moduleID = this.id;

        //these values are passed down to the command being added only if the command does not declare them first.
        if (this.guildOnly !== undefined && command.guildOnly === undefined)
            command.guildOnly = this.guildOnly;
        if (this.dmOnly !== undefined && command.dmOnly === undefined)
            command.dmOnly = this.dmOnly;
        if (this.ownerOnly !== undefined && command.ownerOnly === undefined)
            command.ownerOnly = this.ownerOnly;
        if (this.defaultDisable !== undefined && command.defaultDisable === undefined)
            command.defaultDisable = this.defaultDisable;
        if (this.clientPermissions && !command.clientPermissions)
            command.clientPermissions = this.clientPermissions;
        if (this.userPermissions && !command.userPermissions)
            command.userPermissions = this.userPermissions;

    }
    addCommands(commands) {
        if (!Array.isArray(commands)) throw new TypeError('Commands must be an Array.');
        for (let command of commands)
            this.addCommand(command);
        return this;
    }

    getUsageEmbededMessageObject(message) {
        //TODO getUsageEmbededMessageObject
        let title = `Module: ${this.name}`;
        let desc = `${this.usage}`;
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
                emoji: '❌',
                execute: (reactionMessage, user) => {
                    reactionMessage.message.delete();
                }
            }],
        };
        msgobj.messageOptions.embed.fields = [];
        if (this.hasDescription()) {
            msgobj.messageOptions.embed.fields.push({
                name: `Description`,
                value: `${this.description}`
            })
        }
        for (let [key, cmd] of this.commands) {
            msgobj.messageOptions.embed.fields.push({
                name: `Command: ${cmd.name}${cmd.aliases && cmd.aliases.length > 0 ? ", " + cmd.aliases.join(", ") : ""}`,
                value: `Usage: ${cmd.usage}`
            })
        }
        return msgobj;
    }

    static CommandModulePreCheck(client, options) {
        if (options.commands && !Array.isArray(options.commands)) throw new TypeError('CommandModuleOptions.commands must be an Array of Commands.');
    }
}
module.exports = CommandModule;