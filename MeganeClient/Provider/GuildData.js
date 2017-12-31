const { Guild } = require('discord.js');
const GeneralDataColumn = require('./GeneralDataColumn');
/**
 * A class to deal with general guild data.
 */
class GuildData extends GeneralDataColumn {
    constructor(table, columnName) {
        super(table, columnName);
        this.listeners = new Map();
    }
    async init() {
        super.init();

        // Load all data TODO load only global, and load guild data as megane join more guilds?
        const rows = await this.db.all(`SELECT CAST(${this.table.primaryKey} as TEXT) as ${this.table.primaryKey}, ${this.columnName} FROM ${this.table.tableName}`);
        for (const row of rows) {
            let data = row[this.columnName];
            try {
                if (!data || data === 'null' || data === 'undefined') continue;
                data = JSON.parse(data);
            } catch (err) {
                this.client.emit('warn', `GuildData couldn't parse the data stored for guild ${row.guildid}.`);
                continue;
            }
            //use the id 0 as the global setting
            const guildid = row[this.table.primaryKey] !== '0' ? row[this.table.primaryKey] : 'global';
            this.data.set(guildid, data);
            if (guildid !== 'global')
                this.setupGuild(guildid, data);
            else if (guildid === 'global') {
                this.client.prefix = data.prefix;
            }
        }

        this.listeners
            .set('CommandPrefixChange', (guild, prefix) => this.set(guild, 'prefix', prefix ? prefix : null))
        for (const [event, listener] of this.listeners) this.client.on(event, listener);
    }
    async destroy() {
        super.destroy();
        // Remove all listeners from the client
        for (const [event, listener] of this.listeners) this.client.removeListener(event, listener);
        this.listeners.clear();
    }
    get(guild, dataKey, defVal) {
        let guildid = this.constructor.getGuildID(guild);
        return super.get(guildid, dataKey, defVal);
    }
    async set(guild, dataKey, val) {
        let guildid = this.constructor.getGuildID(guild);
        super.set(guildid, dataKey, val);
    }
    /**
     * 
     * @param {Guild} guild 
     * @param {string} dataKey 
     */
    async remove(guild, dataKey) {
        let guildid = this.constructor.getGuildID(guild);
        return super.remove(guildid, dataKey);
    }
    /**
     * 
     * @param {Guild} guild 
     */
    async clear(guild) {
        let guildid = this.constructor.getGuildID(guild);
        super.clear(guildid);
    }
    /**
	 * Obtains the ID of the provided guild, or throws an error if it isn't valid
	 * @param {Guild|string} guild - Guild to get the ID of
	 * @return {string} ID of the guild, or 'global'
	 */
    static getGuildID(guild) {
        if (guild instanceof Guild) return guild.id;
        if (guild === 'global' || guild === null) return '0';
        if (typeof guild === 'string' && !isNaN(guild)) return guild;
        throw new TypeError('Invalid guild specified. Must be a Guild instance, guild ID, "global", or null.');
    }
    setupGuild(guildid, data) {
        let guild = this.client.guilds.get(guildid);
        if (!guild) {
            this.client.emit("warn", `Cannot find the guild from database: ${guildid}`);
            return;
        }
        guild.prefix = data.prefix;//set the prefix for the guild from the data created from db. Even if it is null/undefined
    }

}
module.exports = GuildData;