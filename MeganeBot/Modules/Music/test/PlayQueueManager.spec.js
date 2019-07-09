const expect = require("chai").expect
const PlayQueueManager = require("../PlayQueueManager")
describe("PlayQueueManager tests",()=>{
    /**
     * @type {PlayQueueManager}
     */
    let pqm
    before(()=>{
        pqm = new PlayQueueManager({})
        expect(pqm).to.exist
    })
    it("Check for non-existent Playqueue",()=>{
        expect(pqm.hasPlayQueue("non-guild")).to.be.false
    })
    it("Create new Playqueue",()=>{
        const guildid = "test"
        const pq = pqm.getPlayQueue(guildid)
        expect(pqm.getPlayQueue(guildid)).to.eq(pq)
    })
    it("remove a PlayQueue",()=>{
        const guildid = "testdelete"
        expect(pqm.getPlayQueue(guildid)).to.exist
        expect(pqm.hasPlayQueue(guildid)).to.true
        expect(pqm.removePlayQueue(guildid)).to.be.true
        expect(pqm.hasPlayQueue(guildid)).to.be.false
    })
})
