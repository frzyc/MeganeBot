/**
 * A helper class that extends the functionality of the {@link external:Guild} class.
 */
class GuildExtension {
    /**
     * get the command prefix for this guild.
     * @returns {string}
     */
    get prefix() {
        return this.prefixForCommands
    }

    /**
     * sets the command prefix for this guild.
     * @param {string} newPrefix
     */
    set prefix(newPrefix) {
        this.prefixForCommands = newPrefix
        this.client.emit("CommandPrefixChange", this, this.prefixForCommands)
    }
}
const { Guild } = require("discord.js")
for (const prop of Object.getOwnPropertyNames(GuildExtension.prototype)) {
    if (prop === "constructor") continue
    console.log("Adding Extension to Guild: " + prop)
    Object.defineProperty(Guild.prototype, prop, Object.getOwnPropertyDescriptor(GuildExtension.prototype, prop))
}
module.exports = GuildExtension