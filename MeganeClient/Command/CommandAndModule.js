const { permissions } = require("../Utility")
const joi = require('@hapi/joi');
/**
 * since {@link Command} and {@link CommandModule} share some common functionalities.
 */
class CommandAndModule {

    /**
     * A joi to validate some common properties between Command and CommandModule
     */
    static CommandAndModuleOptionsSchema = joi.object().keys({
        name: joi.string().trim().label("Name").required(),
        id: joi.string().trim().lowercase(),
        usage: joi.string(),
        description: joi.string(),
        ownerOnly: joi.boolean().default(false),
        guildOnly: joi.boolean().default(false),
        dmOnly: joi.boolean().default(false),
        defaultDisable: joi.boolean().default(false),
        clientPermissions: joi.array().items(joi.string().valid(Object.keys(permissions))).single(),
        userPermissions: joi.array().items(joi.string().valid(Object.keys(permissions))).single(),
    })

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
     * @param {boolean} - True if it passes without been restriction. False otherwise.
     */
    passContextRestriction(message) {
        //check Location restriction
        let returnMsg = null
        if (this.dmOnly && message.channel.type === "text") returnMsg = "direct message"
        else if (this.guildOnly && (message.channel.type === "dm" || message.channel.type === "group")) returnMsg = "server"
        else if (this.ownerOnly && !this.client.isOwner(message.author.id)) returnMsg = "botowner"
        if (returnMsg) {
            this.client.autoMessageFactory({ destination: message, messageContent: `This is restricted to ${returnMsg} only.`, deleteTime: 10 })
            return false
        }
        return true
    }

    /**
     * Checks if the user of the message has the permission to perform an operation in the channel of the message.
     * @param {external:Message} message
     * @param {boolean} [reply=false]
     */
    passPermissions(message, reply = false) {
        if (this.userPermissions &&
            message.channel.type === "text" // && !message.member.permissions.hasPermission(this.userPermissions)
        ) {
            const missing = message.channel.permissionsFor(message.author).missing(this.userPermissions)
            if (missing.length > 0) {
                if (reply)
                    this.client.autoMessageFactory({
                        destination: message,
                        messageContent: `You don't have enough permissions to use ${this.name}. missing:\n${missing.map(p => permissions[p]).join(", and ")}`,
                        deleteTime: 5 * 60
                    })
                return false
            }
        }
        if (this.clientPermissions &&
            message.channel.type === "text" //commands are only existant in text channels
        ) { //!message.channel.permissionsFor(this.client.user).has(this.clientPermissions)
            const missing = message.channel.permissionsFor(this.client.user).missing(this.userPermissions)
            if (missing.length > 0) {
                if (reply)
                    this.client.autoMessageFactory({
                        destination: message,
                        messageContent: `I don't have enough permissions to use this command. missing:\n${missing.map(p => permissions[p]).join(", and ")}`,
                        deleteTime: 5 * 60
                    })
                return false
            }
        }
        return true
    }
}
module.exports = CommandAndModule
