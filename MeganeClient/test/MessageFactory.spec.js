const expect = require("chai").expect
const joi = require("@hapi/joi")
const sinon = require("sinon")
const { MessageFactory } = require("../")
const { Message, TextChannel } = require("discord.js")

describe("MessageFactory tests", () => {
  describe("Test stuff with schema", () => {
    const schema = MessageFactory.messageResolvableSchema
    before(() => {
      expect(schema).to.exist
    })
    describe(".destination", () => {
      it("must have either .destMessage or .destChannel", () => {
        expect(() => {
          joi.assert({}, schema)
        }).to.throw("Must define one of: .destination, .destMessage or .destChannel")
      })
      it(".destination is either Message or a TextBasedChannel", () => {
        expect(() => {
          joi.assert({
            destination: new Error(),
          }, schema)
        }).to.throw("destination")
      })
      it("convert .destination to .destMessage or .destChannel", () => {
        let r = schema.validate({
          destination: new Message(),
        })
        expect(r.value.destMessage).to.exist
        expect(r.value.destination).to.be.undefined
        r = schema.validate({
          destination: new TextChannel({}),
        })
        expect(r.value.destChannel).to.exist
      })
      it("if .destination is a Channel, no .destinationDeleteTime, no .edit, no .reply", () => {
        let r = schema.validate({
          destination: new TextChannel({}),
          destinationDeleteTime: 2
        })
        expect(r.error).to.exist
        r = schema.validate({
          destination: new TextChannel({}),
          edit: true
        })
        expect(r.error).to.exist
        r = schema.validate({
          destination: new TextChannel({}),
          reply: true
        })
        expect(r.error).to.exist
      })
    })
    it(".edit and .reply cant be true at the same time.", () => {
      let r = schema.validate({
        destination: new TextChannel({}),
        edit: true,
        reply: true,
      })
      expect(r.error).to.exist
    })
    it("Can't .reply when .destination is a Channel", () => {
      expect(schema.validate({
        destination: new TextChannel({}),
        reply: true,
      }).error).to.exist
    })
    it("Can't set .destinationDeleteTime when its an .edit", () => {
      expect(schema.validate({
        destination: new Message(),
        edit: true,
        destinationDeleteTime: 2
      }).error).to.exist
    })

    it("if .typing then either .messageContent or .messageOptions must be set.", () => {
      expect(schema.validate({
        destination: new Message(),
        typing: true,
      }).error).to.exist
    })
    it("nonzero .deleteTime", () => {
      expect(() => {
        joi.assert({
          destination: new Message(),
          deleteTime: 0
        }, schema)
      }).to.throw("\"deleteTime\" must be a positive number")
    })
    it("zero .destinationDeleteTime", () => {
      joi.assert({
        destination: new Message(),
        destinationDeleteTime: 0,
      }, schema)
    })
  })
  describe("Test MessageFactory with mock", () => {
    const destMsg = new Message({})
    destMsg.channel = new TextChannel({})
    const destChannel = new TextChannel({})
    beforeEach("stubbing destMsg and destChannel", () => {
      sinon.stub(destMsg.channel, "send")
      sinon.stub(destMsg, "reply")
      sinon.stub(destMsg, "edit")
      sinon.stub(destMsg, "editable").get(() => {
        return true
      })
      sinon.stub(destMsg, "delete").returns(Promise.resolve())
      sinon.stub(destMsg, "deletable").get(() => {
        return true
      })
      sinon.stub(destChannel, "send")
      sinon.stub(destChannel, "startTyping")
      sinon.stub(destChannel, "stopTyping")
    })
    afterEach("restore stubbed destMsg and destChannel", () => {
      sinon.restore()
    })
    describe("test sendMessage()", () => {
      it("Message", () => {
        new MessageFactory({}, {
          destination: destMsg
        }).sendMessage()
        expect(destMsg.channel.send.calledOnce).to.be.true
      })
      it("Message edit", () => {
        new MessageFactory({}, {
          destination: destMsg,
          edit: true
        }).sendMessage()
        expect(destMsg.edit.calledOnce).to.be.true
      })
      it("Message reply", () => {
        new MessageFactory({}, {
          destination: destMsg,
          reply: true
        }).sendMessage()
        expect(destMsg.reply.calledOnce).to.be.true
      })
      it("TextChannel", () => {
        new MessageFactory({}, {
          destination: destChannel
        }).sendMessage()
        expect(destChannel.send.calledOnce).to.be.true
      })
    })
    describe("simulateTyping", () => {
      it("test typeInChannel()", async () => {
        await MessageFactory.typeInChannel(destChannel)
        expect(destChannel.startTyping.calledOnce).to.be.true
        expect(destChannel.stopTyping.calledOnce).to.be.true
        expect(destChannel.startTyping.calledBefore(destChannel.stopTyping)).to.be.true
      })
      describe("test simulateTyping", () => {
        beforeEach(() => {
          sinon.stub(MessageFactory, "typeInChannel")
        })
        afterEach(() => {
          MessageFactory.typeInChannel.restore()
        })
        it("test simulateTyping", () => {

          const mf = new MessageFactory({}, {
            destination: destChannel
          })
          mf.simulateTyping()
          expect(MessageFactory.typeInChannel.calledOnce).to.be.true
          //since the messageContent and messageOptions are empty, it is by default 100ms
          sinon.assert.calledWith(MessageFactory.typeInChannel, destChannel, 100)
        })
        it("test simulateTyping with MAX_TYPING_DURATION_MS", () => {
          // sinon.stub(MessageFactory,"MAX_TYPING_DURATION_MS").value(150)
          const oldmax = MessageFactory.MAX_TYPING_DURATION_MS
          MessageFactory.MAX_TYPING_DURATION_MS = 150
          const mf = new MessageFactory({}, {
            destination: destChannel,
            messageContent: "this should be long enough to increase the typing duration to be more than 150ms"
          })
          mf.simulateTyping()
          expect(MessageFactory.typeInChannel.calledOnce).to.be.true
          sinon.assert.calledWith(MessageFactory.typeInChannel, destChannel, 150)
          // MessageFactory.MAX_TYPING_DURATION_MS.restore()
          MessageFactory.MAX_TYPING_DURATION_MS = oldmax
        })
        it("test simulateTyping below MAX_TYPING_DURATION_MS", () => {
          const mf = new MessageFactory({}, {
            destination: destChannel,
            messageContent: "1234567890"
          })
          mf.simulateTyping()
          expect(MessageFactory.typeInChannel.calledOnce).to.be.true
          sinon.assert.calledWith(MessageFactory.typeInChannel, destChannel, 10 * 30 + 100)
        })
      })
    })
    describe("test execute()", () => {
      it("empty execute", async () => {
        const mf = new MessageFactory({}, {
          destination: destChannel
        })
        sinon.stub(mf, "sendMessage").returns(Promise.resolve(destMsg))
        const msg = await mf.execute()
        expect(msg).to.eq(destMsg)
        mf.sendMessage.restore()
      })
      it("execute with delete")
      it("execute with reactions")
    })
  })
})
