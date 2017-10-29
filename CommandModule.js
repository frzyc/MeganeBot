const discord = require('discord.js');
const Command = require.main.exports.getRequire('command');
/*
CommandModule //all commands belong in a module
//restrictions
    .owneronly: bool //true -> only owner can use this command
    .serverOnly: bool
    .dmOnly: bool
.cmdlist: {} //store all the commands in this module, based on name
.description: string //describe this module
.prototype.getDesc: function()// "" describe the module
.prototype.addCmd: function()// add cmds to the cmdlist. basic check for name collison
.prototype.checkRestriction: function(message)//check if a message is restricted in any manner(see restrictions above)
TODO:
guild disable
*/

/**
 * A module to hold commands. All commands belong in a module.
 */
class CommandModule {
    /**
     * @typedef {Object} CommandModuleOptions
     * @property {name} name
     * @property {id} id can be generated from name, as long as it is unique. This value is not outwardly exposed, but its an unique key to reference the module.
     * @property {Array[Command]} commands
     * @property {boolean} serverOnly this module and all its commands should only be used on a sever, not DM.
     * @property {boolean} dmOnly this module and all its commands should only be used on DM channels.
     * @property {boolean} ownerOnly this module and all its commands should only be used for bot owners.
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
        if (options.serverOnly) this.serverOnly = true;
        if (options.dmOnly) this.dmOnly = true;
        if (options.ownerOnly) this.ownerOnly = true;
    }
    addCommand(command) {
        if (typeof command === 'function') command = new command(this.client);
        if (!(command instanceof Command))  return this.client.emit('warn', `Attempting to add an invalid command object: ${command}; skipping.`);
        if(!command.name || typeof command.name !== 'string') throw new TypeError('Command name must be a string.');
        this.commands.set(command.name, command);
        command.moduleID = this.id;
        if (this.serverOnly) command.serverOnly = true;
        if (this.dmOnly) command.dmOnly = true;
        if (this.ownerOnly) command.ownerOnly = true;
    }
    /* since this looks to be only really used for help command, should be moved there...
    checkRestriction(message) {
        if (this.dmOnly && message.channel.type === 'text') return 'direct message';
        if (this.serverOnly && (message.channel.type === 'dm' || message.channel.type === 'group')) return 'server';
        if (this.ownerOnly && !this.client.isOwner(message.author.id)) return 'botowner only';
        return '';
    }*/
}
module.exports = CommandModule;