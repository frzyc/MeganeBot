const CommandArgument = require("./CommandArgument")
const CommandAndModule = require("./CommandAndModule")
const joi = require("@hapi/joi")
/**
 * This is the base Command class. All commands should extend this class.
 * @extends CommandAndModule
*/
class Command extends CommandAndModule {
  /**
   * Options that sets the format and property of the a command.
   * @typedef {Object} CommandOptions
   * @property {String} name - The name of the command. Should be unique to avoid conflicts
   * @property {(string|string[])} commands - Array of commands, or a single command. (Must be all unique, even to other commands)
   * @property {string} [usage] - A short usage description of the command. Usally following the command argument template
   * @property {string} [description] - A detailed description of the command
   * @property {(string|string[])} [examples] - Usage examples of the command
   * @property {CommandRestrictionFunction} [restriction] - Restriction function.
   * @property {(CommandArgumentOptions|CommandArgumentOptions[])} [args] - Arguments for the command. Mutually exclusive to CommandOptions#numArgs
   * @property {boolean} [ownerOnly=false] - Whether or not the command should only function for the bot owner
   * Will be overridden by the property passed down from module.
   * @property {boolean} [guildOnly=false] - Whether or not the command should only function in a guild channel
   * Will be overridden by the property passed down from module.
   * @property {boolean} [dmOnly=false] - Whether or not the command should only function in a direct message channel
   * Will be overridden by the property passed down from module.
   * @property {boolean} [defaultDisable=false] - Determines whether if this command is disabled by default.
   * Will be overridden by the property passed down from module.
   * @property {(PermissionResolvable|PermissionResolvable[])} [clientPermissions] - Permissions required by the client to use the command.
   * Will add onto any Permissions passed down from module.
   * @property {(PermissionResolvable|PermissionResolvable[])} [userPermissions] - Permissions required by the user to use the command.
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
   * @property {?number} [userCooldown] - time in second required for a user to reuse this {@link Command}
   * @property {?number} [serverCooldown] - time in second required for a server to reuse this {@link Command}
   * @property {?number} [channelCooldown] - time in second required for a channel to reuse this {@link Command}
   */

  /**
  * The JOI schema for validating the options.
  * convert option must be enabled.
  */
  static CommandOptionsSchema =
    CommandAndModule.CommandAndModuleOptionsSchema.keys({
      commands: joi.array().items(joi.string().lowercase()).unique().single().required(),
      examples: joi.array().items(joi.string()).single(),
      restriction: joi.func().maxArity(1),
      args: joi.array().items(joi.object()).single(),
      throttling: joi.object().keys({
        userCooldown: joi.number().positive().unit("seconds"),
        serverCooldown: joi.number().positive().unit("seconds"),
        channelCooldown: joi.number().positive().unit("seconds")
      }),
      numArgs: joi.number().integer().positive()
    }).without("args", "numArgs")

  /**
   * Constructor. Will precheck the options before creating.
   * @param {MeganeClient} client - The client for the command
   * @param {CommandOptions} options - The options for the command
   */
  constructor(client, options) {
    super(client)
    let result = Command.CommandOptionsSchema.validate(options)
    if (result.error) throw result.error
    if (result.value.args) {//TODO this parsing can be done similarly https://github.com/hapijs/joi/issues/1489
      let isEnd = false
      let hasOptional = false
      for (let arg of result.value.args) {
        if (isEnd) throw new Error("No other argument may come after an .array = 0 argument.")
        if (typeof arg.default !== "undefined") hasOptional = true
        else if (hasOptional) throw new Error("Required arguments may not come after optional arguments.")
        if (arg.array === 0) {
          isEnd = true
          arg.last = true
        }
      }
      this.args = new Array(result.value.args.length)
      for (let i = 0; i < result.value.args.length; i++)
        this.args[i] = new CommandArgument(this.client, result.value.args[i])
      delete result.value.args
    }
    Object.assign(this, result.value)

    /**
     * A map to each guild, to determine whether if this {@link Command} is enabled.
     * @todo implementation and testing, maybe create this in CommandAndModule?
     * @member {Map<string,boolean>}
     */
    this.enabledInGuild = new Map()
    /**
     * An array of commands and its aliases
     * @member {string[]} Command.commands 
     */

    /**
     * The {@link CommandModule} this {@link Command} belongs to.
     * @member {CommandModule} Command.module 
     */

    /**
     * A example for using this {@link Command}
     * @member {?string} Command.examples 
     */

    /**
     * Throttle options
     * @member {?ThrottlingOptions} Command.throttling 
     */

    /**
     * A function to restrict this command. Will be executed before {@link Command#execute}.
     * @member {?function} Command.restriction 
     */

    /**
     * The number of arguments to parse in this {@link Command}
     * @member {?number} Command.numArgs 
     */

    this.userCooldownList = new Map()
    this.serverCooldownList = new Map()
    this.channelCooldownList = new Map()
  }

