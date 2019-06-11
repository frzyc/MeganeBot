const expect = require("chai").expect
const discord = require("discord.js")
const MeganeClient = require("../").MeganeClient

describe("Check the client", () => {
    var client
    before(() => {
        client = new MeganeClient({
            ownerids: "1"
        })
    })
    it("Check MeganeClient extends discord.Client", () => {
        expect(client).to.be.instanceOf(discord.Client)
    })
    describe("Check client's owner", () => {
        before(() => {
            //set owner to be "1"
            client.options.owner = new Set(["1", "2", "3", "3"])
            client.users = new Map()
            client.users.set("1", { id: "1" })
            client.users.set("2", { id: "2" })
            client.users.set("3", { id: "3" })
            client.users.set("4", { id: "4" })
            client.users.set("5", { id: "5" })
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

    describe("prefix", () => {
        it("global should be null", () => {
            expect(client.prefix).to.be.null
        })
        it("set prefix", () => {
            let pre = "!!!"
            client.prefix = pre
            expect(client.prefix).to.be.equal(pre)
        })
    })


})