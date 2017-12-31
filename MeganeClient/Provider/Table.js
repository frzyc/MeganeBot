/**
 * A class for a sqlite Table.
 */
class Table{
    /**
     * @constructor
     * @param {MeganeClient} client 
     * @param {string} db 
     * @param {string} tableName 
     * @param {string} primaryKey 
     * @param {string} type 
     */
    constructor(client, db, tableName, primaryKey, type){

        /**
         * A reference to the MeganeClient.
         * @name CommandMessage#client
         * @type {MeganeClient}
         * @readonly
         */
        Object.defineProperty(this, 'client', { value: client});
        
        /**
         * The database .
         * @type {SqliteDatabase}
         */
        this.db = db;

        /**
         * The table name
         * @type {string}
         */
        this.tableName = tableName;
        
        /**
         * The primary key of the table.
         * @type {string}
         */
        this.primaryKey = primaryKey;

        /**
         * The primary key type of the table.
         * @type {string}
         */
        this.primaryType = type;

        /**
         * Whether if this Table is initiated.
         * @type {boolean}
         */
        this.initiated = false;
    }

    /**
     * Initialize the Table, assuming the database is legit.
     */
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
module.exports = Table;