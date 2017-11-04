const discord = require('discord.js');
const CommandDepot = require('./CommandDepot');
const CommandDispatcher = require('./CommandDispatcher');
/**
 * The Main client for the MeganeClient. This is the client where the MeganeBot starts to operate.
 */
module.exports = class MeganeClient extends discord.Client {
    /**
     * In addition to the options of the default discord.js client, some extra ones.
     * @typedef {object} MeganeClientOptions
     * @property {string|string[]} ownerids - list of owners by user ids.
     * @property {string} [prefix] - the global prefix used by the Client. 
     */

    /**
     * MeganeClient constructor
     * @param {MeganeClientOptions} options 
     */
    constructor(options = {}) {
        super(options);
        console.log("MeganeClient constructor");
        this.globalPrefix = options.prefix ? options.prefix : null;
        if (options.ownerids) {
            if (typeof options.ownerids === "string")
                options.owner = new Set([options.ownerids]);
            if (options.ownerids instanceof Array)
                options.owner = new Set(options.ownerids);
            this.once('ready', () => {
                for (const owner of options.owner) {
                    this.fetchUser(owner).catch(err => {
                        this.emit('warn', `Unable to fetch owner ${owner}.`);
                        this.emit('error', err);
                    });
                }
                delete options.ownerids;
            });
        }

        this.depot = new CommandDepot(this);

        this.dispatcher = new CommandDispatcher(this, this.depot);

        this.on('message', (message) => { this.dispatcher.handleMessage(message); });
        this.on('messageUpdate', (oldMessage, newMessage) => { this.dispatcher.handleMessage(newMessage, oldMessage); });
        this.on('messageReactionAdd', (messageReaction, user) => { this.dispatcher.handleReaction(messageReaction, user); });
        this.on('messageReactionRemove', (messageReaction, user) => {
            if (user.bot) return; //wont respond to bots
            console.log("REMOVE REACTION BOOO");
        });
        this.on('guildMemberAdd', (member) => {
            console.log(`New User "${member.user.username}" has joined "${member.guild.name}"`);
            member.guild.defaultChannel.send(`"${member.user.username}" has joined this server`);
        });
        this.depot.addTypes([
            require('./DefaultTypes/Boolean'),
            require('./DefaultTypes/Integer'),
            require('./DefaultTypes/String'),
            require('./DefaultTypes/Float')
        ])
        .addModules([
            require('./DefaultModules/TestModule/TestModule')
        ])
    }
    get prefix() {
        return this.globalPrefix;
    }
    set prefix(newPrefix) {
        this.globalPrefix = newPrefix;
        //globalPrefixChange , guild, prefix
        this.emit('globalPrefixChange', null, this.globalPrefix);
    }
    get owners() {
        if (!this.options.owner) return null;
        return this.options.owner;
    }
    isOwner(user) {
        if (!this.options.owner) return false;
        user = this.users.get(user);
        if (!user) throw new RangeError("user unresolvable.");
        if (this.options.owner instanceof Set) return this.options.owner.has(user.id);
        throw new RangeError('The client\'s "owner" option is an unknown value.');
    }
}