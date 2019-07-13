const MongoClient = require('mongodb').MongoClient;
/**
 * Wrapper over the mongodb client
 */
module.exports = class Database {
  static url = 'mongodb://localhost:27017';
  static dbName = 'MeganeDB';
  constructor() {
    this.client = new MongoClient(Database.url, { useNewUrlParser: true, useUnifiedTopology: true });
  }
  /**
   * connect and create a db
   */
  async init() {
    await this.client.connect()
    this.db = this.client.db(Database.dbName)
    return this.db
  }
  dropDatabase(){
    return this.db.dropDatabase()
  }
  close() {
    return this.client.close()
  }
}
