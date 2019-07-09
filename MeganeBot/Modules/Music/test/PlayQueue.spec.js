const expect = require("chai").expect
// var sinon = require("sinon")
const PlayQueue = require("../PlayQueue")
describe("PlayQueueManager tests",()=>{
    /**
     * @type {PlayQueueManager}
     */
    let pq
    /**
     * @type {MeganeClient}
     */
    let client = {

    }
    before(()=>{
        pq = new PlayQueue(client,"1234")
        expect(pq).to.exist
    })
    it("Check trackId increases",()=>{
        expect(pq.getTrackId()).to.be.not.eq(pq.getTrackId())
    })
    it("addToList()")
    it("addToList() while list is full")
    it("addToQueue()")
    it("removefromQueue()")
    it("shuffleQueue()")
    it("playNextInQueue()")
    it("play()")
    it("sendPlayingmessage()")
    it("updatePlayingMessage()")
    it("getPlaylistmessageResolvable()")
    it("sendPlaylistMessage()")
    it("updatePlaylistMessage()")
    it("stopCurrentPlaying()")
    it("queryYTDL")

})
