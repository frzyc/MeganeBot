const sqlite3 = require("sqlite3").verbose()//TODO no verbose in production
module.exports = class Database {
    constructor(filename, mode, callback) {
        this.db = new sqlite3.Database(filename, mode, callback)
    }
    /**
     * Close the database.
     */
    close() {
        if (this.db){
            this.db.serialize()
            this.db.close()
        } 
    }
}
