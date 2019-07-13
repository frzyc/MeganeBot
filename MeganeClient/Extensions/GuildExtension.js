/**
 * A helper class that extends the functionality of the {@link external:Guild} class.
 */
module.exports = class GuildExtension {

  /**
     * The prefix used for commands for this Guild.
     * @name prefixForCommands
     * @private
     * @type {string}
     */

  /**
     * Get the command prefix for this guild. If this is null, call {@link GuildExtension#resolvePrefix}
     * @returns {string}
     */
  get prefix() {
    return this.prefixForCommands
  }

  /**
     * resolve the prefix by getting it from the database.
     */
  resolvePrefix() {
    return new Promise((resolve) => {
      this.client.guildDBCollection.getPrefix(this).then(pre => {
        if (typeof pre === "string")
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
      this.client.guildDBCollection.setPrefix(this, newPrefix)
    this.prefixForCommands = newPrefix
  }
}
