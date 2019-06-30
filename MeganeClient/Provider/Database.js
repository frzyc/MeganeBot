const sqlite3 = process.env.NODE_ENV === "production" ? require("sqlite3") : require("sqlite3").verbose()
/**
 * A wrapper over the sqlite3.Database.
 */
module.exports = class Database {
    constructor(filename, mode, callback) {
        this.db = new sqlite3.Database(filename, mode, callback)
    }
    /**
     * Close the database.
     * @param {function} callback callback to be called when the databased is closed.
     */
    close(callback) {
        if (this.db) {
            this.db.serialize()
            this.db.close(callback)
        }
    }

    /**
     * @returns Promise that resolves to a boolean of whether a table of tableName exists in the database.
     * @param tableName The name of the table to check for.
     */
    tableExists(tableName) {
        return new Promise((resolve, reject) => {
            this.db.get("SELECT name FROM sqlite_master WHERE type='table' AND name=?;", tableName, (err, row) => {
                if (err) return reject(err)
                if (row) return resolve(row.name === tableName)
                resolve(false)
            })
        })
    }
}
