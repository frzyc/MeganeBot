const expect = require("chai").expect
const { Database, GuildTable } = require("../")
describe("Database Provider Tests", () => {
    it("Check in memory", () => {
        let db = new Database(":memory:", (err) => {
            if (err) {
                return console.error(err.message)
            }
        })
        expect(db).to.exist
        db.close()
    })
    it("Create a database", () => {
        let db = new Database("./data/testdb.db", (err) => {
            if (err) {
                return console.error(err.message)
            }
        })
        expect(db).to.exist
        db.close()
    })

    describe("Test tables", () => {
        let database
        before(() => {
            database = new Database("./data/testdb.db")
            expect(database).to.exist
            database.db.on("trace", (stment) => {
                //print out the executing statement from the database.
                // console.log(`\x1b[36m\n${stment}\n\x1b[0m`)//cyan
            })
        })
        describe("Test GuildTable", () => {
            let tableName = "test_guild_table"
            let table
            before(() => {
                table = new GuildTable(database.db, tableName)
            })
            it("Verify GuildTable creation", done => {
                database.db.get("SELECT name FROM sqlite_master WHERE type='table' AND name=?;", tableName, (err, row) => {
                    expect(err).to.be.null
                    expect(row.name).to.equal(tableName)
                    done()
                })
            })
            it("Add value and get value", done => {
                let prefix = "testval1"
                table.set("123", "command_prefix", prefix).then(() => {
                    table.get("123", "command_prefix").then(val => {
                        expect(val).to.equal(prefix)
                        done()
                    })
                })
            })
            it("change value that was set before", done => {
                let prefix = "testval2"
                table.set("123", "command_prefix", prefix).then(() => {
                    table.get("123", "command_prefix").then(val => {
                        expect(val).to.equal(prefix)
                        done()
                    })
                })
            })
            it("setPrefix and getPrefix", done => {
                let prefix = "testprefix"
                let guildid = "1234"
                table.setPrefix(guildid, prefix).then(() => {//use the string
                    table.getPrefix({ id: guildid }).then(val => {//use object
                        expect(val).to.equal(prefix)
                        done()
                    })
                })
            })
            after(() => {
                table.destroy()
                database.db.get("SELECT name FROM sqlite_master WHERE type='table' AND name=?;", tableName, (err, row) => {
                    expect(err).to.be.null
                    expect(row).to.be.undefined
                })
            })
        })
        after(() => {
            database.close()
        })
    })

})
