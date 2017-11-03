const discord = require('discord.js');
const Command = require.main.exports.getRequire('command');
/**
 * A module to hold commands. All commands belong in a module.
 */
class CommandModule {
    /**
     * @typedef {Object} CommandModuleOptions
     * @property {name} name
     * @property {id} id can be generated from name, as long as it is unique. This value is not outwardly exposed, but its an unique key to reference the module.
     * @property {Array[Command]} commands
     * @property {boolean} [ownerOnly=false] - This module and all its commands should only be used for bot owners.
     * @property {boolean} [guildOnly=false] - This module and all its commands should only be used on a sever, not DM.
     * @property {boolean} [dmOnly=false] - This module and all its commands should only be used on DM channels.
     */

    /**
     * @param {MeganeClient} client
     * @param {CommandModuleOptions} options
     */
    constructor(client, options) {
        Object.defineProperty(this, 'client', { value: client });
        if (!options.name || typeof options.name !== 'string') throw new TypeError('Module name must be a string.');
        if (options.commands && !Array.isArray(options.commands)) throw new TypeError('Module commands must be an Array of Commands.');
        if (!options.id) options.id = options.name.toLowerCase();
        this.id = options.id;
        this.name = options.name;
        this.commands = new discord.Collection();
        if (options.commands) for (const command of options.commands) this.addCommand(command);
        this.description = options.description ? options.description : null;
        this.ownerOnly = options.ownerOnly === undefined ? false : options.ownerOnly;
        this.ownerOnly = options.guildOnly === undefined ? false : options.guildOnly;
        this.ownerOnly = options.dmOnly === undefined ? false : options.dmOnly;
    }
    addCommand(command) {
        if (typeof command === 'function') command = new command(this.client);
        if (!(command instanceof Command)) return this.client.emit('warn', `Attempting to add an invalid command object: ${command}; skipping.`);
        if (!command.name || typeof command.name !== 'string') throw new TypeError('Command name must be a string.');
        this.commands.set(command.name, command);
        command.moduleID = this.id;
        command.guildOnly = this.guildOnly;
        command.dmOnly = this.dmOnly;
        command.ownerOnly = this.ownerOnly;
    }
    addCommands(commands) {
        if (!Array.isArray(commands)) throw new TypeError('Commands must be an Array.');
        for (let command of commands)
            this.addCommand(command);
        return this;
    }
    /* since this looks to be only really used for help command, should be moved there...
    checkRestriction(message) {
        if (this.dmOnly && message.channel.type === 'text') return 'direct message';
        if (this.guildOnly && (message.channel.type === 'dm' || message.channel.type === 'group')) return 'server';
        if (this.ownerOnly && !this.client.isOwner(message.author.id)) return 'botowner only';
        return '';
    }*/
}
module.exports = CommandModule;