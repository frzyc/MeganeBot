const expect = require("chai").expect
const { Database, DBCollection, GuildDBCollection } = require("../")
describe("Database Provider Tests", () => {
  let database, db
  before(async () => {
    database = new Database()
    db = await database.init()
    expect(db).to.exist
    await database.dropDatabase()
  })
  after(() => {
    database.close()
  })
  describe("Collection", () => {
    let collection
    before("Create DBCollection", () => {
      collection = new DBCollection(database, "testcollection")
    })
    it("collection", () => {
      expect(collection).to.exist
    })
  })

  describe("GuildDBCollection", () => {
    /**
     * @typedef {GuildDBCollection}
     */
    let gcollection
    before("Create Guild Collection", () => {
      gcollection = new GuildDBCollection(database)
    })
    it("set and get prefix", async () => {
      let guildid = "testguild"
      let prefix = "!test!"
      //should have no prefix
      let noPrefix = await gcollection.getPrefix(guildid)
      expect(noPrefix).to.not.exist

      //set prefix
      let setRes = await gcollection.setPrefix(guildid, prefix)
      expect(setRes.result.ok).to.eq(1)
      let onePrefix = await gcollection.getPrefix(guildid)
      expect(onePrefix).to.eq(prefix)

      //"" prefix
      await gcollection.setPrefix(guildid, "")
      expect(setRes.result.ok).to.eq(1)
      let emptyprefix = await gcollection.getPrefix(guildid)
      expect(emptyprefix).to.eq("")

      //null prefix
      await gcollection.setPrefix(guildid, undefined)
      expect(setRes.result.ok).to.eq(1)
      let shouldbenullprefix = await gcollection.getPrefix(guildid)
      expect(shouldbenullprefix).to.not.exist

    })
  })

})
