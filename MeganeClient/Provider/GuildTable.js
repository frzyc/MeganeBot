const Table = require("./Table")
module.exports = class GuildTable extends Table {
    constructor(db, tableName) {
        super(db, tableName)
    }
    /**
     * Create the guildTable, and assign the primaryKey.
     * @override
     */
    init() {
        this.primaryKey = "id"

        /**
         * Name of the command_prefix column
         * @type {string}
         * @private
         */
        this.prefixKey = "command_prefix"

        //create the new table here
        this.db.serialize()
        this.db.run(`CREATE TABLE IF NOT EXISTS ${this.tableName}(
            ${this.primaryKey} text UNIQUE PRIMARY KEY,
            ${this.prefixKey} text
            );
        `)
        this.db.parallelize()
    }

    /**
     * Get the command prefix for a specific guild.
     * @param {Guild|string} guild Either the Guild object or the guildid string
     * @returns a Promise to resolve to the guild prefix or null
     */
    getPrefix(guild) {
        let guildid = typeof guild === "string" ? guild : guild.id
        return this.get(guildid, this.prefixKey)
    }

    /**
     * Set the command prefix for a specific guild.
     * @param {Guild|string} guild Either the Guild object or the guildid string
     * @param {string} value The new prefix
     * @returns a Promise to resolve to the newly set guild prefix or null
     */
    setPrefix(guild, value) {
        let guildid = typeof guild === "string" ? guild : guild.id
        return this.set(guildid, this.prefixKey, value)
    }
}
