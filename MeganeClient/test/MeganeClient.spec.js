const expect = require("chai").expect
const discord = require("discord.js")
const { MeganeClient } = require("../")

describe("MeganeClient tests", () => {
  /**
     * @type {MeganeClient}
     */
  let client
  before(async () => {
    client = new MeganeClient({
      ownerids: "1"
    })
    client.users = new Map([["1", { id: "1" }]])
    await client.init
    client.db.dropDatabase()
    expect(client.isOwner("1")).to.be.true
    expect(client).to.exist
  })

  after(async () => {
    expect(client).to.exist
    client.db.dropDatabase()
    await client.destructor()
  })
    
  it("Check MeganeClient extends discord.Client", () => {
    expect(client).to.be.instanceOf(discord.Client)
  })
  describe("Check client's owner", () => {
    before(() => {
      //set owner to be "1"
      client.options.owner = new Set(["1", "2", "3", "3"])
      client.users = new Map([
        ["1", { id: "1" }],
        ["2", { id: "2" }],
        ["3", { id: "3" }],
        ["4", { id: "4" }],
        ["5", { id: "5" }]
      ])
      expect(client.users.size).to.equal(5)
    })
    it("check user size", () => {
      expect(client.owners).to.have.lengthOf(3)
    })
    it("Check owner null param", () => {
      expect(() => {
        client.isOwner({})
      }).to.throw(TypeError)
    })
    it("Check rightful owner", () => {
      expect(client.isOwner("1")).to.be.true
      expect(client.isOwner("5")).to.be.false
      expect(() => {
        client.isOwner("6")
      }).to.throw(RangeError)
    })
    it("Check null owners", () => {
      client.options.owner = null
      expect(client.isOwner("1")).to.be.false
    })
    after(() => {
      client.options.owner = new Set(["1", "2", "3", "3"])
    })
  })

  describe("Client Global prefix", () => {
    it("Check default global prefix", async () => {
      expect(client.prefix).to.eq(MeganeClient.DEFAULT_PREFIX)
    })
    it("set global prefix", async () => {
      let pre = "!!!"
      client.prefix = pre
      expect(client.prefix).to.be.equal(pre)
      // wait for the value to be set before checking...
      await client.setprefix
      expect(await client.guildDBCollection.getPrefix("0")).to.eq(pre)
    })
    it("set prefix to an empty string", async () => {
      let pre = ""
      client.prefix = pre
      expect(client.prefix).to.be.equal(pre)
      // wait for the value to be set before checking...
      await client.setprefix
      expect(await client.guildDBCollection.getPrefix("0")).to.eq(pre)
    })
  })
})
