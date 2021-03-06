let discord = require('discord.js');
let Util = require('./Utility/Util');
let CommandArgument = require('./CommandArgument');
let CommandAndModule = require('./CommandAndModule');
/**
 * This is the base Command class. All commands should extend this class.
 * @extends CommandAndModule
*/
class Command extends CommandAndModule{
    /**
     * Options that sets the format and property of the a command.
     * @typedef {Object} CommandOptions
     * @property {String} name - The name of the command. Should be unique to avoid conflicts
     * @property {string[]} [aliases] - Alternative names for the command (all must be unique)
     * @property {String} [id] - Will only be used internally.
     * @property {string} [module] - The ID of the module the command belongs to (must be lowercase)
     * @property {string} [usage] - A short usage description of the command. Usally following the command argument template 
     * @property {string} [description] - A detailed description of the command
     * @property {string[]} [examples] - Usage examples of the command
     * @property {CommandRestrictionFunction} [restriction] - Restriction function.
     * @property {CommandArgumentOptions[]} [args] - Arguments for the command.
     * @property {boolean} [ownerOnly=false] - Whether or not the command should only function for the bot owner
     * Will be overridden by the property passed down from module.
     * @property {boolean} [guildOnly=false] - Whether or not the command should only function in a guild channel
     * Will be overridden by the property passed down from module.
     * @property {boolean} [dmOnly=false] - Whether or not the command should only function in a direct message channel
     * Will be overridden by the property passed down from module.
     * @property {boolean} [defaultDisable=false] - Determines whether if this command is disabled by default. 
     * Will be overridden by the property passed down from module.
	 * @property {PermissionResolvable[]} [clientPermissions] - Permissions required by the client to use the command.
     * Will add onto any Permissions passed down from module.
	 * @property {PermissionResolvable[]} [userPermissions] - Permissions required by the user to use the command.
     * Will add onto any Permissions passed down from module. 
	 * @property {ThrottlingOptions} [throttling] - Options for throttling usages of the command.
     * @property {number} [numArgs] - The number of arguments to parse. The arguments are separated by white space. 
     * The last argument will have the remaining command string, white space and all. 
     * Mutually exclusive to CommandOptions#args
     */

    /**
     * @typedef {function} CommandRestrictionFunction
     * @param {CommandMessage} cmdMsg
     * @returns {false|string} - return false if command should not be restricted, and return true, or a string for the reason if it does need to be restricted. 
     * This will be ran after checking command restrictions and parsing the specific command, but before parsing command arguments. 
     */

    /**
     * Options that sets the throttling options for a command.
     * @typedef {Object} ThrottlingOptions
     * @property {number} userCooldown - time in second required for a user to reuse this command
     * @property {number} serverCooldown - time in second required for a server to reuse this command
     * @property {number} channelCooldown - time in second required for a channel to reuse this command
     */

    /**
     * Constructor. Will precheck the options before creating.
     * @param {MeganeClient} client - The client for the command
     * @param {CommandOptions} options - The options for the command
     */
    constructor(client, options) {
        super(client,options);
        this.constructor.CommandPreCheck(client, options);

        /**
         * An array of aliases
         * @type {?string[]}
         */
        this.aliases = options.aliases ? options.aliases : [];
        
        /**
         * The moduleId to associate this {@link Command} with a {@link CommandModule}.
         * @type {string}
         */
        this.moduleID = options.module;

        /**
         * A example for using this {@link Command}
         * @type {?string}
         */
        this.examples = options.examples ? options.examples : null;

        /**
         * A function to restrict this command. Will be executed before {@link Command#execute}.
         * @type {?function}
         */
        this.restriction = options.restriction === undefined ? false : options.restriction;

        /**
         * A map to each guild, to determine whether if this {@link Command} is enabled.
         * @todo implementation and testing, maybe create this in CommandAndModule?
         * @type {Map<string,boolean>}
         */
        this.enabledInGuild = new Map();
        if (options.throttling) {
            /**
             * Seconds before a user can use this {@link Command} again.
             * @type {?number}
             */
            this.userCooldown = options.throttling.userCooldown === undefined ? false : options.throttling.userCooldown;
            /**
             * Seconds before this {@link Command} can be used in a guild.
             * @type {?number}
             */
            this.serverCooldown = options.throttling.serverCooldown === undefined ? false : options.throttling.serverCooldown;
            /**
             * Seconds before this {@link Command} can be used in a channel.
             * @type {?number}
             */
            this.channelCooldown = options.throttling.channelCooldown === undefined ? false : options.throttling.channelCooldown;
        }
        if (options.args) {
            /**
             * Array of {@link CommandArgument}s.
             * @type {?CommandArgument[]}
             */
            this.args = new Array(options.args.length);
            for (let i = 0; i < options.args.length; i++) this.args[i] = new CommandArgument(this.client, options.args[i]);
        }
        /**
         * The number of arguments in this {@link Command}
         * @type {?number}
         */
        this.numArgs = options.numArgs || null;
    }

