const { Guild } = require('discord.js');
const ColumnBase = require('./ColumnBase');
/**
 * A class to deal general data: data that is not updated very often, and can be grouped into a general object. 
 * It will be converted into a JSON and stored as a string in a single column in a table.
 * setting is expensive, but getting is relatively cheap, since the object is cached here.
 * For values that are updated often, use SpecificDataColumn.
 */
class GeneralDataColumn extends ColumnBase {
    constructor(table, columnName) {
        super(table, columnName);
        this.data = new Map();
        this.changeStatement = null;
    }
    async init() {
        //add a column to the table.
        try {
            await this.db.run(`ALTER TABLE ${this.table.tableName} ADD ${this.columnName} TEXT`);
        } catch (err) {
            console.log(err);
        }
        // Prepare statements
        const statements = await Promise.all([
            this.db.prepare(`INSERT OR REPLACE INTO ${this.table.tableName}(${this.table.primaryKey},${this.columnName}) VALUES(?, ?)`)
        ]);
        this.changeStatement = statements[0];
    }
    async destroy() {
        // Finalise prepared statements
        await Promise.all([
            this.changeStatement.finalize()
        ]);
    }
    get(dbPrimaryKey, dataKey, defVal) {
        const data = this.data.get(dbPrimaryKey);
        return data ? (typeof data[dataKey] !== 'undefined' ? data[dataKey] : defVal) : defVal;
        //TODO when !data, try to get it from database
    }
    async set(dbPrimaryKey, dataKey, val) {
        let data = this.data.get(dbPrimaryKey);
        if (!data) {//create a new data entry for the dbPrimaryKey if not exist.
            this.data.set(dbPrimaryKey, {});
            data = this.data.get(dbPrimaryKey);
        }
        let prev = data[dataKey]
        data[dataKey] = val;
        if (prev !== val)
            await this.changeStatement.run(dbPrimaryKey, JSON.stringify(data));
    }
    async remove(dbPrimaryKey, dataKey) {
        const data = this.data.get(dbPrimaryKey);
        if (!data || typeof data[dataKey] === 'undefined') return undefined;

        const val = data[dataKey];
        data[dataKey] = undefined;
        await this.changeStatement.run(dbPrimaryKey, JSON.stringify(data));
        return val;
    }
    async clear(dbPrimaryKey) {
        if (!this.data.has(dbPrimaryKey)) return;
        this.data.delete(dbPrimaryKey);
        await this.changeStatement.run(dbPrimaryKey, JSON.stringify(null));
    }
}
module.exports = GeneralDataColumn;