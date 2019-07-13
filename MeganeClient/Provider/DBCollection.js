module.exports = class DBCollection {

  /**
     * @constructor
     * @param {Database} db
     * @param {string} tableName
     */
  constructor(db, collectionName) {
    Object.defineProperty(this, "db", { value: db })
    this.collection = db.db.collection(collectionName)
  }
  drop(){
    return this.collection.drop()
  }
}
