const expect = require("chai").expect
const {Command} = require("../")

describe("Command",()=>{
    it("Check Command",()=>{
        expect(Command).to.a("function")
    })
})