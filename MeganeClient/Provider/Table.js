const Database = require("./Database")
/**
 * A base class for a sqlite Table.
 * only has consideration for single primary key.
 * has functions to set/get a single value in row & column.
 * will try to cache values that has been gotten.
 */
module.exports = class Table {

    /**
     * @constructor
     * @param {Database|sqlite3.Database} db
     * @param {string} tableName
     */
    constructor(db, tableName) {
        if(db instanceof Database)
            db = db.db
        /**
         * The Database
         * @type {sqlite3.Database}
         * @readonly
         */
        Object.defineProperty(this, "db", { value: db })

        /**
         * The table name
         * @type {string}
         */
        this.tableName = tableName
        this.init()

        /**
         * @name primaryKey the unique primary key of the table
         * @type {string}
         */
        if (!this.primaryKey) throw Error("Should define primaryKey in the init() of the Table.")
    }

    /**
     * Initiate the table. will be called in the constructor.
     * Will need to set this.primaryKey to the primary column name.
     * Classes that extends this class will also have to consider possible upgrades here if they change the table schema.
     * @abstract
     */
    init() {
        throw new Error(`${this.construtor.name} does not have a init function.`)
    }

    /**
     * destory the table
     */
    destroy() {
        this.db.run(`DROP TABLE IF EXISTS ${this.tableName};`)
    }

    /**
     * Get a single value.
     * @param {string} rowval The value of the primary.
     * @param {string} column The column to get.
     */
    get(rowval, column) {
        return new Promise((resolve, reject) => {
            this.db.get(`SELECT ${column} FROM ${this.tableName} WHERE ${this.primaryKey} = ?`, rowval, (err, row) => {
                if (err) return reject(err)
                if (row && row[column]) resolve(row[column])
                else resolve(null)
            })
        })

    }

    /**
     * Set a single value in the table. Will pretty much do UPSERT if row exists without disturbing other values.
     * @param {*} row Value of the primary.
     * @param {string} column Name of the column.
     * @param {*} value The value to update.
     */
    set(row, column, value) {
        return new Promise((resolve, reject) => {
            this.db.run(
                `INSERT INTO ${this.tableName}(${this.primaryKey},${column})`
                + "VALUES(?, ?)"
                + `ON CONFLICT(${this.primaryKey}) DO UPDATE SET ${column} = ?;`,
                row, value, value, (err) => {
                    if (err) throw err
                    if (err) return reject(err)
                    resolve(value)
                }
            )
        })

    }

    /**
     * @returns Promise that resolves to a boolean of whether a table of this.tableName exists in the database.
     */
    tableExists() {
        return Promise((resolve, reject) => {
            this.db.get("SELECT name FROM sqlite_master WHERE type='table' AND name=?;", this.tableName, (err, row) => {
                if (err) return reject(err)
                resolve(row.name === this.tableName)
            })
        })
    }
}
