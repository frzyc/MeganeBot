const { Guild } = require('discord.js');
const GeneralDataColumn = require('./GeneralDataColumn');
/**
 * A class to deal general guild data.
 */
module.exports = class GuildData extends GeneralDataColumn {
<<<<<<< HEAD
    constructor(table, columnName) {
        super(table, columnName);
=======
    constructor(table,columnName) {
        super(table,columnName);
>>>>>>> origin/master
        this.listeners = new Map();
    }
    async init() {
        super.init();

        // Load all data
        const rows = await this.db.all(`SELECT CAST(${this.table.primaryKey} as TEXT) as ${this.table.primaryKey}, ${this.columnName} FROM ${this.table.tableName}`);
        for (const row of rows) {
            let data;
            try {
<<<<<<< HEAD
                if (!row.data || row.data === 'null' || row.data === 'undefined') continue;
=======
                if(!row.data ||row.data ==='null' || row.data ==='undefined') continue;
>>>>>>> origin/master
                data = JSON.parse(row.data);
            } catch (err) {
                this.client.emit('warn', `GuildData couldn't parse the data stored for guild ${row.guildid}.`);
                continue;
            }
            //use the id 0 as the global setting
            const guildid = row[this.table.primaryKey] !== '0' ? row[this.table.primaryKey] : 'global';
            this.data.set(guildid, data);
            if (guildid !== 'global' && !this.client.guilds.has(guildid)) continue;
<<<<<<< HEAD
            else if(guildid === 'global'){
                this.client.prefix = data.prefix;
            }
=======
>>>>>>> origin/master
            this.setupGuild(guildid, data);
        }

        this.listeners
<<<<<<< HEAD
            .set('CommandPrefixChange', (guild, prefix) => this.set(guild, 'prefix', prefix ? prefix : null))
            .set('CommandEnabledChange', (command, enabled) => this.set(guild, `cmd-enabled-${command.id}`, enabled))
=======
            .set('guildPrefixChange', (guild, prefix) => this.set(guild, 'prefix', prefix ? prefix : null))
>>>>>>> origin/master
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
     * @param {string} key 
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
        let guild = this.client.guilds.get(guildid) || null;
        guild.prefix = data.prefix;//set the prefix for the guild from the data created from db. Even if it is null/undefined
    }

}
