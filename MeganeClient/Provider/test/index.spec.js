const expect = require("chai").expect
const { Database, GuildTable } = require("../")
const fs = require("fs")
const rimraf = require("rimraf")
describe("Database Provider Tests", () => {
    before(done => {
        fs.mkdir("./data", { recursive: true }, (err) => {
            if (err) throw err
            done()
        })
    })
    it("Check in memory", () => {
        let db = new Database(":memory:", (err) => {
            if (err) throw err
        })
        expect(db).to.exist
        db.close()
    })
    it("Create a database", () => {
        let db = new Database("./data/testdb.db", (err) => {
            if (err) throw err
        })
        expect(db).to.exist
        db.close()
    })

    describe("Test tables", () => {
        let database
        before(() => {
            database = new Database("./data/testdb.db")
            expect(database).to.exist
            // database.db.on("trace", (stment) => {
            //     //print out the executing statement from the database.
            //     console.log(`\x1b[36m\n${stment}\n\x1b[0m`)//cyan
            // })
        })
        describe("Test GuildTable", () => {
            let tableName = "test_guild_table"
            let table
            before(() => {
                table = new GuildTable(database.db, tableName)
            })
            let columnName = "command_prefix"
            it("Verify GuildTable creation", done => {
                database.db.get("SELECT name FROM sqlite_master WHERE type='table' AND name=?;", tableName, (err, row) => {
                    expect(err).to.be.null
                    expect(row.name).to.equal(tableName)
                    done()
                })
            })
            it("Add value and get value", async () => {
                let prefix = "testval1"
                await table.set("123", columnName, prefix)
                expect(await table.get("123", columnName)).to.equal(prefix)
            })
            it("change value that was set before", async () => {
                let prefix = "testval2" //different prefix
                await table.set("123", columnName, prefix)
                expect(await table.get("123", columnName)).to.equal(prefix)
            })
            it("get value that doesn't exist", async () => {
                expect(await table.get("invalid_id", columnName)).to.be.null
            })
            it("setPrefix and getPrefix", async () => {
                let prefix = "testprefix"
                let guildid = "1234"
                await table.setPrefix(guildid, prefix) //use string
                expect(await table.getPrefix({ id: guildid })).to.equal(prefix) //use object
            })
            after(done => {
                table.destroy()
                database.db.get("SELECT name FROM sqlite_master WHERE type='table' AND name=?;", tableName, (err, row) => {
                    expect(err).to.be.null
                    expect(row).to.be.undefined
                    done()
                })
            })
        })
        after(() => {
            expect(database).to.exist
            database.close()
        })
    })
    after(done => {
        rimraf("./data", (err) => {
            if (err) throw err
            done()
        })
    })
})
