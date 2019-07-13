const expect = require("chai").expect
const Boolean = require("../Boolean")

describe("Boolean Type tests", () => {
  let boolean
  before(() => {
    boolean = new Boolean({})
  })
  it("Check for schema", () => {
    expect(Boolean.schema).to.exist
    expect(Boolean.truthyArr).to.be.an("array").that.is.not.empty
    expect(Boolean.falsyArr).to.be.an("array").that.is.not.empty
  })

  it("Test all truthy and falsey values", () => {
    for (const truthy of Boolean.truthyArr)
      expect(boolean.validate(truthy).value).to.eq(true)
    for (const falsy of Boolean.falsyArr)
      expect(boolean.validate(falsy).value).to.eq(false)
  })
  it("parse boolean", () => {
    expect(boolean.parse(true)).to.eq(true)
  })
  it("empty string is invalid", () => {
    const teststring = ""
    const result = boolean.validate(teststring)
    expect(result.error.message).to.eq("\"value\" must be a boolean")
  })
})
