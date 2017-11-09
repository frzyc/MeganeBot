const discord = require('discord.js');
const CommandDepot = require('./CommandDepot');
const CommandDispatcher = require('./CommandDispatcher');
const GuildData = require('./Provider/GuildData');
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
    constructor(options) {
        //preCheck options
        if (typeof options !== 'object') throw new TypeError('MeganeClientOptions must be an object.');
        if (!options.ownerids) throw new TypeError('MeganeClientOptions must be have ownerids.');
        if (typeof options.ownerids !== 'string' && !Array.isArray(options.ownerids)) throw new TypeError('MeganeClientOptions.ownerids must be a string or an array of strings');
        if (Array.isArray(options.ownerids))
            for (ownerid of options.ownerids)
                if (typeof ownerid !== 'string') throw new TypeError('MeganeClientOptions.ownerids must be a string or an array of strings');
        if (typeof options.ownerids === 'string')
            options.ownerids = [options.ownerids];
        super(options);
        console.log("MeganeClient constructor");
        this.globalPrefix = options.prefix ? options.prefix : null;
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
        this.depot
            .addTypes([
                require('./DefaultTypes/Boolean'),
                require('./DefaultTypes/Integer'),
                require('./DefaultTypes/String'),
                require('./DefaultTypes/Float')
            ])
            .addModules([
                require('./DefaultModules/TestModule/TestModule'),
                require('./DefaultModules/CommandCommandModule/CommandCommandModule')
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
    get owners() { return this.options.owner; }
    isOwner(user) {
        if (!this.options.owner) return false;
        user = this.users.get(user);
        if (!user) throw new RangeError("user unresolvable.");
        if (this.options.owner instanceof Set) return this.options.owner.has(user.id);
        throw new RangeError('The client\'s "owner" option is an unknown value.');
    }
    async addDB(db){
        db = await db;
        this.guildData = new GuildData(db);
        if(this.readyTimestamp){
            this.initDB();
        }
        this.once('ready',() => {
            this.initDB();
        });
    }
    async initDB(){
        if(this.guildData){
            this.guildData.init(this);
        }
    }
    async destroy(){
        await super.destroy();
        if(this.guildData)
            this.guildData.destroy()
    }
}