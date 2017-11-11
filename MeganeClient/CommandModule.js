const discord = require('discord.js');
const Command = require('./Command');
/**
 * A module to hold commands. All commands belong in a module.
 */
class CommandModule {
    /**
     * @typedef {Object} CommandModuleOptions
     * @property {name} name
     * @property {id} id can be generated from name, as long as it is unique. This value is not outwardly exposed, but its an unique key to reference the module.
     * @property {string} [description] - A description of the module
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
        this.constructor.preCheck(client, options);
        Object.defineProperty(this, 'client', { value: client });
        this.id = options.id;
        this.name = options.name;
        this.description = options.description;
        this.commands = new discord.Collection();
        if (options.commands) for (const command of options.commands) this.addCommand(command);
        this.description = options.description ? options.description : null;
        this.ownerOnly = options.ownerOnly;
        this.ownerOnly = options.guildOnly;
        this.ownerOnly = options.dmOnly;
        this.defaultDisable = options.defaultDisable;
        this.clientPermissions = options.clientPermissions || null;
        this.userPermissions = options.userPermissions || null;
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
    /* TODO since this looks to be only really used for help command, should be moved there...
    checkRestriction(message) {
        if (this.dmOnly && message.channel.type === 'text') return 'direct message';
        if (this.guildOnly && (message.channel.type === 'dm' || message.channel.type === 'group')) return 'server';
        if (this.ownerOnly && !this.client.isOwner(message.author.id)) return 'botowner only';
        return '';
    }*/
    static preCheck(client, options) {
        if (!client) throw new Error('A client must be specified.');
        if (typeof options !== 'object') throw new TypeError('CommandModuleOptions must be an object.');
        if (typeof options !== 'object') throw new TypeError('CommandModuleOptions.options must be an Object.');
        if (typeof options.name !== 'string') throw new TypeError('CommandModuleOptions.name must be a string.');
        if (!options.name || typeof options.name !== 'string') throw new TypeError('CommandModuleOptions.name must be a string.');

        //if (options.name !== options.name.toLowerCase()) throw new Error('CommandModuleOptions.name must be lowercase.');
        if (options.id && typeof options.id !== 'string') throw new TypeError('CommandModuleOptions.id must be a string.');
        if (!options.id) options.id = options.name.toLowerCase();
        if (options.commands && !Array.isArray(options.commands)) throw new TypeError('CommandModuleOptions.commands must be an Array of Commands.');
        if (options.description && typeof options.description !== 'string') throw new TypeError('CommandModuleOptions.description must be a string.');
        if (options.clientPermissions) {
            if (!Array.isArray(options.clientPermissions))
                throw new TypeError('CommandModuleOptions.clientPermissions must be an Array of permission key strings.');
            for (const perm of options.clientPermissions)
                if (!permissions[perm]) throw new RangeError(`CommandModuleOptions.clientPermission has an invalid entry: ${perm} `);
        }
        if (options.userPermissions) {
            if (!Array.isArray(options.userPermissions))
                throw new TypeError('CommandModuleOptions.userPermissions must be an Array of permission key strings.');
            for (const perm of options.userPermissions)
                if (!permissions[perm]) throw new RangeError(`CommandModuleOptions.userPermission has an invalid entry: ${perm} `);
        }
        if (typeof options.guildOnly !== 'undefined' && typeof options.guildOnly !== 'boolean')
            throw new TypeError('CommandOptions.guildOnly must be a boolean.');
        if (typeof options.dmOnly !== 'undefined' && typeof options.dmOnly !== 'boolean')
            throw new TypeError('CommandOptions.dmOnly must be a boolean.');
        if (typeof options.ownerOnly !== 'undefined' && typeof options.ownerOnly !== 'boolean')
            throw new TypeError('CommandOptions.ownerOnly must be a boolean.');
        if (typeof options.defaultDisable !== 'undefined' && typeof options.defaultDisable !== 'boolean')
            throw new TypeError('CommandOptions.defaultDisable must be a boolean.');
        if (options.guildOnly && options.dmOnly) throw new Error('CommandModuleOptions guildOnly and dmOnly are mutually exclusive.');
    }
}
module.exports = CommandModule;