    /**
     * A template for the execute method of {@link Command}.
     * @param {external:Message} message 
     * @param {Object|string|string[]} args Depending on the arguments defined, or numArguments. numArguements === 1 will be a string 
     * @abstract
     */
    async execute(message, args) { // eslint-disable-line no-unused-vars, require-await
        throw new Error(`${this.constructor.name} doesn't have a execute() method.`);
    }

    /**
     * Generate a usage embed message for this {@link Command}. Mainly used for the help command, or if you use the command incorrectly.
     * @param {external:Message} message - The message that triggered the usage, for getting contextual information like prefix.
     * @returns {MessageFactoryOptions} - The generated message that can be fed right into a MessageFactory.
     */
    getUsageEmbededMessageObject(message) {
        let prefix = message.guild ? message.guild.prefix : this.client.prefix;
        if (!prefix)
            prefix = "<@mentionme> ";
        let title = `Usage of **${this.name}${this.aliases.length > 0 ? ", " + this.aliases.join(", ") : ""}**`;
        let desc = `**${prefix}${this.name} ${this.getTemplateArguments()}**\n${this.usage}`;
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
        if (this.examples) {
            for (let exampleindex = 0; exampleindex < this.examples.length; exampleindex++) {
                msgobj.messageOptions.embed.fields.push({
                    name: `Example ${exampleindex + 1}:`,
                    value: `${prefix}${this.examples[exampleindex]}`
                })
            }
        }
        if (this.args) {
            for (let arg of this.args) {
                msgobj.messageOptions.embed.fields.push({
                    name: `Argument: ${arg.label}`,//TODO put a description for default, multiple, remaining -> `Optional Argument:` ...
                    value: `Type: **${arg.type.id}**\nDescription:\n${arg.description}`
                })
            }
        }
        return msgobj;
    }

    /**
     * creates a template string for the arguments, based on the args of this command
     * @returns {string} - Template string.
     */
    getTemplateArguments() {
        if (!this.args) return "";
        return this.args.map(arg => typeof arg.default === 'undefined' ? `[${arg.label}]` : `<${arg.label}>`).join(" ");
    }

