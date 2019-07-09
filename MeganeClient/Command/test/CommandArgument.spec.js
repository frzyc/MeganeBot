const expect = require("chai").expect
const { CommandArgument, CommandArgumentParseError, Type } = require("../../")


describe("CommandArgument tests", () => {


    describe("Checking for schema", () => {
        let schema
        before(() => {
            schema = CommandArgument.CommandArgumentOptionsSchema
            expect(schema).to.exist
        })

        it("min must be less than max", () => {
            let options = {
                label: "tests",
                min: 10,
                max: 5
            }
            let result = schema.validate(options)
            expect(result.error).to.be.exist
        })

        it(".validate and .parse must exist together", () => {
            let options = {
                label: "tests",
                validate: () => { }
            }
            let result = schema.validate(options)
            expect(result.error).to.be.exist
        })

        it(".type and .validate cannot exist together", () => {
            let options = {
                label: "tests",
                type: "test",
                validate: () => { }
            }
            let result = schema.validate(options)
            expect(result.error).to.be.exist
            expect(result.error.message).to.eq("\"type\" conflict with forbidden peer \"customValidator\"")
        })
    })


    describe("Check separateString()", () => {
        it("Should separate one token by default", () => {
            let testString = "123 234 456 567"
            let result = CommandArgument.separateString(testString)
            expect(result).to.deep.equal(["123", "234 456 567"])
        })
        it("Should separate multiple tokens", () => {
            let testString = "123 234 456 567 789"
            let result = CommandArgument.separateString(testString, 3)
            expect(result).to.deep.equal(["123", "234", "456", "567 789"])
        })
        it("Should separate multiple tokens and merge the last", () => {
            let testString = "123 234 456 567 789"
            let result = CommandArgument.separateString(testString, 3, true)
            expect(result).to.deep.equal(["123", "234", "456 567 789"])
        })
        it("Should separate quotes with spaces in between", () => {
            let testString = "'123 234' 456 567"
            let result = CommandArgument.separateString(testString)
            expect(result).to.deep.equal(["123 234", "456 567"])
        })
        it("Should separate quotes with spaces in between with no space after", () => {
            let testString = "'123 234'456 567"
            let result = CommandArgument.separateString(testString)
            expect(result).to.deep.equal(["123 234", "456 567"])
        })
        it("Should return the full string if its argcount=1 and last", () => {
            let testString = "123 234 456 567"
            let result = CommandArgument.separateString(testString, 1, true)
            expect(result).to.deep.equal(["123 234 456 567"])
        })
        it("Should return null if argcount is more than the number of tokens", () => {
            let testString = "123 234 456 567"
            let result = CommandArgument.separateString(testString, 100, true)
            expect(result).to.be.null
        })
        it("Should separate all tokens in a string if argcount = 0", () => {
            let testString = "123 '234'456 567"
            let result = CommandArgument.separateString(testString, 0)
            expect(result).to.deep.equal(["123", "234", "456", "567"])
        })
        it("Should separate single token in a single token string if argcount = 0", () => {
            let testString = "123456"
            let result = CommandArgument.separateString(testString, 0)
            expect(result).to.deep.equal(["123456"])
        })
    })
    describe("Check separateArg()", () => {
        let mockclient = {
            depot: {
                types: new Map([["testtype", {}]])
            }
        }
        it("Argstring with tokens", () => {
            let ca = new CommandArgument(
                mockclient, {
                    label: "test",
                    type: "testtype",
                    default: "testdefault"
                })
            let re = ca.separateArg("123 234 345 456")
            expect(re.result).to.eq("123")
        })
        it("Argstring with tokens last", () => {
            let ca = new CommandArgument(
                mockclient, {
                    label: "test",
                    type: "testtype",
                    default: "testdefault",
                    last: true
                })
            let re = ca.separateArg("123 234 345 456")
            expect(re.result).to.eq("123 234 345 456")
        })
        it("Empty argstring, no default", () => {
            let ca = new CommandArgument(
                mockclient, {
                    label: "test",
                    type: "testtype"
                })
            expect(() => {
                ca.separateArg("")
            }).to.throw(CommandArgumentParseError)
        })
        it("Empty argstring, has default", () => {
            let ca = new CommandArgument(
                mockclient, {
                    label: "test",
                    type: "testtype",
                    default: "testdefault"
                })
            let re = ca.separateArg("")
            expect(re.result).to.eq("testdefault")
        })
        it(".arry = 0", () => {
            let ca = new CommandArgument(
                mockclient, {
                    label: "test",
                    type: "testtype",
                    array: 0
                })
            let re = ca.separateArg("123 234 345 456 567")
            expect(re.result).to.deep.eq(["123", "234", "345", "456", "567"])
        })
        it(".arry = 0, null string", () => {
            let ca = new CommandArgument(
                mockclient, {
                    label: "test",
                    type: "testtype",
                    array: 0
                })
            expect(() => {
                ca.separateArg()
            }).to.throw(CommandArgumentParseError)
        })
        it(".arry=num", () => {
            let ca = new CommandArgument(
                mockclient, {
                    label: "test",
                    type: "testtype",
                    default: "testdefault",
                    array: 3
                })
            let re = ca.separateArg("123 234 345 456")
            expect(re.result).to.deep.eq(["123", "234", "345"])
        })
        it(".arry=num last", () => {
            let ca = new CommandArgument(
                mockclient, {
                    label: "test",
                    type: "testtype",
                    default: "testdefault",
                    array: 3,
                    last: true
                })
            let re = ca.separateArg("123 234 345 456")
            expect(re.result).to.deep.eq(["123", "234", "345 456"])
        })
        it(".arry=num not enough tokens", () => {
            let ca = new CommandArgument(
                mockclient, {
                    label: "test",
                    type: "testtype",
                    array: 3
                })
            expect(() => {
                ca.separateArg("123 234")
            }).to.throw(CommandArgumentParseError)
        })

    })
    describe("check validation and parsing", () => {
        class TestType extends Type {
            constructor(client) {
                super(client, "testtype")
            }
            validate(value) {
                return { value: `b${value}b` }
            }

            parse(value) {
                return `a${value}a`
            }
        }
        let mockvalidate = (value) => {
            return { value: `b${value}b` }
        }
        let mockparse = (value) => {
            return `a${value}a`
        }
        let mockclient = {
            depot: {
                types: new Map([["testtype", new TestType({})]])
            }
        }
        it("Mock type, validate and parse", async () => {
            let ca = new CommandArgument(
                mockclient, {
                    label: "test",
                    type: "testtype",
                })
            let result = await ca.validate("123")
            expect(result.value).to.eq("b123b")
            let parseresult = await ca.parse("123")
            expect(parseresult).to.eq("a123a")

            ca = new CommandArgument(
                mockclient, {
                    label: "test",
                    validate: mockvalidate,
                    parse: mockparse
                })
            expect(ca.type).to.deep.eq({ id: "custom" })
            result = await ca.validate("123")
            expect(result.value).to.eq("b123b")
            parseresult = await ca.parse("123")
            expect(parseresult).to.eq("a123a")
        })
        it("Mock type, validate and parse arry=num", async () => {
            let ca = new CommandArgument(
                mockclient, {
                    label: "test",
                    type: "testtype",
                    array: 3
                })
            let result = await ca.validate(["123", "234", "345"])
            expect(result.value).to.deep.eq(["b123b", "b234b", "b345b"])
            let parseresult = await ca.parse(["123", "234", "345"])
            expect(parseresult).to.deep.eq(["a123a", "a234a", "a345a"])

            ca = new CommandArgument(
                mockclient, {
                    label: "test",
                    validate: mockvalidate,
                    parse: mockparse,
                    array: 3
                })
            expect(ca.type).to.deep.eq({ id: "custom" })
            result = await ca.validate(["123", "234", "345"])
            expect(result.value).to.deep.eq(["b123b", "b234b", "b345b"])
            parseresult = await ca.parse(["123", "234", "345"])
            expect(parseresult).to.deep.eq(["a123a", "a234a", "a345a"])
        })
        it("validate and parse failures", async () => {
            let ca = new CommandArgument(
                mockclient, {
                    label: "test",
                    type: "testtype",
                })
            let result = await ca.validate({})
            expect(result.error).to.exist
            expect(result.error).to.be.an.instanceof(TypeError)
            expect(result.error.message).to.eq("type validation is only valid for strings")
            let parseresult = await ca.parse({})
            expect(parseresult).to.be.an.instanceof(TypeError)
            expect(parseresult.message).to.eq("type parsing is only valid for strings")
            ca = new CommandArgument(
                mockclient, {
                    label: "test",
                    type: "testtype",
                    array: 3
                })
            result = await ca.validate({})
            expect(result.error).to.exist
            expect(result.error).to.be.an.instanceof(TypeError)
            expect(result.error.message).to.eq("Validate expects an array as values")

        })
    })

})
