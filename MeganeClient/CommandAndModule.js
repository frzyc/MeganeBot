const permissions = require('./Utility/permissions.json');
/**
 * since {@link Command} and {@link CommandModule} share some commands, I am just going to let them extend the same class.
 */
class CommandAndModule {
    /**
     * 
     * @param {MeganeClient} client 
     * @param {CommandOptions|CommandModuleOptions} options  
     */
    constructor(client, options) {
        this.constructor.CommandAndModulePreCheck(client, options);

        /**
         * A reference to the MeganeClient.
         * @name CommandAndModule#client
         * @type {MeganeClient}
         * @readonly
         */
        Object.defineProperty(this, 'client', { value: client });

        /**
         * The name of the {@link Command}/{@link CommandModule}. Human readable.
         * @type {string}
         */
        this.name = options.name;

        /**
         * Unique id of the {@link Command}/{@link CommandModule}. Used internally.
         * @private
         * @type {string}
         */
        this.id = options.id;

        /**
         * A brief usage description of the {@link Command}/{@link CommandModule}.
         * @type {?string}
         */
        this.usageString = options.usage ? options.usage : null;
        
        /**
         * A detailed usage description of the {@link Command}/{@link CommandModule}.
         * @type {?string}
         */
        this.descriptionString = options.description ? options.description : null;

        /**
         * Whether this {@link Command}/{@link CommandModule} is restricted to bot owners.
         * @type {?boolean}
         */
        this.ownerOnly = options.ownerOnly;

        /**
         * Whether this {@link Command}/{@link CommandModule} is restricted to only guilds.
         * @type {?boolean}
         */
        this.guildOnly = options.guildOnly;

        /**
         * Whether this {@link Command}/{@link CommandModule} is restricted to only DM channels.
         * @type {?boolean}
         */
        this.dmOnly = options.dmOnly;

        /**
         * Whether this {@link Command}/{@link CommandModule} is disabled by default.
         * @todo need to implement and test
         * @type {?boolean}
         */
        this.defaultDisable = options.defaultDisable;

        /**
         * list of required permissions for the bot to use this {@link Command}/{@link CommandModule}.
         * @type {?string[]}
         */
        this.clientPermissions = options.clientPermissions || null;
        
        /**
         * list of required permissions for the user to use this {@link Command}/{@link CommandModule}.
         * @type {?string[]}
         */
        this.userPermissions = options.userPermissions || null;
    }

    /**
     * Get the usage string for this {@link Command}/{@link CommandModule}.
     * @returns {string} - Usage string, else return "No usage specififed"
     */
    get usage() {
        if (!this.usageString) return "No usage specified.";
        return this.usageString;
    }

    /**
     * Get whether the usage string for this {@link Command}/{@link CommandModule} exists.
     * @returns {boolean} 
     */
    hasUsage() {
        if (this.usageString) return true;
        return false;
    }

    /**
     * Get the description for this {@link Command}/{@link CommandModule}.
     * @returns {string} - Description string, else return "No description specififed"
     */
    get description() {
        if (!this.descriptionString) return "No description specified.";
        return this.descriptionString;
    }

    /**
     * Get whether the description for this {@link Command}/{@link CommandModule} exists.
     * @returns {boolean} 
     */
    hasDescription() {
        if (this.descriptionString) return true;
        return false;
    }

    /**
     * Check whether the author/channel passes the restrictions(dmOnly, guildOnly, ownerOnly).
     * see {@link CommandAndModule#dmOnly}, {@link CommandAndModule#guildOnly} and {@link CommandAndModule#ownerOnly}.
     * @param {boolean} - True if it passes without been restriction. False otherwise. 
     */
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

    /**
     * Checks if the user of the message has the permission to perform an operation in the channel of the message.
     * @param {external:Message} message 
     * @param {boolean} [reply=false] 
     */
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

    /**
     * A helper function to validate the options before the class is created.
     * @private
     * @param {MeganeClient} client 
     * @param {CommandOptions|CommandModuleOptions} options 
     */
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
module.exports = CommandAndModule;