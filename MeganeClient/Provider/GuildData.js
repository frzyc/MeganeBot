const { Guild } = require('discord.js');
const ProviderBase = require('./ProviderBase');
/**
 * A class to deal general guild data: data that is not updated very often, and can be grouped into a general object. 
 * It will be converted into a JSON and stored as a string in a single column in a table.
 * setting is expensive, but getting is relatively cheap, since the object is cached here.
 * For values that are updated often, use GuildSpecificData.
 */
module.exports = class GuildData extends ProviderBase {
    /**
     * @param {SqliteDatabase} db
     */
    constructor(db) {
        super();
        this.db = db;
        Object.defineProperty(this, 'client', { value: null, writable: true });
        this.data = new Map();
        this.listeners = new Map();
        this.changeStatement = null;
    }
    async init(client) {
        this.client = client;

        //init a table
        await this.db.run('CREATE TABLE IF NOT EXISTS guild (guildid INTEGER PRIMARY KEY, data TEXT)');

        // Load all data
        const rows = await this.db.all('SELECT CAST(guildid as TEXT) as guildid, data FROM guild');
        for (const row of rows) {
            let data;
            try {
                data = JSON.parse(row.data);
            } catch (err) {
                client.emit('warn', `SQLiteProvider couldn't parse the data stored for guild ${row.guildid}.`);
                continue;
            }
            //use the id 0 as the global setting
            const guildid = row.guildid !== '0' ? row.guildid : 'global';
            this.data.set(guildid, data);
            if (guildid !== 'global' && !client.guilds.has(row.guildid)) continue;
            this.setupGuild(guildid, data);
        }

        // Prepare statements
        const statements = await Promise.all([
            this.db.prepare('INSERT OR REPLACE INTO guild(guildid,data) VALUES(?, ?)')
        ]);
        this.changeStatement = statements[0];

        this.listeners
            .set('guildPrefixChange', (guild, prefix) => this.set(guild, 'prefix', prefix ? prefix : null))
        for (const [event, listener] of this.listeners) client.on(event, listener);
    }
    async destroy() {
        // Finalise prepared statements
        await Promise.all([
            this.changeStatement.finalize()
        ]);

        // Remove all listeners from the client
        for (const [event, listener] of this.listeners) this.client.removeListener(event, listener);
        this.listeners.clear();
    }
    get(guild, key, defVal) {
        const data = this.data.get(this.constructor.getGuildID(guild));
        return data ? (typeof data[key] !== 'undefined' ? data[key] : defVal) : defVal;
    }
    async set(guild, key, val) {
        let guildid = this.constructor.getGuildID(guild);
        let data = this.data.get(guildid);
        if (!data) {
            this.data.set(guildid, {});
            data = this.data.get(guildid);
        }

        data[key] = val;
        await this.changeStatement.run(guildid !== 'global' ? guildid : 0, JSON.stringify(data));
    }
    /**
     * 
     * @param {Guild} guild 
     * @param {string} key 
     */
    async remove(guild, key) {
        let guildid = this.constructor.getGuildID(guild);
        const data = this.data.get(guildid);
        if (!data || typeof data[key] === 'undefined') return undefined;

        const val = data[key];
        data[key] = undefined;
        await this.changeStatement.run(guildid !== 'global' ? guildid : 0, JSON.stringify(data));
        return val;
    }
    /**
     * 
     * @param {Guild} guild 
     */
    async clear(guild) {
        guild = this.constructor.getGuildID(guild);
        if (!this.data.has(guild)) return;
        this.data.delete(guild);
        await this.changeStatement.run(guildid !== 'global' ? guildid : 0, JSON.stringify(null));
    }
    /**
	 * Obtains the ID of the provided guild, or throws an error if it isn't valid
	 * @param {Guild|string} guild - Guild to get the ID of
	 * @return {string} ID of the guild, or 'global'
	 */
    static getGuildID(guild) {
        if (guild instanceof Guild) return guild.id;
        if (guild === 'global' || guild === null) return 'global';
        if (typeof guild === 'string' && !isNaN(guild)) return guild;
        throw new TypeError('Invalid guild specified. Must be a Guild instance, guild ID, "global", or null.');
    }
    setupGuild(guildid, data) {
        let guild = this.client.guilds.get(guildid) || null;
        guild.prefix = data.prefix;
    }

}
