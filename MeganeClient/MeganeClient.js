const fs = require("fs")
const discord = require("discord.js")
const sqlite = require("sqlite")
const CommandDepot = require("./CommandDepot")
const CommandDispatcher = require("./CommandDispatcher")
const Table = require("./Provider/Table")
const GuildData = require("./Provider/GuildData")
const MessageFactory = require("./MessageFactory")
/**
 * The Main client for the MeganeClient, a wrapper over the discord client.
 * @extends {external:Client}
 */
class MeganeClient extends discord.Client {
    /**
     * In addition to the options of the default discord.js client, some extra ones.
     * @typedef {object} MeganeClientOptions - Options that are added for MeganeClient
     * @property {string|string[]} ownerids - List of owners by user ids.
     * @property {?string} prefix - The global prefix used by the Client.
     * @property {string} profilePictureDirectory - The directory with some display pictures to change for the bot.
     */

    /**
     * MeganeClient constructor
     * @param {MeganeClientOptions} options - Should be the same options passed to Discord.Client, with additions for MeganeClient
     */
    constructor(options) {
        //preCheck options
        if (typeof options !== "object") throw new TypeError("MeganeClientOptions must be an object.")
        if (!options.ownerids) throw new TypeError("MeganeClientOptions must be have ownerids.")
        if (typeof options.ownerids !== "string" && !Array.isArray(options.ownerids)) throw new TypeError("MeganeClientOptions.ownerids must be a string or an array of strings.")
        if (Array.isArray(options.ownerids))
            for (ownerid of options.ownerids)
                if (typeof ownerid !== "string") throw new TypeError("MeganeClientOptions.ownerids must be a string or an array of strings.")
        if (typeof options.ownerids === "string")
            options.ownerids = [options.ownerids]
        if (options.profilePictureDirectory) {
            if (typeof options.profilePictureDirectory !== "string") throw new TypeError("MeganeClientOptions.profilePictureDirectory must be a string or an array of strings.")
            if (!fs.existsSync(options.profilePictureDirectory)) throw new Error("MeganeClientOptions.profilePictureDirectory must be a valid path.")
        }
        super(options)

        /**
         * The global command prefix used mainly for private message channels and defaults
         * @private
         * @type {?String}
         */
        this.globalPrefix = options.prefix ? options.prefix : null

        /**
         * The sqlite database to persist data for the Client.
         * @type {Database}
         */
        this.db = null

        /**
         * A sqlite table for all guild-related things.
         * @type {Table}
         */
        this.guildTable = null

        //validate owners
        options.owner = new Set(options.ownerids)
        delete options.ownerids
        this.once("ready", () => {
            for (const owner of options.owner) {
                this.fetchUser(owner).catch(err => {
                    console.log(err)
                    throw Error(`Unable to fetch owner ${owner}.`)
                })
            }
        })

        /**
         * Stores Commands and Modules and stuff for the Client.
         * @type {CommandDepot}
         */
        this.depot = new CommandDepot(this)

        /**
         * A Dispatcher to parse a command from the commands in a depot.
         * @type {CommandDispatcher}
         */
        this.dispatcher = new CommandDispatcher(this, this.depot)

        /**
         * The path to a directory of profile pictures.
         * @type {?string}
         */
        this.profilePictureDirectory = options.profilePictureDirectory || null

        this.on("message", (message) => { this.dispatcher.handleMessage(message) })
        this.on("messageUpdate", (oldMessage, newMessage) => { this.dispatcher.handleMessage(newMessage, oldMessage) })
        this.on("messageReactionAdd", (messageReaction, user) => { this.dispatcher.handleReaction(messageReaction, user) })
        this.on("messageReactionRemove", (messageReaction, user) => {
            if (user.bot) return //wont respond to bots
            console.log("REMOVE REACTION BOOO")
        })
        this.on("guildMemberAdd", (member) => {
            console.log(`New User "${member.user.username}" has joined "${member.guild.name}"`)
            //member.guild.defaultChannel.send(`"${member.user.username}" has joined this server`); TODO default channel deprecated in discordjs 11.4
        })
        //add the default types and modules
        this.depot
            .addTypes([
                require("./DefaultTypes/Boolean"),
                require("./DefaultTypes/Integer"),
                require("./DefaultTypes/String"),
                require("./DefaultTypes/Float"),
                require("./DefaultTypes/User"),
                require("./DefaultTypes/GuildMember"),
            ])
            .addModules([
                require("./DefaultModules/TestModule/TestModule"),
                require("./DefaultModules/CommandAdminModule/CommandAdminModule"),
                require("./DefaultModules/BotAdminModule/BotAdminModule"),
                require("./DefaultModules/UtilModule/UtilModule"),
                require("./DefaultModules/DiscordModule/DiscordModule"),
            ])

    }

    /**
     * The global command prefix used mainly for private message channels and defaults
     * @type {?string}
     */
    get prefix() {
        return this.globalPrefix
    }

    /**
     * Sets the new global prefix. Will be saved to databse.
     * @param {string} newPrefix - The new Prefix
     */
    set prefix(newPrefix) {
        this.globalPrefix = newPrefix
        //globalPrefixChange , guild, prefix
        this.emit("CommandPrefixChange", "global", this.globalPrefix)
    }

    /**
     * A set of user ids, in the form of strings, for users that should be recognized as bot owners.
     * @type {?Set<String>}
     */
    get owners() { return this.options.owner }

    /**
     * Check if the user id represents a bot owner.
     * @param {string} userid - A user id in the form of a string.
     * @returns {boolean}
     */
    isOwner(userid) {
        if (typeof userid !== "string") throw new TypeError("userid must be a string.")
        if (!this.options.owner) return false
        let user = this.users.get(userid)
        if (!user) throw new RangeError("user unresolvable.")
        if (this.options.owner instanceof Set) return this.options.owner.has(user.id)
        throw new RangeError("The client's \"owner\" option is an unknown value.")
    }

    /**
     * A helper function to create a MessageFactory.
     * @param {MessageResolvable} msgResovlable
     * @returns {MessageFactory}
     */
    messageFactory(msgResovlable) {
        return new MessageFactory(this, msgResovlable)
    }

    /**
     * A helper function to create a MessageFactory, then immediately executing it.
     * @param {MessageResolvable} msgResovlable
     * @returns {?Promise}
     */
    autoMessageFactory(msgResovlable) {
        return (new MessageFactory(this, msgResovlable)).execute()
    }

    /**
     * Initiates the database using the filepath. Will initialize after the Client is ready.
     * @param {string} pathToDB Path to the .db file used as the database for the client.
     */
    async addDB(pathToDB) {
        this.db = await sqlite.open(pathToDB)
        if (this.readyTimestamp) {
            this.initDB()
        }
        this.once("ready", () => {
            this.initDB()
        })
    }

    /**
     * Initiates the Database for the client.
     * @private
     */
    async initDB() {
        this.guildTable = new Table(this, this.db, "guild", "guildid", "INTEGER")
        await this.guildTable.init()
        this.guildTable.guildData = new GuildData(this.guildTable, "guilddata")
        await this.guildTable.guildData.init()
    }

    /**
     * Destroys the Database for the client.
     * @private
     */
    async destroyDB() {
        await super.destroy()
        if (this.guildTable)
            this.guildTable.destroy()
    }
}
module.exports = MeganeClient
