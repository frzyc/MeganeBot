const discord = require('discord.js');
const util = require('./utility/util');
const CommandArgument = require('./CommandArgument');
const permissions = require('./utility/permissions.json');
const MessageUtil = require('./MessageUtil');
/**
 * This is the base Command class. All commands should extend this class.
*/
module.exports = class Command {
    /**
     * Options that sets the format and property of the a command.
     * @typedef {Object} CommandOptions
     * @property {String} name - The name of the command. Should be unique to avoid conflicts
     * @property {string[]} [aliases] - Alternative names for the command (all must be lowercase and unique)
     * @property {String} id - Will only be used internally
     * @property {CommandArgumentOptions[]} args - Arguments for the command.
     * @property {string} module - The ID of the module the command belongs to (must be lowercase)
     * @property {string} [usage] - A short usage description of the command. Usally following the command argument template 
     * @property {string} [description] - A detailed description of the command
     * @property {string[]} [examples] - Usage examples of the command
     * @property {boolean} [ownerOnly=false] - Whether or not the command should only function for the bot owner
     * @property {boolean} [guildOnly=false] - Whether or not the command should only function in a guild channel
     * @property {boolean} [dmOnly=false] - Whether or not the command should only function in a direct message channel
	 * @property {PermissionResolvable[]} [clientPermissions] - Permissions required by the client to use the command.
	 * @property {PermissionResolvable[]} [userPermissions] - Permissions required by the user to use the command.
	 * @property {ThrottlingOptions} [throttling] - Options for throttling usages of the command.
     * @property {number} numArgs - The number of arguments to parse. The arguments are separated by white space. 
     * The last argument will have the remaining command string, white space and all. 
     * Mutually exclusive to CommandOptions#args
     */

    /**
     * Options that sets the throttling options for a command.
     * @typedef {Object} ThrottlingOptions
     * @property {number} userCooldown - time in second required for a user to reuse this command
     * @property {number} serverCooldown - time in second required for a server to reuse this command
     * @property {number} channelCooldown - time in second required for a channel to reuse this command
     */

    /**
     * @param {MeganeClient} client
     * @param {CommandOptions} options
     */
    constructor(client, options) {
        Object.defineProperty(this, 'client', { value: client });
        if (!options.id) options.id = options.name.toLowerCase();
        this.name = options.name;
        this.id = options.id;
        this.aliases = options.aliases ? options.aliases : [];
        this.moduleID = options.module;
        this.usage = options.usage ? options.usage : null;
        this.description = options.description ? options.description : null;
        this.examples = options.examples ? options.examples : null;
        this.ownerOnly = options.ownerOnly === undefined ? false : options.ownerOnly;
        this.ownerOnly = options.guildOnly === undefined ? false : options.guildOnly;
        this.ownerOnly = options.dmOnly === undefined ? false : options.dmOnly;
        if (options.throttling) {
            this.userCooldown = options.throttling.userCooldown === undefined ? false : options.throttling.userCooldown;
            this.serverCooldown = options.throttling.serverCooldown === undefined ? false : options.throttling.serverCooldown;
            this.channelCooldown = options.throttling.channelCooldown === undefined ? false : options.throttling.channelCooldown;
        }
        this.clientPermissions = options.clientPermissions || null;
        this.userPermissions = options.userPermissions || null;
        if (options.args) {
            this.args = new Array(options.args.length);
            for (let i = 0; i < options.args.length; i++) this.args[i] = new CommandArgument(this.client, options.args[i]);
        }
        this.numArgs = options.numArgs || null;
    }
    /**
     * A template for the execute method of commands
     * @param {Message} message 
     * @param {Object|string|string[]} args Depending on the arguments defined, or numArguments. numArguements === 1 will be a string 
     */
    async execute(message, args) { // eslint-disable-line no-unused-vars, require-await
        throw new Error(`${this.constructor.name} doesn't have a execute() method.`);
    }

    getUsageEmbededMessageObject() {
        //TODO getUsageEmbededMessageObject
        let title = `Usage of **${this.name}${this.aliases.length > 0 ? ", " + this.aliases.join(", ") : ""}**`;
        let desc = `**${this.client.prefix}${this.name} ${this.getTemplateArguments()}** \n${this.usage}`;
        let msgobj = {
            deleteTimeCmdMessage: 5 * 60 * 1000,
            messageOptions: {
                embed: {
                    color: 3447003,
                    title: title,
                    description: desc,
                }

            },
            emojis: [{
                emoji: '❌',
                process: (reactionMessage, user) => {
                    reactionMessage.message.delete();
                    return Promise.resolve();
                }
            }],
        };
        msgobj.messageOptions.embed.fields = [];
        if (this.description) {
            msgobj.messageOptions.embed.fields.push({
                name: `Description`,
                value: `${this.description}`
            })
        }
        if (this.examples) {
            for (let exampleindex = 0; exampleindex < this.examples.length; exampleindex++) {
                msgobj.messageOptions.embed.fields.push({
                    name: `Example${exampleindex + 1}:`,
                    value: `${this.examples[exampleindex]}`
                })
            }
        }
        if (this.args) {
            for (let arg of this.args) {
                msgobj.messageOptions.embed.fields.push({
                    name: `Argument: ${arg.label}`,
                    value: `${arg.type.id}`
                })
            }
        }
        return msgobj;
    }
    /**
     * creates a template for the arguments, based on the args of this command
     */
    getTemplateArguments() {
        if (!this.args) return " [input...]";
        return this.args.map(arg => `[${arg.label}]`).join(" ");
    }
    /**
     * Start the cooldown peroid of the command
     * TODO rewrite entire throttling infastructure.
     * @param {Message} message 
     */
    setCooldown(message) {
        let setCD = (coolDownType, property) => {
            if (this[coolDownType]) {
                let now = new Date();
                let cdlist = coolDownType + 'List';
                if (!this[cdlist]) this[cdlist] = {};
                this[cdlist][property] = now.setSeconds(now.getSeconds() + this[coolDownType]);
                console.log(`setcooldown: ${this.name}[${cdlist}][${property}] = ${this[cdlist][property]}`);
            }
        }
        setCD('userCooldown', message.author.id);
        if (message.guild && message.guild.available)
            setCD('serverCooldown', message.guild.id);
        setCD('channelCooldown', message.channel.id);
    }
    /**
     * Check whether the command is in cooldown period.
     * @param {Message} message 
     * @returns {Object} 
     */
    inCooldown(message) {
        let inCD = (coolDownType, property, msg) => {
            if (!this[coolDownType]) return 0;
            let now = new Date();
            let nowtime = now.getTime();
            let cd = util.getChain(this, `${coolDownType}List.${property}`); //this.coolDownTypeList[property]
            if (cd && cd > nowtime) //if current time has not surpassed cd time, means still in cooldown.
                return cd - nowtime;
            else if (cd && cd <= nowtime)
                delete this[coolDownType + 'List'][property];//delete this
            return 0;
        }
        let ret = {
            userCooldown: inCD('userCooldown', message.author.id),//`This command is time-restricted per user.`
            serverCooldown: message.guild && message.guild.available ? inCD('serverCooldown', message.guild.id) : 0, //`This command is time-restricted per server.`
            channelCooldown: inCD('channelCooldown', message.channel.id)//`This command is time-restricted per channel.`
        }

        return (!ret.userCooldown && !ret.serverCooldown && !ret.channelCooldown) ? null : ret;
    }
    clearCooldown(message) {
        let clrCD = (coolDownType, property, msg) => {
            if (!this[coolDownType]) return;
            if (util.hasChain(this, `${coolDownType}List.${property}`)) //this.coolDownTypeList[property]
                delete this[coolDownType + 'List'][property];//delete this
        }
        clrCD('userCooldown', message.author.id);
        if (message.guild && message.guild.available)
            clrCD('serverCooldown', message.guild.id);
        clrCD('channelCooldown', message.channel.id);
    }
    hasPermissions(message) {
        if (this.userPermissions &&
            message.channel.type === 'text' // && !message.member.permissions.hasPermission(this.userPermissions)
        ) {
            const missing = message.channel.permissionsFor(message.author).missing(this.userPermissions);
            if (missing.length > 0) {
                let msgResponse = new MessageUtil(this.client, { messageContent: `You don't have enough permissions to use ${this.name}. missing:\n${missing.map(p => permissions[p]).join(', and ')}`, deleteTime: 5 * 60 });
                msgResponse.execute();
                return false;
            }
        }
        if (this.clientPermissions &&
            message.channel.type === 'text' //commands are only existant in text channels
        ) { //!message.channel.permissionsFor(this.client.user).has(this.clientPermissions)
            const missing = message.channel.permissionsFor(this.clientPermissions.user).missing(this.userPermissions);
            if (missing.length > 0) {
                let msgResponse = new MessageUtil(this.client, { destination: message, messageContent: `I don't have enough permissions to use this command. missing:\n${missing.map(p => permissions[p]).join(', and ')}`, deleteTime: 5 * 60 });
                msgResponse.execute();
                return false;
            }
        }

    }
    checkRestriction(message) {
        //check Location restriction
        let returnMsg = null;
        if (this.dmOnly && message.channel.type === 'text') returnMsg = 'direct message';
        else if (this.guildOnly && (message.channel.type === 'dm' || message.channel.type === 'group')) returnMsg = 'server';
        else if (this.ownerOnly && !this.client.isOwner(message.author.id)) returnMsg = 'botowner only';
        if (returnMsg) {
            let msgResponse = new MessageUtil(this.client, { destination: message, messageContent: `This command is restricted to ${returnMsg} only.`, deleteTime: 10 });
            msgResponse.execute();
        }
        return false;

        //check permission restriction
        hasPermissions(message);

        //check cooldown restriction
        let inCD = this.inCooldown(message);
        if (inCD) {
            let msg = '';
            //this accounts for multiple cooldowns
            if (inCD.userCooldown) msg += `This command is time- restricted per user.Cooldown: ${inCD.userCooldown / 1000} seconds.\n`
            if (inCD.serverCooldown) msg += `This command is time- restricted per server.Cooldown: ${inCD.serverCooldown / 1000} seconds.\n`
            if (inCD.channelCooldown) msg += `This command is time- restricted per channel.Cooldown: ${inCD.channelCooldown / 1000} seconds.\n`
            let msgResponse = new MessageUtil(this.client, { destination: message, messageContent: msg, deleteTime: 10 });
            msgResponse.execute();
            return msgResponse;
        }

    }
    static preCheck(client, options) {
        if (!client) throw new Error('A client must be specified.');
        if (typeof options !== 'object') throw new TypeError('Command options must be an Object.');
        if (typeof options.name !== 'string') throw new TypeError('Command name must be a string.');
        if (options.name !== options.name.toLowerCase()) throw new Error('Command name must be lowercase.');
        if (options.aliases && (!Array.isArray(options.aliases) || options.aliases.some(ali => typeof ali !== 'string'))) throw new TypeError('Command aliases must be an Array of strings.');
        if (options.aliases && options.aliases.some(ali => ali !== ali.toLowerCase())) throw new Error('Command aliases must be lowercase.');
        if (options.usage && typeof options.usage !== 'string') throw new TypeError('Command usage must be a string.');
        if (options.description && typeof options.description !== 'string') throw new TypeError('Command description must be a string.');
        if (typeof options.module !== 'string') throw new TypeError('Command module must be a string.');
        if (options.module !== options.module.toLowerCase()) throw new Error('Command module must be lowercase.');
        if (options.clientPermissions) {
            if (!Array.isArray(options.clientPermissions))
                throw new TypeError('Command clientPermissions must be an Array of permission key strings.');
            for (const perm of options.clientPermissions)
                if (!permissions[perm]) throw new RangeError(`Invalid command clientPermission: ${perm} `);
        }
        if (options.userPermissions) {
            if (!Array.isArray(options.userPermissions))
                throw new TypeError('Command userPermissions must be an Array of permission key strings.');
            for (const perm of options.userPermissions)
                if (!permissions[perm]) throw new RangeError(`Invalid command userPermission: ${perm} `);
        }
        if (options.throttling) {
            if (typeof options.throttling !== 'object') throw new TypeError('Command throttling must be an Object.');
            if (
                typeof options.throttling.userCooldown !== 'number' || isNaN(options.throttling.userCooldown) ||
                typeof options.throttling.serverCooldown !== 'number' || isNaN(options.throttling.serverCooldown) ||
                typeof options.throttling.channelCooldown !== 'number' || isNaN(options.throttling.channelCooldown)
            ) {
                throw new TypeError('Command throttling duration must be a number.');
            }
            if (
                options.throttling.userCooldown < 1 ||
                options.throttling.serverCooldown < 1 ||
                options.throttling.channelCooldown < 1
            ) throw new RangeError('Command throttling duration must be at least 1.');
        }
        if (options.args && options.numArgs) throw new Error('Command args and numArgs are mutually exclusive.');
        if (options.args && !Array.isArray(options.args)) throw new TypeError('Command args must be an Array.');
        if (options.args) {
            let isEnd = false;
            let hasOptional = false;
            for (let i = 0; i < options.args.length; i++) {
                if (hasInfinite) throw new Error('No other argument may come after an multiple/remaining argument.');
                if (options.args[i].default !== null) hasOptional = true;
                else if (hasOptional) throw new Error('Required arguments may not come after optional arguments.');
                if (this.args[i].multiple || this.args[i].remaining) isEnd = true;
            }
        }
        if (options.numArgs && Number.isInteger(options.numArgs)) throw new TypeError('Command numArgs must be an integer.');
        if (options.numArgs < 0) throw new RangeError('Command numArgs must be a positive integer');
    }
}
