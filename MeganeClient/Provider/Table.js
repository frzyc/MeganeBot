/**
 * A class for a table
 */
module.exports = class Table{
    constructor(client, db, tableName, primaryKey, type){
        Object.defineProperty(this, 'client', { value: client});
        this.db = db;
        this.tableName = tableName;
        this.primaryKey = primaryKey;
        this.primaryType = type;
        this.initiated = false;
    }
    async init(){
        await this.db;
        await this.db.run(`CREATE TABLE IF NOT EXISTS ${this.tableName} (${this.primaryKey} ${this.primaryType} PRIMARY KEY)`);
        this.initiated = true;
        return this;
    }
    async destroy(){
        await this.db.run(`DROP TABLE IF EXISTS ${this.tableName}`);
        this.initiated = false;
    }
}