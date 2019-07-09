const expect = require("chai").expect
const Float = require("../Float")

describe("Float Type tests", () => {
    let float
    before(() => {
        float = new Float({})
    })
    it("Check for schema", () => {
        expect(Float.schema).to.exist
    })

    it("validate float", () => {
        let teststring = "-5678.23432"
        let result = float.validate(teststring)
        expect(result.error).to.be.null
        expect(result.value).to.eq(-5678.23432)
    })
    it("parse float", () => {
        let testval = 3.14
        expect(float.parse(testval)).to.eq(3.14)
    })
    it("empty string is invalid", () => {
        let teststring = ""
        let result = float.validate(teststring)
        expect(result.error.message).to.eq("\"float\" must be a number")
    })
    it("float limites min/max", () => {
        let teststring = "1"
        let result = float.validate(teststring, null, { min: 5, max: 10 })
        expect(result.error).to.exist
        teststring = "20.34543"
        result = float.validate(teststring, null, { min: 5, max: 10 })
        expect(result.error).to.exist
    })
    it("disallow unsafe", () => {
        const unsafeNum = 90071992547409924
        const result = float.validate(unsafeNum)
        expect(result.error.message).to.eq("\"float\" must be a safe number")
    })
})
