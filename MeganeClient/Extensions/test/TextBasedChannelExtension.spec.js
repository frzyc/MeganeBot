const expect = require("chai").expect
require("../../")
const { TextChannel, DMChannel, GroupDMChannel } = require("discord.js")


describe("TextBasedChannelExtension tests", () => {
    /**
     * @type {TextChannel}
     */
    let textChannel

    /**
     * @type {DMChannel}
     */
    let dmChannel

    /**
     * @type {GroupDMChannel}
     */
    let groupDMChannel

    /**
     * @type {MeganeClient}
     */
    let client = {
        dataManager:{
            newUser: ()=>{}//stub function
        }
    }

    let guild = {}
    before(() => {
        textChannel = new TextChannel(guild,{})//guild,data
        expect(textChannel).to.exist

        dmChannel = new DMChannel(client,{
            recipients:[]//stub
        })//client,data
        expect(dmChannel).to.exist

        groupDMChannel = new GroupDMChannel(client,{})//client,data
        expect(groupDMChannel).to.exist
    })
    it("Check for extension properties", () => {
        expect(textChannel).to.respondTo("messageFactory")
        expect(dmChannel).to.respondTo("messageFactory")
        expect(groupDMChannel).to.respondTo("messageFactory")
    })
})