    /**
     * Start the cooldown peroid of this {@link Command}.
     * @todo rewrite entire throttling infastructure.
     * @param {external:Message} message 
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
     * Check whether this {@link Command} is in cooldown period.
     * @param {external:Message} message 
     * @returns {Object} 
     */
    inCooldown(message) {
        let inCD = (coolDownType, property, msg) => {
            if (!this[coolDownType]) return 0;
            let now = new Date();
            let nowtime = now.getTime();
            let cd = Util.getChain(this, `${coolDownType}List.${property}`); //this.coolDownTypeList[property]
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

    /**
     * Clears the cooldowns of this {@link Command} from the author/channel/guild context provided by the message.
     * @param {external:Message} message - The message to provide the author/channel/guild context.
     */
    clearCooldown(message) {
        let clrCD = (coolDownType, property, msg) => {
            if (!this[coolDownType]) return;
            if (Util.hasChain(this, `${coolDownType}List.${property}`)) //this.coolDownTypeList[property]
                delete this[coolDownType + 'List'][property];//delete this
        }
        clrCD('userCooldown', message.author.id);
        if (message.guild && message.guild.available)
            clrCD('serverCooldown', message.guild.id);
        clrCD('channelCooldown', message.channel.id);
    }
    
    /**
     * Check if this {@link Command} is in cooldown, in the author/channel/guild context provided by the message.
     * @param {external:Message} message - The message to provide the author/channel/guild context.
     * @param {boolean} [reply=false] - Whether to reply to the message if the command is in cooldown.
     * @returns {boolean} - True if no cooldown, False otherwise.
     */
    passCooldown(message, reply = false) {
        //check cooldown restriction
        let inCD = this.inCooldown(message);
        if (inCD) {
            let msg = '';
            //this accounts for multiple cooldowns
            if (inCD.userCooldown) msg += `This command is time- restricted per user.Cooldown: ${inCD.userCooldown / 1000} seconds.\n`
            if (inCD.serverCooldown) msg += `This command is time- restricted per server.Cooldown: ${inCD.serverCooldown / 1000} seconds.\n`
            if (inCD.channelCooldown) msg += `This command is time- restricted per channel.Cooldown: ${inCD.channelCooldown / 1000} seconds.\n`
            if (reply)
                this.client.autoMessageFactory({ destination: message, messageContent: msg, deleteTime: 30 })
            return false;
        }
        return true;
    }

    /**
     * Check if this {@link Command} is enabled in a guild or not.
     * @param {Guild} guild - The guild to check the condition for. 
     * @returns {boolean} - True if is enabled, false if disabled.
     */
    getEnabledInGuild(guild) {
        let guildid = guild.id;
        if (this.enabledInGuild.has(guildid)) {
            return this.enabledInGuild.get(guildid);
        } else if (this.defaultDisable)
            return false;
        return true
    }

    /**
     * Sets whether this {@link Command} is enabled in a guild or not.
     * @param {Guild} guild - The guild to set the conditon for.
     * @param {boolean} enabled - Boolean to set.
     */
    setEnabledInGuild(guild, enabled) {
        let guildid = guild.id;
        let old;
        if (this.enabledInGuild.has(guildid))
            old = this.enabledInGuild.get(guildid);
        if (enabled !== old) {
            this.enabledInGuild.set(guildid, enabled);
            this.client.emit('CommandEnabledChange', guild, this, enabled);
        }
    }
    /**
     * A helper function to validate the options before the class is created.
     * @private
     * @param {MeganeClient} client 
     * @param {CommandOptions} options 
     */
    static CommandPreCheck(client, options) {
        //if (options.name !== options.name.toLowerCase()) throw new Error('CommandOptions.name must be lowercase.');
        if (options.aliases && (!Array.isArray(options.aliases) || options.aliases.some(ali => typeof ali !== 'string'))) throw new TypeError('CommandOptions.aliases must be an Array of strings.');
        if (options.aliases && options.aliases.some(ali => ali !== ali.toLowerCase())) throw new Error('CommandOptions.aliases must be lowercase.');
        if (options.restriction && typeof options.restriction !== 'function') throw new TypeError('CommandOptions.restriction must be a function.');
        if (options.module && typeof options.module !== 'string') throw new TypeError('CommandOptions.module must be a string.');
        if (options.module && options.module !== options.module.toLowerCase()) throw new Error('CommandOptions.module must be lowercase.');
        if (options.throttling) {
            if (typeof options.throttling !== 'object') throw new TypeError('CommandOptions.throttling must be an Object.');
            if (
                typeof options.throttling.userCooldown !== 'number' || isNaN(options.throttling.userCooldown) ||
                typeof options.throttling.serverCooldown !== 'number' || isNaN(options.throttling.serverCooldown) ||
                typeof options.throttling.channelCooldown !== 'number' || isNaN(options.throttling.channelCooldown)
            ) {
                throw new TypeError('CommandOptions.throttling entries duration must be a number.');
            }
            if (
                options.throttling.userCooldown < 1 ||
                options.throttling.serverCooldown < 1 ||
                options.throttling.channelCooldown < 1
            ) throw new RangeError('CommandOptions.throttling duration must be at least 1.');
        }
        if (options.args && options.numArgs) throw new Error('CommandOptions.args and CommandOptions.numArgs are mutually exclusive.');
        if (options.args && !Array.isArray(options.args)) throw new TypeError('CommandOptions.args must be an Array.');
        if (options.args) {
            let isEnd = false;
            let hasOptional = false;
            for (let i = 0; i < options.args.length; i++) {
                if (isEnd) throw new Error('No other argument may come after an multiple/remaining argument.');
                if (options.args[i].default !== null) hasOptional = true;
                else if (hasOptional) throw new Error('Required arguments may not come after optional arguments.');
                if (options.args[i].multiple || options.args[i].remaining) isEnd = true;
            }
        }
        if (options.numArgs && Number.isInteger(options.numArgs)) throw new TypeError('CommandOptions.numArgs must be an integer.');
        if (options.numArgs < 0) throw new RangeError('CommandOptions.numArgs must be a positive integer');
    }
}
module.exports = Command;