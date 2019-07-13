const CommandArgumentParseError = require("../Errors/CommandArgumentParseError")
const { permissions } = require("../")
/**
 * A class after the corresponding command from the message is parsed.
 * This class primarily deals with setting up the environment to execute the command, parse the arguments for the command, and finally executing the command.
 */
module.exports = class CommandMessage {
  /**
     * @constructor
     * @param {MeganeClient} client
     * @param {Message} message
     * @param {Command} command
     * @param {String} argString basically the whole content except the prefix + command part
     */
  constructor(client, message, command = null, argString = null) {

    /**
         * A reference to the MeganeClient.
         * @name CommandMessage#client
         * @type {MeganeClient}
         * @readonly
         */
    Object.defineProperty(this, "client", { value: client })

    /**
         * The {@link external:Message} that initiated the command.
         * @type {external:Message}
         */
    this.message = message

    /**
         * The {@link Command} inside the message.
         * @type {Command}
         */
    this.command = command

    /**
         * The arguments that is the command in the message content.
         * @type {?string}
         */
    this.argString = argString
  }

  /**
     * Does all the operations for execution of the {@link CommandMessage#command}.
     * - Check for {@link CommandMessage#command}'s context restrictions.
     * - Check for {@link CommandMessage#command}'s cooldown restrictions.
     * - Check for {@link CommandMessage#command}'s permission restrictions.
     * - Check for {@link CommandMessage#command}'s custom restrictions.
     * - Validate and parse all the arguments from {@link CommandMessage#argString}.
     * - Initiate cooldown, if applicable.
     * - Execute the {@link CommandMessage#command}.
     */
  async execute() {
    //command based restrictions
    const contextRestriction = this.command.contextRestriction(this.message)
    if (contextRestriction)
      return this.message.messageFactory({ messageContent: `This Command is restricted to ${contextRestriction} only.`, deleteTime: 5 * 60 * 1000 })
    if (!this.command.passCooldown(this.message, true)) return//check CD first, since if it is already on cooldown, it probably means it passed permissions

    //checking permissions
    const missingUserPerms = this.command.missingUserPermissions(this.message)
    if (missingUserPerms.length > 0)
      return this.message.messageFactory({
        messageContent: `You don't have enough permissions to use ${this.name}. missing:\n${missingUserPerms.map(p => permissions[p]).join(", and ")}`,
        deleteTime: 5 * 60 * 1000
      })

    const missingClientPerms = this.command.missingClientPermissions(this.message)
    if (missingClientPerms.length > 0) {
      return this.message.messageFactory({
        messageContent: `I don't have enough permissions to use ${this.name}. missing:\n${missingClientPerms.map(p => permissions[p]).join(", and ")}`,
        deleteTime: 5 * 60 * 1000
      })
    }

    if (this.command.restriction) {
      let restiction = await this.command.restriction(this)
      if (restiction) {
        this.client.autoMessageFactory({
          destination: this.message,
          messageContent: restiction,
          deleteTime: 30 * 1000,
          destinationDeleteTime: 30 * 1000
        })
        return
      }
    }
    var parsedArgs = null
    if (this.command.args && this.command.args.length > 0) {
      try {
        parsedArgs = await this.separateValidateParseAllArgs()
      } catch (e) {
        console.log(e)
        let usageObj = this.command.getUsageEmbededMessageObject(this.message)
        usageObj.messageContent = `Bad Arguments: ${e.message}`
        this.client.autoMessageFactory(usageObj)
        return false
      }
    }

    //set the cooldown for now, if failure, we can clear the cooldown/
    this.command.setCooldown(this.message)

    try {
      let response = await this.command.execute(this.message, parsedArgs)
      this.client.emit("commandsuccess", this, response)
      if (response) this.client.dispatcher.handleResponse(response, this.message)
    } catch (error) {
      console.error(error)
      this.command.clearCooldown(this.message)
    }

  }

  /**
     * A Helper function to help parse the {@link CommandMessage#argString}.
     * @private
     * @returns {?Object} - The parsed results.
     */
  async separateValidateParseAllArgs() {
    //break up the string into arguments
    let argString = this.argString.trim()
    this.argStrings = this.command.args.map(
      (arg) => {
        let processed = arg.separateArg(argString)
        argString = processed.remainingString
        return processed.result
      }
    )
    const argResults = {}
    //validate
    for (let i = 0; i < this.command.args.length; i++) {
      const arg = this.command.args[i]
      const result = await arg.validate(this.argStrings[i], this.message)
      if (result.error) {
        if (typeof result.error === "string")
          throw new CommandArgumentParseError(`Failed to validate argument **${arg.label}**: ${result.error}`)
        else if (result.error instanceof Error)
          throw result.error
        else
          throw new CommandArgumentParseError(`Failed to validate argument **${arg.label}**.`)

      } else if (typeof result.value !== "undefined")
        argResults[arg.label] = result.value
    }

    //parse
    for (let i = 0; i < this.command.args.length; i++) {
      const arg = this.command.args[i]
      const value = (typeof argResults[arg.label] !== "undefined") ? argResults[arg.label] : this.argStrings[i]
      argResults[arg.label] = await arg.parse(value, this.message)
    }
    return argResults
  }
}
