/**
 * A base class for a column-based storage class.
 */
class ColumnBase {
    /**
     * @constructor
     * @param {Table} table 
     * @param {string} columnName 
     */
    constructor(table, columnName) {

        /**
         * A reference to the MeganeClient.
         * @name CommandMessage#client
         * @type {MeganeClient}
         * @readonly
         */
        Object.defineProperty(this, 'client', { value: table.client });

        /**
         * A reference to the table Object.
         * @type {Table}
         */
        this.table = table;

        /**
         * The column name.
         * @type {string}
         */
        this.columnName = columnName;

        /**
         * A reference to the sqlite database
         * @type {sqliteDatabase}
         */
        this.db = table.db;
    }
    /**
     * initilize the column.
     * @param {MeganeClient} client 
     */
    init(client) {
        throw new Error(`${this.construtor.name} does not have a init function.`);
    }
    destroy(client) {
        throw new Error(`${this.construtor.name} does not have a destroy function.`);
    }
    get(id, key, defVal) {
        throw new Error(`${this.construtor.name} does not have a get function.`);
    }
    set(id, key, defVal) {
        throw new Error(`${this.construtor.name} does not have a set function.`);
    }
}
module.exports = ColumnBase;