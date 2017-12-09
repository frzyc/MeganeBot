const permissions = require('./Utility/permissions.json');
/**
 * since Commands and Modules share some commands, I am just going to let them extend the same class.
 */
module.exports = class CommandAndModule {
    constructor(client, options) {
        this.constructor.CommandAndModulePreCheck(client, options);
        Object.defineProperty(this, 'client', { value: client });
        this.name = options.name;
        this.id = options.id;
        this.usageString = options.usage ? options.usage : null;
        this.descriptionString = options.description ? options.description : null;
        this.ownerOnly = options.ownerOnly;
        this.guildOnly = options.guildOnly;
        this.dmOnly = options.dmOnly;
        this.defaultDisable = options.defaultDisable;
        this.clientPermissions = options.clientPermissions || null;
        this.userPermissions = options.userPermissions || null;
    }
    get usage() {
        if (!this.usageString) return "No usage specified.";
        return this.usageString;
    }
    hasUsage() {
        if (this.usageString) return true;
        return false;
    }
    get description() {
        if (!this.descriptionString) return "No description specified.";
        return this.descriptionString;
    }
    hasDescription() {
        if (this.descriptionString) return true;
        return false;
    }
    passContextRestriction(message) {
        //check Location restriction
        let returnMsg = null;
        if (this.dmOnly && message.channel.type === 'text') returnMsg = 'direct message';
        else if (this.guildOnly && (message.channel.type === 'dm' || message.channel.type === 'group')) returnMsg = 'server';
        else if (this.ownerOnly && !this.client.isOwner(message.author.id)) returnMsg = 'botowner';
        if (returnMsg) {
            this.client.autoMessageFactory({ destination: message, messageContent: `This is restricted to ${returnMsg} only.`, deleteTime: 10 });
            return false;
        }
        return true;
    }
    passPermissions(message, reply = false) {
        if (this.userPermissions &&
            message.channel.type === 'text' // && !message.member.permissions.hasPermission(this.userPermissions)
        ) {
            const missing = message.channel.permissionsFor(message.author).missing(this.userPermissions);
            if (missing.length > 0) {
                if (reply)
                    this.client.autoMessageFactory({
                        destination: message,
                        messageContent: `You don't have enough permissions to use ${this.name}. missing:\n${missing.map(p => permissions[p]).join(', and ')}`,
                        deleteTime: 5 * 60
                    });
                return false;
            }
        }
        if (this.clientPermissions &&
            message.channel.type === 'text' //commands are only existant in text channels
        ) { //!message.channel.permissionsFor(this.client.user).has(this.clientPermissions)
            const missing = message.channel.permissionsFor(this.client.user).missing(this.userPermissions);
            if (missing.length > 0) {
                if (reply)
                    this.client.autoMessageFactory({
                        destination: message,
                        messageContent: `I don't have enough permissions to use this command. missing:\n${missing.map(p => permissions[p]).join(', and ')}`,
                        deleteTime: 5 * 60
                    });
                return false;
            }
        }
        return true;
    }
    static CommandAndModulePreCheck(client, options) {
        let optionName = "Command/ModuleOptions";
        if (!client) throw new Error('A client must be specified.');
        if (typeof options !== 'object') throw new TypeError(`${optionName} must be an object.`);
        if (typeof options !== 'object') throw new TypeError(`${optionName}.options must be an Object.`);
        if (typeof options.name !== 'string') throw new TypeError(`${optionName}.name must be a string.`);
        if (options.id && typeof options.id !== 'string') throw new TypeError(`${optionName}.id must be a string.`);
        if (!options.id) options.id = options.name.replace(/\s+/g, '').toLowerCase();
        if (options.usage && typeof options.usage !== 'string') throw new TypeError(`${optionName}.usage must be a string.`);
        if (options.description && typeof options.description !== 'string') throw new TypeError(`${optionName}.description must be a string.`);
        if (options.clientPermissions) {
            if (!Array.isArray(options.clientPermissions))
                throw new TypeError(`${optionName}.clientPermissions must be an Array of permission key strings.`);
            for (const perm of options.clientPermissions)
                if (!permissions[perm]) throw new RangeError(`${optionName}.clientPermission has an invalid entry: ${perm} `);
        }
        if (options.userPermissions) {
            if (!Array.isArray(options.userPermissions))
                throw new TypeError(`${optionName}.userPermissions must be an Array of permission key strings.`);
            for (const perm of options.userPermissions)
                if (!permissions[perm]) throw new RangeError(`${optionName}.userPermission has an invalid entry: ${perm} `);
        }
        if (typeof options.guildOnly !== 'undefined' && typeof options.guildOnly !== 'boolean')
            throw new TypeError(`${optionName}.guildOnly must be a boolean.`);
        if (typeof options.dmOnly !== 'undefined' && typeof options.dmOnly !== 'boolean')
            throw new TypeError(`${optionName}.dmOnly must be a boolean.`);
        if (typeof options.ownerOnly !== 'undefined' && typeof options.ownerOnly !== 'boolean')
            throw new TypeError(`${optionName}.ownerOnly must be a boolean.`);
        if (typeof options.defaultDisable !== 'undefined' && typeof options.defaultDisable !== 'boolean')
            throw new TypeError(`${optionName}.defaultDisable must be a boolean.`);
        if (options.guildOnly && options.dmOnly) throw new Error(`${optionName} guildOnly and dmOnly are mutually exclusive.`);
    }
}