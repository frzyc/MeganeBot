
const YoutubeDL = require("youtube-dl")
const downloader = require('youtube-dl/lib/downloader')
const fs = require("fs");
/**
 * Renamed file to YoutubeDL._spec.js because each execution of youtube-dl takes like 3 seconds... 
 */
const expect = require("chai").expect
describe("youtube-dl", function () {
  this.timeout(10000)
  before("download lib", (donebefore) => {
    if (!fs.existsSync('./data/youtube-dl')) {
      downloader('./data', function error(err, done) {
        if (err) throw err
        console.log("DOWNLOAD youtube-dl exe:", done)
        donebefore()
      })
    } else
      donebefore()

  })
  it("query search string", (done) => {
    const searchString = "sam smith how sleep"
    queryYTDL(searchString, (res) => {
      expect(res._type).to.eq("playlist")
      done()
    })
  }).timeout(10000)
  it("query youtube url", (done) => {
    const searchString = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    queryYTDL(searchString, (res) => {
      expect(res.url).to.exist
      done()
    })
  }).timeout(10000)
  it("query youtube urlcode", (done) => {
    const searchString = "PmYypVozQb4"
    queryYTDL(searchString, (res) => {
      expect(res.url).to.exist
      done()
    })
  }).timeout(10000)

  it("query youtube playlist", (done) => {
    const searchString = "https://www.youtube.com/playlist?list=PLeoBVKHKNsGriWnBb7u2FrwRC-izVytZg"
    queryYTDL(searchString, (res) => {
      expect(res._type).to.eq("playlist")
      done()
    })
  }).timeout(10000)
})

const queryYTDL = (searchString, cb) => {
  YoutubeDL.exec(searchString, ["--quiet", //Activate quiet mode
    "--dump-single-json", //Simulate, quiet but print JSON information.
    "--flat-playlist", //Do not extract the videos of a playlist, only list them.
    "--ignore-errors", //Continue on download errors, for example to skip unavailable videos in a playlist
    "--format", //FORMAT
    "bestaudio/best",
    "--default-search",
    "auto"
  ], {}, (queryErr, queryInfo) => {
    if (queryErr) throw queryErr
    const queryObj = queryInfo.map((info) => {
      try {
        return JSON.parse(info)
      } catch (e) {
        return null
      }
    }).filter((val) => val !== null)[0]//take the first valid JSONable content
    cb(queryObj)
  })
}
