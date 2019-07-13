const { permissions } = require("../Utility")
const joi = require("@hapi/joi")
/**
 * since {@link Command} and {@link CommandModule} share some common functionalities.
 */
class CommandAndModule {

    /**
     * A joi to validate some common properties between Command and CommandModule
     * need to rename usage and description because there are getter functions with the same name.
     */
    static CommandAndModuleOptionsSchema = joi.object().keys({
      name: joi.string().trim().label("Name").required(),
      usageString: joi.string(),
      descriptionString: joi.string(),
      ownerOnly: joi.boolean().default(false),
      guildOnly: joi.boolean().default(false),
      dmOnly: joi.boolean().default(false),
      defaultDisable: joi.boolean().default(false),
      clientPermissions: joi.array().items(joi.string().valid(Object.keys(permissions))).single(),
      userPermissions: joi.array().items(joi.string().valid(Object.keys(permissions))).single(),
    })
      .rename("description", "descriptionString")
      .rename("usage", "usageString")

    /**
     *
     * @param {MeganeClient} client
     */
    constructor(client) {
      /**
         * A reference to the MeganeClient.
         * @name CommandAndModule#client
         * @type {MeganeClient}
         * @readonly
         */
      Object.defineProperty(this, "client", { value: client })
    }

    /**
     * Get the usage string for this {@link Command}/{@link CommandModule}.
     * @returns {string} - Usage string, else return "No usage specififed"
     */
    get usage() {
      if (!this.usageString) return "No usage specified."
      return this.usageString
    }

    /**
     * Get whether the usage string for this {@link Command}/{@link CommandModule} exists.
     * @returns {boolean}
     */
    hasUsage() {
      if (this.usageString) return true
      return false
    }

    /**
     * Get the description for this {@link Command}/{@link CommandModule}.
     * @returns {string} - Description string, else return "No description specififed"
     */
    get description() {
      if (!this.descriptionString) return "No description specified."
      return this.descriptionString
    }

    /**
     * Get whether the description for this {@link Command}/{@link CommandModule} exists.
     * @returns {boolean}
     */
    hasDescription() {
      if (this.descriptionString) return true
      return false
    }

    /**
     * Check whether the author/channel passes the restrictions(dmOnly, guildOnly, ownerOnly).
     * see {@link CommandAndModule#dmOnly}, {@link CommandAndModule#guildOnly} and {@link CommandAndModule#ownerOnly}.
     * @param {string} - returns the restriction this command/module has, empty string if it does not have any restrictions.
     */
    contextRestriction(message) {
      if (this.dmOnly && message.channel.type === "text") return "direct message"
      else if (this.guildOnly && (message.channel.type === "dm" || message.channel.type === "group")) return "server"
      else if (this.ownerOnly && !this.client.isOwner(message.author.id)) return "botowner"
      return ""
    }

    /**
     * Returns an array of missing permissions that the user lacks to use this command/module.
     * @param {external:Message} message
     * @returns {string[]} array of missing permissions
     */
    missingUserPermissions(message) {
      if (this.userPermissions && message.channel.type === "text")
        return message.channel.permissionsFor(message.author).missing(this.userPermissions)
      return []
    }

    /**
     * Returns an array of missing permissions that the user lacks to use this command/module.
     * @param {external:Message} message
     * @returns {string[]} array of missing permissions
     */
    missingClientPermissions(message) {
      if (this.clientPermissions && message.channel.type === "text")
        return message.channel.permissionsFor(this.client.user).missing(this.userPermissions)
      return []
    }

    /**
     * Check if this command/modules passes contextual/permission to execute
     * @param {external:Message} message
     * @returns {boolean}
     */
    passContextAndPerms(message) {
      if (this.contextRestriction(message)) return false
      if (this.missingUserPermissions(message).length) return false
      if (this.missingClientPermissions(message).length) return false
      return true
    }
}
module.exports = CommandAndModule
