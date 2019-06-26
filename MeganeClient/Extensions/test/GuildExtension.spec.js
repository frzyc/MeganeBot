const expect = require("chai").expect
require("../GuildExtension")
const { Guild } = require("discord.js")
const { MeganeClient } = require("../../")
const rimraf = require("rimraf")
const fs = require("fs")

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
        fs.mkdir("./data", { recursive: true }, (err) => {
            if (err) throw err
        })
        client = new MeganeClient({
            ownerids: "1"
        })
        expect(client).to.exist
        guild = new Guild({ prefix: "clientprefix" }, {
            id: "testguildid",
            unavailable: true
        })
        expect(guild).to.exist
    })
    it("Check for Extension Functions",()=>{
        // expect(Object.prototype.hasOwnProperty.call(guild, "prefix")).to.be.true
        // expect(Object.prototype.hasOwnProperty.call(guild, "resolvePrefix")).to.be.true
    })

    after(() => {
        expect(client).to.exist
        client.destructor()
        // delete the database
        rimraf(client.DEFAULT_DB_PATH, (err) => {
            if (err) throw err
        })
    })


})