  /**
   * A template for the execute method of {@link Command}.
   * @param {external:Message} message - The message that triggered this command
   * @param {Object} args - Object for the parsed args, with property name being the {@link CommandArgument#label}s
   * @abstract
   */
  async execute(message, args) { // eslint-disable-line no-unused-vars, require-await
    throw new Error(`${this.constructor.name} doesn't have a execute() method.`)
  }

  /**
   * Generate a usage embed message for this {@link Command}. Mainly used for the help command, or if you use the command incorrectly.
   * @param {external:Message} message - The message that triggered the usage, for getting contextual information like prefix.
   * @returns {MessageResolvable} - The generated message that can be fed right into a MessageFactory.
   */
  getUsageEmbededMessageObject(message) {
    let prefix = message.guild ? message.guild.prefix : null
    if (!prefix)
      prefix = "<@mentionme> "
    let title = `Usage of *${this.name}* (**${this.commands.join(", ")}**)`
    let desc = `**${prefix}${this.commands[0]} ${this.getTemplateArguments()}**\n${this.usage}`
    let msgobj = {
      destination: message,
      destinationDeleteTime: 5 * 60 * 1000,
      messageOptions: {
        embed: {
          color: 3447003,
          title: title,
          description: desc,
        }
      },
      reactions: [{
        emoji: "❌",
        execute: (reactionMessage) => {
          reactionMessage.message.delete()
        }
      }],
    }
    msgobj.messageOptions.embed.fields = []
    if (this.hasDescription()) {
      msgobj.messageOptions.embed.fields.push({
        name: "Description",
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
          name: `Argument: ${arg.label}${typeof this.default !== "undefined" ? (" Optional(Defaults to " + this.default + ")") : ""}`,
          value: `Type: **${arg.type.id}**\nDescription:\n${arg.description}`
        })
      }
    }
    return msgobj
  }

  /**
   * creates a template string for the arguments, based on the args of this command
   * @returns {string} - Template string.
   */
  getTemplateArguments() {
    if (!this.args) return ""
    return this.args.map(arg => typeof arg.default === "undefined" ? `[${arg.label}]` : `<${arg.label}>`).join(" ")
  }

  /**
   * Start the cooldown peroid of this {@link Command}.
   * @todo rewrite entire throttling infastructure.
   * @param {external:Message} message
   */
  setCooldown(message) {
    let setCD = (coolDownType, property) => {
      if (this.throttling && this.throttling[coolDownType]) {
        let now = new Date()
        let cdlist = coolDownType + "List"
        if (!this[cdlist]) this[cdlist] = {}
        this[cdlist][property] = now.setSeconds(now.getSeconds() + this.throttling[coolDownType])
        console.log(`setcooldown: ${this.name}[${cdlist}][${property}] = ${this[cdlist][property]}`)
      }
    }
    setCD("userCooldown", message.author.id)
    if (message.guild && message.guild.available)
      setCD("serverCooldown", message.guild.id)
    setCD("channelCooldown", message.channel.id)
  }

  /**
   * Check whether this {@link Command} is in cooldown period.
   * @param {external:Message} message
   * @returns {Object}
   */
  inCooldown(message) {
    let inCD = (coolDownType, property) => {
      if (this.throttling && !this.throttling[coolDownType]) return 0
      let now = new Date()
      let nowtime = now.getTime()
      let list = coolDownType + "List"
      let cd = this[list][property]
      if (cd && cd > nowtime) //if current time has not surpassed cd time, means still in cooldown.
        return cd - nowtime
      else if (cd && cd <= nowtime)
        delete this[list][property]
      return 0
    }
    let ret = {
      userCooldown: inCD("userCooldown", message.author.id),//`This command is time-restricted per user.`
      serverCooldown: message.guild && message.guild.available ? inCD("serverCooldown", message.guild.id) : 0, //`This command is time-restricted per server.`
      channelCooldown: inCD("channelCooldown", message.channel.id)//`This command is time-restricted per channel.`
    }

    return (!ret.userCooldown && !ret.serverCooldown && !ret.channelCooldown) ? null : ret
  }

  /**
   * Clears the cooldowns of this {@link Command} from the author/channel/guild context provided by the message.
   * @param {external:Message} message - The message to provide the author/channel/guild context.
   */
  clearCooldown(message) {
    let clrCD = (coolDownType, property) => {
      if (!this.throttling[coolDownType]) return
      let list = coolDownType + "List"
      if (this[list] && this[list][property])
        delete this[list][property]
    }
    clrCD("userCooldown", message.author.id)
    if (message.guild && message.guild.available)
      clrCD("serverCooldown", message.guild.id)
    clrCD("channelCooldown", message.channel.id)
  }

  /**
   * Check if this {@link Command} is in cooldown, in the author/channel/guild context provided by the message.
   * @param {external:Message} message - The message to provide the author/channel/guild context.
   * @param {boolean} [reply=false] - Whether to reply to the message if the command is in cooldown.
   * @returns {boolean} - True if no cooldown, False otherwise.
   */
  passCooldown(message, reply = false) {
    //check cooldown restriction
    let inCD = this.inCooldown(message)
    if (inCD) {
      let msg = ""
      //this accounts for multiple cooldowns
      if (inCD.userCooldown) msg += `This command is time- restricted per user.Cooldown: ${inCD.userCooldown / 1000} seconds.\n`
      if (inCD.serverCooldown) msg += `This command is time- restricted per server.Cooldown: ${inCD.serverCooldown / 1000} seconds.\n`
      if (inCD.channelCooldown) msg += `This command is time- restricted per channel.Cooldown: ${inCD.channelCooldown / 1000} seconds.\n`
      if (reply)
        message.messageFactory({ messageContent: msg, deleteTime: 30 * 1000 })
      return false
    }
    return true
  }

  /**
   * Check if this {@link Command} is enabled in a guild or not.
   * @param {Guild} guild - The guild to check the condition for.
   * @returns {boolean} - True if is enabled, false if disabled.
   */
  getEnabledInGuild(guild) {
    let guildid = guild.id
    if (this.enabledInGuild.has(guildid)) {
      return this.enabledInGuild.get(guildid)
    } else if (this.defaultDisable)
      return false
    return true
  }

  /**
   * Sets whether this {@link Command} is enabled in a guild or not.
   * @param {Guild} guild - The guild to set the conditon for.
   * @param {boolean} enabled - Boolean to set.
   */
  setEnabledInGuild(guild, enabled) {
    let guildid = guild.id
    let old
    if (this.enabledInGuild.has(guildid))
      old = this.enabledInGuild.get(guildid)
    if (enabled !== old) {
      this.enabledInGuild.set(guildid, enabled)
      this.client.emit("CommandEnabledChange", guild, this, enabled)
    }
  }
}
module.exports = Command
