const fs = require("fs")
const discord = require("discord.js")
const joi = require("@hapi/joi")
const path = require("path")
const { CommandDepot, CommandDispatcher } = require("./Command")
const { Database, GuildDBCollection } = require("./Provider")
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
   * @property {string} profilePictureDirectory - The directory with some display pictures to change for the bot. //TODO should be attached to the command to change picture somehow?
   */
  static clientOptionsSchema = joi.object({
    ownerids: joi.array().items(joi.string()).unique().single().required()
  }).unknown(true)

  static DEFAULT_PREFIX = "!"
  /**
   * MeganeClient constructor
   * @param {MeganeClientOptions} options - Should be the same options passed to Discord.Client, with additions for MeganeClient
   */
  constructor(options) {
    super(options)
    let result = this.constructor.clientOptionsSchema.validate(options)
    if (result.error) throw result.error
    else options = result.value

    //preCheck options
    if (options.profilePictureDirectory) {
      if (typeof options.profilePictureDirectory !== "string") throw new TypeError("MeganeClientOptions.profilePictureDirectory must be a string or an array of strings.")
      if (!fs.existsSync(options.profilePictureDirectory)) throw new Error("MeganeClientOptions.profilePictureDirectory must be a valid path.")
    }

    //validate owners
    this.options.owner = new Set(options.ownerids)
    this.once("ready", () => {
      for (const owner of this.options.owner) {
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
      .addTypesIn(path.join(__dirname, "DefaultTypes"))
      .addModulesIn(path.join(__dirname, "DefaultModules"))

    /**
     * @type {Promise}
     * Resolves to whether the client inits properly
     */
    this.init = this.init()
  }

  async init() {
    /**
     * The sqlite database to persist data for the Client.
     * @type {Database}
     */
    this.db = new Database()
    await this.db.init()

    /**
     * A sqlite table for all guild-related things.
     * @type {GuildDB}
     */
    this.guildDBCollection = new GuildDBCollection(this.db)

    //Check and set global prefix.
    /**
     * The global command prefix. It is used as the default for private message channels or new servers.
     * @private
     * @type {String}
     */

    //check if there is a previous prefix from the database
    let prevPrefix = await this.guildDBCollection.getPrefix("0")
    this.globalPrefix = typeof prevPrefix === "string" ? prevPrefix : MeganeClient.DEFAULT_PREFIX
  }

  /**
   * A "destructor". Basically closes the database and clean up any stateful stuff
   */
  destructor() {
    this.db.close().then(() => {
      this.db = null
      this.guildDBCollection = null
    })
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
    if (this.globalPrefix !== newPrefix) {
      this.globalPrefix = newPrefix
      //"0" is the global bot ID
      this.setprefix = this.guildDBCollection.setPrefix("0", newPrefix)
    }
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
}
module.exports = MeganeClient
