const Table = require("./Table")
class GuildTable extends Table {
    constructor(db, tableName) {
        super(db, tableName)
    }
    init() {
        //return new Promise((resolve,reject)=>{
        this.primaryKey = "id"
        this.prefixKey = "command_prefix"
        this.db.run(`CREATE TABLE ${this.tableName}(
            ${this.primaryKey} text UNIQUE PRIMARY KEY,
            ${this.prefixKey} text
            );
        `)
        //})
    }

    /**
     * Get the command prefix for a specific guild.
     * @param {Guild|string} guild Either the Guild object or the guildid string
     */
    getPrefix(guild) {
        let guildid = typeof guild === "string" ? guild : guild.id
        return this.get(guildid, this.prefixKey)
    }

    /**
     * Set the command prefix for a specific guild.
     * @param {Guild|string} guild Either the Guild object or the guildid string
     * @param {string} value The new prefix
     */
    setPrefix(guild, value) {
        let guildid = typeof guild === "string" ? guild : guild.id
        return this.set(guildid, this.prefixKey, value)
    }
}
module.exports = GuildTable
