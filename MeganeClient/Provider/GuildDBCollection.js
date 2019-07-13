const DBCollection = require("./DBCollection")
module.exports = class GuildDBCollection extends DBCollection {
  constructor(db) {
    super(db, "guilds")
  }
  /**
     * Get the command prefix for a specific guild.
     * @param {Guild|string} guild Either the Guild object or the guildid string
     * @returns a Promise to resolve to the guild prefix or null
     */
  async getPrefix(guild, prefix) {
    const _id = typeof guild === "string" ? guild : guild.id
    const res = await this.collection.findOne({ _id }, { projection: { prefix: 1 } })
    if (res) {
      return res.prefix
    }
    return prefix ? prefix : undefined
  }

  /**
     * Set the command prefix for a specific guild.
     * @param {Guild|string} guild Either the Guild object or the guildid string
     * @param {string} newPrefix The new prefix
     */
  async setPrefix(guild, newPrefix) {
    const _id = typeof guild === "string" ? guild : guild.id
    const res = await this.collection.updateOne({ _id }, { $set: { prefix: newPrefix } }, {
      upsert: true
    })
    return res
  }
}
