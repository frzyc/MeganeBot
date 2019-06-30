const expect = require("chai").expect
const rimraf = require("rimraf")
const { MeganeClient } = require("../../")
const { Guild } = require("discord.js")


describe("Check GuildExtensions", () => {
    /**
     * @type {Guild}
     */
    let guild
    /**
     * @type {MeganeClient}
     */
    let client
    before(() => {
        client = new MeganeClient({
            ownerids: "1"
        })
        expect(client).to.exist
        guild = new Guild(client, {
            id: "testguildid",
            unavailable: true
        })
        expect(guild).to.exist
    })
    it("Check for extension properties", () => {
        expect(Object.prototype.hasOwnProperty.call(Guild.prototype, "prefix")).to.be.true
        expect(Guild).to.respondTo("resolvePrefix")
    })

    it("Guild.prefix will use the default from client if resolve to undefined.", async ()=>{
        expect(await guild.resolvePrefix()).to.eq(client.DEFAULT_PREFIX)
    })
    it("Check setting the prefix",async ()=>{
        let pre = "test"
        guild.prefix = pre
        expect(guild.prefix).to.be.equal(pre)
        // wait for the value to be set before checking...
        await (new Promise(resolve => setTimeout(resolve, 200)))
        expect(await guild.resolvePrefix()).to.eq(pre)
        expect(await client.guildTable.getPrefix(guild)).to.eq(pre)
    })

    after(async () => {
        expect(client).to.exist
        await client.destructor()
        // delete the database
        rimraf(client.DEFAULT_DB_PATH, (err) => {
            if (err) throw err
        })
    })


})
