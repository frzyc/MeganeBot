/**
 * A helper class that extends the functionality of the {@link external:Guild} class.
 */
class GuildExtension {

    /**
     * The prefix used for commands for this Guild.
     * @name prefixForCommands
     * @private
     * @type {string}
     */

    /**
     * Get the command prefix for this guild. If this is null, call {@link GuildExtension#resolvePrefix}
     * //TODO test whether this is actually cached or a new Guild is created for every access?
     * @returns {string}
     */
    get prefix() {
        return this.prefixForCommands ? this.prefixForCommands : null
    }

    /**
     * resolve the prefix by getting it from the database.
     */
    resolvePrefix() {
        return new Promise((resolve) => {
            this.client.guildTable.getPrefix(this).then(pre => {
                if (pre)
                    this.prefixForCommands = pre
                else //use the default value from the client.
                    this.prefixForCommands = this.client.prefix
                resolve(this.prefixForCommands)
            })
        })
    }

    /**
     * sets the command prefix for this guild.
     * @param {string} newPrefix
     */
    set prefix(newPrefix) {
        if (newPrefix !== this.prefixForCommands)//if the prefix is different, save to db
            this.client.guildTable.setPrefix(this, newPrefix)
        this.prefixForCommands = newPrefix
    }
}
const { Guild } = require("discord.js")
for (const prop of Object.getOwnPropertyNames(GuildExtension.prototype)) {
    if (prop === "constructor") continue
    console.log("Adding Extension to Guild: " + prop)
    Object.defineProperty(Guild.prototype, prop, Object.getOwnPropertyDescriptor(GuildExtension.prototype, prop))
}
module.exports = GuildExtension