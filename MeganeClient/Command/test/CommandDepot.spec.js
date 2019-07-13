const expect = require("chai").expect
const sinon = require("sinon")
const { CommandDepot, CommandModule, Command, Type } = require("../../")

describe("CommandDepot tests", () => {
  describe("restParam()", () => {
    class TestObj { }
    let cmdDepot
    let stub
    beforeEach(() => {
      cmdDepot = new CommandDepot({})
      stub = sinon.stub()
      cmdDepot.addTest = (...args) => {
        cmdDepot.restParam(args, stub)
      }

    })
    it("single", () => {
      cmdDepot.addTest(TestObj)
      expect(stub.calledOnce).to.be.true
      expect(stub.alwaysCalledWith(TestObj)).to.be.true
    })
    it("array", () => {
      cmdDepot.addTest([TestObj, TestObj, TestObj])
      expect(stub.calledThrice).to.be.true
      expect(stub.alwaysCalledWith(TestObj)).to.be.true
    })
    it("rest parameter", () => {
      cmdDepot.addTest(TestObj, TestObj, TestObj)
      expect(stub.calledThrice).to.be.true
      expect(stub.alwaysCalledWith(TestObj)).to.be.true
    })
    it("no parameters", () => {
      cmdDepot.addTest()
      expect(stub.called).to.be.false
    })

  })
  describe("modules", () => {
    const testModuleName = "Test Module"
    class TestModule extends CommandModule {
      constructor(client) {
        super(client, {
          name: testModuleName
        })
      }
    }
    it("addModules()", () => {
      const client = { emit: sinon.stub() }
      let cmdDepot = new CommandDepot(client)
      sinon.stub(cmdDepot, "addModule")

      cmdDepot.addModules([TestModule, TestModule, TestModule], TestModule, TestModule, TestModule)
      expect(cmdDepot.addModule.callCount).to.eq(6)
      expect(cmdDepot.addModule.alwaysCalledWith(TestModule)).to.be.true

      cmdDepot.addModule.restore()
    })

    describe("addmodule()", () => {
      let client, depot
      beforeEach(() => {
        client = {
          emit: sinon.stub()
        }
        depot = new CommandDepot(client)
      })
      it("add", () => {
        depot.addModule(TestModule)
        expect(depot.modules.get(testModuleName)).to.exist
      })
      it("add Object", () => {
        depot.addModule(new TestModule({}))
        expect(depot.modules.get(testModuleName)).to.exist
      })
      it("add cmdModule with commands", () => {
        const testModule = new TestModule({})
        sinon.stub(depot, "addCommands")
        const cmd1name = "cmd1"
        const cmd1 = { name: cmd1name }
        const cmd2name = "cmd2"
        const cmd2 = { name: cmd2name }
        testModule.commands.set(cmd1name, cmd1)
        testModule.commands.set(cmd2name, cmd2)
        depot.addModule(testModule)
        expect(depot.modules.get(testModuleName)).to.exist
        expect(depot.addCommands.calledOnce).to.be.true
        expect(depot.addCommands.calledWith([cmd1, cmd2])).to.be.true
        depot.addCommands.restore()
      })
      it("add duplicate name", () => {
        depot.addModule(TestModule)
        expect(depot.modules.get(testModuleName)).to.exist
        expect(() => {
          depot.addModule(TestModule)
        }).to.throw(`Module "${testModuleName}" is already added.`)
      })
      it("add invalid", () => {
        expect(() => {
          depot.addModule()
        }).to.throw("Attempting to add an invalid CommandModule object: undefined.")
      })
    })
    describe("findModules()", () => {
      it("find a single module exactly")
      it("find modules with same word in name")
      it("mock contextRestriction() and permission checks")
      it("exact match in fuzzy search")
    })
    it("resolveModule()")
  })
  describe("commands", () => {
    const testCommandName = "Test Command"
    class TestCommand extends Command {
      constructor(client) {
        super(client, {
          name: testCommandName,
          commands: "cmd"
        })
      }
    }
    const client = { emit: sinon.stub() }
    it("addModules()", () => {
      const cmdDepot = new CommandDepot(client)
      sinon.stub(cmdDepot, "addCommand")

      cmdDepot.addCommands([TestCommand, TestCommand, TestCommand], TestCommand, TestCommand, TestCommand)
      expect(cmdDepot.addCommand.callCount).to.eq(6)
      expect(cmdDepot.addCommand.alwaysCalledWith(TestCommand)).to.be.true

      cmdDepot.addCommand.restore()
    })
    describe("addCommand", () => {
      let depot
      beforeEach(() => {
        depot = new CommandDepot(client)
      })
      it("add", () => {
        depot.addCommand(TestCommand)
        expect(depot.commands.get(testCommandName)).to.exist
      })
      it("add Object", () => {
        depot.addCommand(new TestCommand({}))
        expect(depot.commands.get(testCommandName)).to.exist
      })
      it("add duplicate name", () => {
        depot.addCommand(TestCommand)
        expect(depot.commands.get(testCommandName)).to.exist
        expect(() => {
          depot.addCommand(TestCommand)
        }).to.throw(`A command with the name "${testCommandName}" is already added.`)
      })
      it("add duplicate alias", () => {
        const tCommand1 = new TestCommand({})
        const tCommand1Name = "tCommand1Name"
        tCommand1.name = tCommand1Name
        tCommand1.commands = ["cmd1", "cmd"]


        const tCommand2Name = "tCommand2Name"
        class TestCommand2 extends Command {
          constructor(client) {
            super(client, {
              name: tCommand2Name,
              commands: ["cmd2", "cmd"]
            })
          }
        }
        const tCommand2 = new TestCommand2({})

        depot.addCommand(tCommand1)
        expect(depot.commands.get(tCommand1Name)).to.exist
        expect(() => {
          depot.addCommand(tCommand2)
        }).to.throw(`A command with the alias "${"cmd"}" is already added.`)
      })
      it("add invalid", () => {
        expect(() => {
          depot.addCommand()
        }).to.throw("Attempting to add an invalid Command object: undefined.")
      })
    })
    it("findCommands()")
    it("resolveCommand()")
  })
  describe("types", () => {
    const testTypeName = "testtype"
    class TestType extends Type {
      constructor(client) {
        super(client, testTypeName)
      }
      validate() { return { value: "test" } }
      parse(value) { return value }
    }
    const client = { emit: sinon.stub() }
    let cmdDepot
    beforeEach(() => {
      cmdDepot = new CommandDepot(client)
    })
    it("addTypes()", () => {
      sinon.stub(cmdDepot, "addType")

      cmdDepot.addTypes([TestType, TestType, TestType], TestType, TestType, TestType)
      expect(cmdDepot.addType.callCount).to.eq(6)
      expect(cmdDepot.addType.alwaysCalledWith(TestType)).to.be.true

      cmdDepot.addType.restore()
    })
    describe("addType()", () => {
      let depot
      beforeEach(() => {
        depot = new CommandDepot(client)
      })
      it("add", () => {
        depot.addType(TestType)
        expect(depot.types.get(testTypeName)).to.exist
      })
      it("add Object", () => {
        depot.addType(new TestType({}))
        expect(depot.types.get(testTypeName)).to.exist
      })
      it("add duplicate name", () => {
        depot.addType(TestType)
        expect(depot.types.get(testTypeName)).to.exist
        expect(() => {
          depot.addType(TestType)
        }).to.throw(`An argument type with the ID "${testTypeName}" is already registered.`)
      })
      it("add invalid", () => {
        expect(() => {
          depot.addType()
        }).to.throw("Attempting to register an invalid argument type object: undefined.")
      })
    })
  })

})
