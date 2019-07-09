const expect = require("chai").expect
const Integer = require("../Integer")

describe("Integer Type tests", () => {
    let integer
    before(() => {
        integer = new Integer({})
    })
    it("Check for schema", () => {
        expect(Integer.schema).to.exist
    })

    it("validate integer", () => {
        let teststring = "567823432"
        let result = integer.validate(teststring)
        expect(result.error).to.be.null
        expect(result.value).to.eq(567823432)
    })

    it("invalidate floats", () => {
        let teststring = "-5678.23432"
        let result = integer.validate(teststring)
        expect(result.error).to.be.exist
        expect(result.value).to.eq(-5678.23432)
    })
    it("parse integer", () => {
        let testval = 100
        expect(integer.parse(testval)).to.eq(testval)
    })
    it("empty string is invalid", () => {
        let teststring = ""
        let result = integer.validate(teststring)
        expect(result.error.message).to.eq("\"integer\" must be a number")
    })
    it("integer limites min/max", () => {
        let teststring = "1"
        let result = integer.validate(teststring, null, { min: 5, max: 10 })
        expect(result.error).to.exist
        expect(result.error.message).to.eq("\"integer\" must be larger than or equal to 5")
        teststring = "20"
        result = integer.validate(teststring, null, { min: 5, max: 10 })
        expect(result.error).to.exist
        expect(result.error.message).to.eq("\"integer\" must be less than or equal to 10")
    })
    it("disallow unsafe", () => {
        const unsafeNum = "90071992547409924"
        const result = integer.validate(unsafeNum)
        expect(result.error.message).to.eq("\"integer\" must be a safe number")
    })
})
