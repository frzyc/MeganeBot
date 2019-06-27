const expect = require("chai").expect
const { Database, Table, GuildTable } = require("../")
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
        /**
         * @type {Database}
         */
        let database
        before(() => {
            database = new Database("./data/testdb.db")
            expect(database).to.exist
            // database.db.on("trace", (stment) => {
            //     //print out the executing statement from the database.
            //     console.log(`\x1b[36m\n${stment}\n\x1b[0m`)//cyan
            // })
        })
        describe("Test Table", () => {
            let table
            let tableName = "testtable"
            let col1 = "col_1"
            let col2 = "col_2"
            class testTable extends Table {
                constructor(db, tableName) {
                    super(db, tableName)
                }
                /**
                 * Create the testTable, and assign the primaryKey.
                 * @override
                 */
                init() {
                    this.primaryKey = "id"
                    //create the new table here
                    this.db.serialize()
                    this.db.run(`CREATE TABLE IF NOT EXISTS ${this.tableName}(
                        ${this.primaryKey} INTEGER PRIMARY KEY,
                        ${col1} TEXT,
                        ${col2} INTEGER
                        );
                    `)
                    this.db.parallelize()
                }
            }
            before(async () => {
                table = new testTable(database.db, tableName)
                expect(table).to.exist
                expect(await table.tableExists()).to.be.true
            })

            it("Add value and get value", async () => {
                let id = 100
                let value = "testval"
                await table.set(id, col1, value)
                expect(await table.get(id, col1)).to.equal(value)
            })

            it("change value that was set before", async () => {
                let id = 101
                let value = "testval1"
                let newvalue = "testval2" //different value
                let rowid = await table.set(id, col1, value)
                expect(rowid).to.eq(id)
                let newrowid = await table.set(id, col1, newvalue)
                expect(newrowid).to.equal(rowid)
                expect(await table.get(id, col1)).to.equal(newvalue)
            })

            it("Set a INTEGER value", async () => {
                let id = 102
                let value = 123456789
                await table.set(id, col2, value)
                expect(await table.get(id, col2)).to.equal(value)
            })

            it("Get a value that doesn't exist", async () => {
                let invalid_id = 1234
                expect(await table.get(invalid_id, col1)).to.be.null
            })

            after(async () => {
                await table.destroy()
                expect(await database.tableExists(tableName)).to.be.false
            })
        })
        describe("Test GuildTable", () => {
            let tableName = "test_guild_table"
            let table
            before(async () => {
                table = new GuildTable(database.db, tableName)
                expect(table).to.exist
            })
            it("Verify GuildTable creation", async () => {
                expect(await table.tableExists()).to.be.true
            })
            it("setPrefix and getPrefix", async () => {
                let prefix = "testprefix"
                let guildid = "1234"
                await table.setPrefix(guildid, prefix) //use string
                expect(await table.getPrefix({ id: guildid })).to.equal(prefix) //use object
            })
            it("Set empty prefix", async () => {
                let prefix = ""
                let guildid = "12345"
                await table.setPrefix(guildid, prefix) //use string
                expect(await table.getPrefix({ id: guildid })).to.equal(prefix) //use object
            })
            after(async () => {
                table.destroy()
                expect(await database.tableExists(tableName)).to.be.false
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
