const expect = require("chai").expect
require("../../")
const { Message } = require("discord.js")


describe("MessageExtension tests", () => {
  /**
     * @type {Message}
     */
  let message
  /**
     * @type {MeganeClient}
     */
  let client = {}

  let channel = {}
  before(() => {
    message = new Message(channel, null, client)
    expect(message).to.exist
  })
  it("Check for extension properties", () => {
    expect(Message).to.respondTo("messageFactory")
  })
})
