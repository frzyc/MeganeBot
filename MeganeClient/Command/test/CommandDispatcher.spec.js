const expect = require("chai").expect
const rimraf = require("rimraf")
const { CommandDispatcher, MeganeClient } = require("../../")

describe("CommandDispatcher tests", () => {
    let cmdDis
    before(() => {
        cmdDis = new CommandDispatcher({}, {})
        expect(cmdDis).to.exist
    })
    it(".preCheckmessage()", () => {
        let botMessage = {
            author: {
                bot: true
            }
        }
        let message = {
            content: "test",
            author: {
                bot: false
            }
        }
        let oldMessage = {
            content: "test",
            author: {
                bot: false
            }
        }
        expect(cmdDis.preCheckMessage(botMessage)).to.be.false
        expect(cmdDis.preCheckMessage(message)).to.be.true
        expect(cmdDis.preCheckMessage(message, oldMessage)).to.be.false
    })

    describe("CommandDispatcher tests using a mock client", () => {
        const client_user_id = "12345678"
        const clientOptions = {
            ownerids: "1234"
        }
        let client
        before(() => {
            rimraf(MeganeClient.DEFAULT_DB_PATH, (err) => {
                if (err) throw err
            })
            client = new MeganeClient(clientOptions)
            expect(client).to.exist
            client.user = {//used by .buildPattern()
                id: client_user_id
            }
        })

        after(async () => {
            expect(client).to.exist
            await client.destructor()
            // delete the database
            rimraf(MeganeClient.DEFAULT_DB_PATH, (err) => {
                if (err) throw err
            })
        })
        it("Tests client has dispatcher", () => {
            expect(client.dispatcher).to.exist
        })
        it(".buildPattern() with no prefix", async () => {
            let messageContent = `<@${client_user_id}> cmd 1 2`
            const pattern = await client.dispatcher.buildPattern({})
            expect(pattern).to.deep.eq(/(^<@!?12345678>\s*)([^\s]+)/i)
            let matches = pattern.exec(messageContent)
            let cmdstring = matches[2]
            let argString = messageContent.substring(matches[0].length)
            expect(cmdstring).to.eq("cmd")
            expect(argString).to.eq(" 1 2")

            messageContent = `<@${client_user_id}>cmd`
            matches = pattern.exec(messageContent)
            cmdstring = matches[2]
            argString = messageContent.substring(matches[0].length)
            expect(cmdstring).to.eq("cmd")
            expect(argString).to.eq("")

        })
        it(".buildPattern() with guild prefix", async () => {
            let messageContent = `<@${client_user_id}> cmd 1 2`
            let pattern = await client.dispatcher.buildPattern({
                guild: {
                    prefix: "!!!"
                }
            })
            expect(pattern).to.deep.eq(/^(!!!\s*|<@!?12345678>\s*(?:!!!)?)([^\s]+)/i)
            let matches = pattern.exec(messageContent)
            expect(matches[2]).to.eq("cmd")
            expect(messageContent.substring(matches[0].length)).to.eq(" 1 2")

            messageContent = `<@${client_user_id}>cmd`
            matches = pattern.exec(messageContent)
            expect(matches[2]).to.eq("cmd")
            expect(messageContent.substring(matches[0].length)).to.eq("")

            messageContent = "!!! cmd 1 2"
            matches = pattern.exec(messageContent)
            expect(matches[2]).to.eq("cmd")
            expect(messageContent.substring(matches[0].length)).to.eq(" 1 2")

            messageContent = "!!!cmd"
            matches = pattern.exec(messageContent)
            expect(matches[2]).to.eq("cmd")
            expect(messageContent.substring(matches[0].length)).to.eq("")

        })
        it("parseMessage()", async () => {
            //assumes that the depot has the "add" command. maybe change this to a mocked cmd?
            let message = {
                content: `<@${client_user_id}>add 1 2`
            }
            let cmdMsg = await client.dispatcher.parseMessage(message)
            expect(cmdMsg.command.name).to.eq("Add numbers")
            expect(cmdMsg.argString).to.eq(" 1 2")
        })
        it("parseMessage() nulls", async () => {
            let message = {
                content: `<@${client_user_id}>abcdefghiaasdkfl;a 1 2`
            }
            expect(await client.dispatcher.parseMessage(message)).to.be.null
            message.content = "sdfadfasdfasdfasdfa"
            expect(await client.dispatcher.parseMessage(message)).to.be.null
        })
        it("handleReaction()")
        it("handleResponse()")
        it("addPreprocess()")
        it("removePreprocess()")
        it("preprocess()")

    })

    describe("CommandDispatcher tests using a mock client", () => {
        const client_user_id = "12345678"
        const clientOptions = {
            ownerids: "1234"
        }
        let client
        before(() => {
            rimraf(MeganeClient.DEFAULT_DB_PATH, (err) => {
                if (err) throw err
            })
            client = new MeganeClient(clientOptions)
            expect(client).to.exist
            client.user = {//used by .buildPattern()
                id: client_user_id
            }
        })

        after(async () => {
            expect(client).to.exist
            await client.destructor()
            // delete the database
            rimraf(MeganeClient.DEFAULT_DB_PATH, (err) => {
                if (err) throw err
            })
        })
        it("Tests client has dispatcher", () => {
            expect(client.dispatcher).to.exist
        })
        it(".buildPattern() with no prefix", async () => {
            let messageContent = `<@${client_user_id}> cmd 1 2`
            const pattern = await client.dispatcher.buildPattern({})
            expect(pattern).to.deep.eq(/(^<@!?12345678>\s*)([^\s]+)/i)
            let matches = pattern.exec(messageContent)
            let cmdstring = matches[2]
            let argString = messageContent.substring(matches[0].length)
            expect(cmdstring).to.eq("cmd")
            expect(argString).to.eq(" 1 2")

            messageContent = `<@${client_user_id}>cmd`
            matches = pattern.exec(messageContent)
            cmdstring = matches[2]
            argString = messageContent.substring(matches[0].length)
            expect(cmdstring).to.eq("cmd")
            expect(argString).to.eq("")

        })
        it(".buildPattern() with guild prefix", async () => {
            let messageContent = `<@${client_user_id}> cmd 1 2`
            let pattern = await client.dispatcher.buildPattern({
                guild: {
                    prefix: "!!!"
                }
            })
            expect(pattern).to.deep.eq(/^(!!!\s*|<@!?12345678>\s*(?:!!!)?)([^\s]+)/i)
            let matches = pattern.exec(messageContent)
            expect(matches[2]).to.eq("cmd")
            expect(messageContent.substring(matches[0].length)).to.eq(" 1 2")

            messageContent = `<@${client_user_id}>cmd`
            matches = pattern.exec(messageContent)
            expect(matches[2]).to.eq("cmd")
            expect(messageContent.substring(matches[0].length)).to.eq("")

            messageContent = "!!! cmd 1 2"
            matches = pattern.exec(messageContent)
            expect(matches[2]).to.eq("cmd")
            expect(messageContent.substring(matches[0].length)).to.eq(" 1 2")

            messageContent = "!!!cmd"
            matches = pattern.exec(messageContent)
            expect(matches[2]).to.eq("cmd")
            expect(messageContent.substring(matches[0].length)).to.eq("")

        })
        it("parseMessage()", async () => {
            //assumes that the depot has the "add" command. maybe change this to a mocked cmd?
            let message = {
                content: `<@${client_user_id}>add 1 2`
            }
            let cmdMsg = await client.dispatcher.parseMessage(message)
            expect(cmdMsg.command.name).to.eq("Add numbers")
            expect(cmdMsg.argString).to.eq(" 1 2")
        })
        it("parseMessage() nulls", async () => {
            let message = {
                content: `<@${client_user_id}>abcdefghiaasdkfl;a 1 2`
            }
            expect(await client.dispatcher.parseMessage(message)).to.be.null
            message.content = "sdfadfasdfasdfasdfa"
            expect(await client.dispatcher.parseMessage(message)).to.be.null
        })
        it("handleReaction()")
        it("handleResponse()")
        it("addPreprocess()")
        it("removePreprocess()")
        it("preprocess()")

    })

})
