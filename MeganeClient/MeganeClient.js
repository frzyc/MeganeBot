const fs = require('fs');
const discord = require('discord.js');
const sqlite = require('sqlite');
const CommandDepot = require('./CommandDepot');
const CommandDispatcher = require('./CommandDispatcher');
const Table = require('./Provider/Table');
const GuildData = require('./Provider/GuildData');
const MessageFactory = require('./MessageFactory');
/**
 * The Main client for the MeganeClient. This is the client where the MeganeBot starts to operate.
 */
module.exports = class MeganeClient extends discord.Client {
    /**
     * In addition to the options of the default discord.js client, some extra ones.
     * @typedef {object} MeganeClientOptions
     * @property {string|string[]} ownerids - List of owners by user ids.
     * @property {string} [prefix] - The global prefix used by the Client. 
     * @property {string} [profilePictureDirectory] - The directory with some display pictures to change for the bot.
     */

    /**
     * MeganeClient constructor
     * @param {MeganeClientOptions} options 
     */
    constructor(options) {
        //preCheck options
        if (typeof options !== 'object') throw new TypeError('MeganeClientOptions must be an object.');
        if (!options.ownerids) throw new TypeError('MeganeClientOptions must be have ownerids.');
        if (typeof options.ownerids !== 'string' && !Array.isArray(options.ownerids)) throw new TypeError('MeganeClientOptions.ownerids must be a string or an array of strings.');
        if (Array.isArray(options.ownerids))
            for (ownerid of options.ownerids)
                if (typeof ownerid !== 'string') throw new TypeError('MeganeClientOptions.ownerids must be a string or an array of strings.');
        if (typeof options.ownerids === 'string')
            options.ownerids = [options.ownerids];
        if (options.profilePictureDirectory) {
            if (typeof options.profilePictureDirectory !== 'string') throw new TypeError('MeganeClientOptions.profilePictureDirectory must be a string or an array of strings.');
            if (!fs.existsSync(options.profilePictureDirectory)) throw new Error('MeganeClientOptions.profilePictureDirectory must be a valid path.');
        }
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
        this.profilePictureDirectory = options.profilePictureDirectory || null;
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
        //add the default types and modules
        this.depot
            .addTypes([
                require('./DefaultTypes/Boolean'),
                require('./DefaultTypes/Integer'),
                require('./DefaultTypes/String'),
                require('./DefaultTypes/Float'),
                require('./DefaultTypes/User'),
                require('./DefaultTypes/GuildMember'),
            ])
            .addModules([
                require('./DefaultModules/TestModule/TestModule'),
                require('./DefaultModules/CommandAdminModule/CommandAdminModule'),
                require('./DefaultModules/BotAdminModule/BotAdminModule'),
                require('./DefaultModules/UtilModule/UtilModule')
            ]);

    }
    get prefix() {
        return this.globalPrefix;
    }
    set prefix(newPrefix) {
        this.globalPrefix = newPrefix;
        //globalPrefixChange , guild, prefix
        this.emit('CommandPrefixChange', 'global', this.globalPrefix);
    }
    get owners() { return this.options.owner; }
    isOwner(userid) {
        if (typeof userid !== 'string') throw new TypeError("userid must be a string.")
        if (!this.options.owner) return false;
        let user = this.users.get(userid);
        if (!user) throw new RangeError("user unresolvable.");
        if (this.options.owner instanceof Set) return this.options.owner.has(user.id);
        throw new RangeError('The client\'s "owner" option is an unknown value.');
    }
    messageFactory(options) {
        return new MessageFactory(this, options);
    }
    autoMessageFactory(options) {
        return (new MessageFactory(this, options)).execute();
    }
    async addDB(pathToDB) {
        this.db = await sqlite.open(pathToDB);
        if (this.readyTimestamp) {
            this.initDB();
        }
        this.once('ready', () => {
            this.initDB();
        });
    }
    async initDB() {
        this.guildTable = new Table(this, this.db, 'guild', 'guildid', 'INTEGER');
        await this.guildTable.init();
        this.guildTable.guildData = new GuildData(this.guildTable, 'guilddata');
        await this.guildTable.guildData.init();
    }
    async destroyDB() {
        await super.destroy();
        if (this.guildTable)
            this.guildTable.destroy()
    }
}