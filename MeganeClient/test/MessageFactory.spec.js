const expect = require("chai").expect
const { MessageFactory } = require("../")
const { Message, Channel } = require("discord.js")
describe("Test stuff with schema", () => {
    let schema
    before(() => {
        schema = MessageFactory.MessageResolvableSchema
        expect(schema).to.exist
    })
    describe(".destination", () => {
        it(".destination is either Message or a Channel", () => {
            let r = schema.validate({
                destination: new Error(),
            })
            expect(r.error).to.exist
        })
        it("convert .destination to .destMessage or .destChannel", () => {
            let r = schema.validate({
                destination: new Message(),
            })
            expect(r.value.destMessage).to.exist

            r = schema.validate({
                destination: new Channel(),
            })
            expect(r.value.destChannel).to.exist
        })
        it("if .destination is a Channel, no .destinationDeleteTime, no .edit, no .reply", () => {
            let r = schema.validate({
                destination: new Channel(),
                destinationDeleteTime: 2
            })
            expect(r.error).to.exist
            r = schema.validate({
                destination: new Channel(),
                edit: true
            })
            expect(r.error).to.exist
            r = schema.validate({
                destination: new Channel(),
                reply: true
            })
            expect(r.error).to.exist
        })
    })
    it(".edit and .reply cant be true at the same time.", () => {
        let r = schema.validate({
            destination: new Channel(),
            edit: true,
            reply: true,
        })
        expect(r.error).to.exist
    })
    it("Can't .reply when .destination is a Channel", () => {
        let r = schema.validate({
            destination: new Channel(),
            reply: true,
        })
        expect(r.error).to.exist
    })
    it("Can't set .destinationDeleteTime when its an .edit", () => {
        let r = schema.validate({
            destination: new Message(),
            edit: true,
            destinationDeleteTime: 2
        })
        expect(r.error).to.exist
    })

    it("if .typing then either .messageContent or .messageOptions must be set.", () => {
        let r = schema.validate({
            destination: new Message(),
            typing: true,
        })
        expect(r.error).to.exist
    })
    it("zero .destinationDeleteTime", () => {
        let r = schema.validate({
            destination: new Message(),
            destinationDeleteTime: 0,
        })
        expect(r.error).to.be.null
    })
})
