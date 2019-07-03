const expect = require("chai").expect
const String = require("../String")


describe("Check String type", () => {
    let string
    before(() => {
        string = new String({})
    })
    it("Check for schema", () => {
        expect(String.schema).to.exist
    })

    it("validate string", () => {
        let teststring = "test"
        let result = string.validate(teststring)
        expect(result.error).to.be.null
        expect(result.value).to.eq(teststring)
    })
    it("parese string", () => {
        let teststring = "test"
        expect(string.parse(teststring)).to.eq(teststring)
    })
    it("empty string is valid", () => {
        let teststring = ""
        let result = string.validate(teststring)
        expect(result.error).to.be.null
        expect(result.value).to.eq(teststring)
    })
    it("string limites min/max", () => {
        let teststring = "a"
        let result = string.validate(teststring, null, { min: 5, max: 10})
        expect(result.error).to.exist
        teststring = "abcdegasdkjfla;dsjfalk;sdfjasdl;k"
        result = string.validate(teststring, null, { min: 5, max: 10})
        expect(result.error).to.exist
    })
})
