const discord = require("discord.js")
const Command = require("./Command")
const CommandMessage = require("./CommandMessage")
const CommandModule = require("./CommandModule")
const Type = require("./Type")
const { Util } = require("../Utility")
/**
 * A class to store all the {@link Command}s, {@link CommandModule}s, and {@link Type}s.
 */
class CommandDepot {
  /**
     * @constructor
     * @param {MeganeClient} client
     */
  constructor(client) {

    /**
         * A reference to the MeganeClient.
         * @name CommandDepot#client
         * @type {MeganeClient}
         * @readonly
         */
    Object.defineProperty(this, "client", { value: client })

    /**
         * A collection of {@link Command}s.
         * @type {external:Collection<string,Command>}
         */
    this.commands = new discord.Collection()

    /**
         * A collection of {@link CommandModule}s.
         * @type {external:Collection<string,CommandModule>}
         */
    this.modules = new discord.Collection()

    /**
         * A collection of {@link Type}s.
         * @type {external:Collection<string,Type>}
         */
    this.types = new discord.Collection()
  }

  /**
     * Just a utility function, because the functions with rest parameters are pretty much the same function
     * @param {*} args - the array of elements to add
     * @param {*} callback - the callback to call to add
     * @private
     */
  restParam(args, callback) {
    args.forEach((ele) => {
      if (typeof ele === "function")
        ele = [ele]
      if (Array.isArray(ele))
        ele.forEach((e) => callback.call(this, e))//remember to pass the context using call()
    })
  }

  /**
     * Add an array of {@link CommandModule}s.
     * @param {...Class[]} modules
     * @returns {CommandDepot} - This {@link CommandDepot} so that functions can be chained.
     */
  addModules(...args) {
    this.restParam(args, this.addModule)
    return this
  }

  /**
     * Adds all files in an directory as {@link CommandModule} into this {@link CommandDepot}.
     * @param {string} directory - directory
     * @returns {CommandDepot} - This {@link CommandDepot} so methods can be chained.
     */
  addModulesIn(directory) {
    this.addModules(Util.requireAllInDirectory(directory))
    return this
  }

  /**
     * Add a single {@link CommandModule} to the Depot. must have a unique {@link CommandModule#id}.
     * @param {(Class|CommandModule)} cmdModule - constructor for the command module
     * @private
     * @returns {CommandDepot} - This {@link CommandDepot} so that functions can be chained.
     */
  addModule(cmdModule) {
    //convert the module to an CommandModule object for better parsing
    if (typeof cmdModule === "function")
      cmdModule = new cmdModule(this.client)
    if (!(cmdModule instanceof CommandModule))
      throw `Attempting to add an invalid CommandModule object: ${cmdModule}.`
    if (this.modules.get(cmdModule.name))
      throw `Module "${cmdModule.name}" is already added.`
    if (!cmdModule.hasDescription())
      this.client.emit("warn", `addModule:WARN: Module "${cmdModule.name}" does not have a description.`)
    this.modules.set(cmdModule.name, cmdModule)
    this.addCommands(cmdModule.commands.array())
    this.client.emit("moduleAdded", cmdModule, this)
    return this
  }

  /**
     * Search for {@link CommandModule}s. Searches are case-insensitive.
     * @param {?string} searchString - A search string.
     * @param {?boolean} [exact=false] - Whether to search using wholewords for {@link CommandModule#name}.
     * @param {?external:Message} [message] - Restricts the search using the context provided by the message.
     * @returns {CommandModule[]} - Matches.
     * //TODO exclude modules that are disabled.
     */
  findModules(searchString = null, exact = false, message = null) {
    if (!searchString) return message ? this.modules.filter(mod => mod.passContextAndPerms(message)) : Array.from(this.modules.values())
    const lcSearch = searchString.toLowerCase()
    const matchedModules = this.modules.filter(mod => {
      if (message && !mod.passContextAndPerms(message)) return false
      if (exact) return mod.name.toLowerCase() === lcSearch
      else return mod.name.toLowerCase().includes(lcSearch)
    })
    if (exact) return matchedModules.array()
    //check for exact match in fuzzy search
    for (const mod of matchedModules.array())
      if (mod.name.toLowerCase() === lcSearch) return [mod]
    return matchedModules.array()
  }

  /**
     * Add an array of {@link Command}s.
     * @param {...(function[]|Command)} Commands - either as constructors or as instantiated {@link Command} objects.
     * @returns {CommandDepot} - This {@link CommandDepot} so that functions can be chained.
     */
  addCommands(...args) {
    this.restParam(args, this.addCommand)
    return this
  }

  /**
     * Adds all files in an directory as {@link Command} into this {@link CommandDepot}.
     * @param {string} directory - directory
     * @returns {CommandDepot} - This {@link CommandDepot} so methods can be chained.
     */
  addCommandsIn(directory) {
    this.addCommands(Util.requireAllInDirectory(directory))
    return this
  }

  /**
     * Add a single command to the Depot.
     * @param {(Function|Command)} command
     * @returns {CommandDepot} - This {@link CommandDepot} so that functions can be chained.
     */
  addCommand(command) {
    //convert the command to an Command object for better parsing
    if (typeof command === "function") command = new command(this.client)
    if (!(command instanceof Command))
      throw `Attempting to add an invalid Command object: ${command}.`
    if (this.commands.some(cmd => cmd.name === command.name))
      throw new Error(`A command with the name "${command.name}" is already added.`)

    for (const alias of command.commands)
      if (this.commands.some(cmd => cmd.commands.includes(alias)))
        throw new Error(`A command with the alias "${alias}" is already added.`)

    if (!command.execute) throw new Error(`Command "${command.name}" does not have a execute function.`)
    if (!command.usage) this.client.emit("warn", `Command "${command.name}" does not have a usage.`)
    this.commands.set(command.name, command)
    this.client.emit("commandAdded", command, this)
    this.client.emit("debug", `Added command "${module.name}":"${command.name}".`)
    return this
  }

  /**
     * Search for {@link Command}s.
     * @param {string} searchString - A search string.
     * @param {boolean} [exact=false] - Whether to search using wholewords for {@link Command#name}s/{@link Command#commands}.
     * @param {?external:Message} [message] - Restricts the search using the context provided by the message.
     * @returns {Command[]} - Matches.
     * TODO exclude commands that are disabled
     */
  findCommands(searchString = null, exact = false, message = null) {
    if (!searchString) return message ? this.modules.filter(cmd => cmd.passContextAndPerms(message)) : Array.from(this.commands.values())

    const lcSearch = searchString.toLowerCase()
    const matchedCommands = this.commands.filter(cmd => {
      if (message && !cmd.passContextAndPerms(message)) return false
      let lcname = cmd.name.toLowerCase()
      if (exact) return lcname === lcSearch || (cmd.commands.some(ali => ali.toLowerCase() === lcSearch))
      else return lcname.includes(lcSearch) || (cmd.commands.some(ali => ali.toLowerCase().includes(lcSearch)))
    })
    if (exact) return matchedCommands.array()
    // See if there's an exact match in the fuzzy search
    for (const command of matchedCommands.array()) {
      if (command.name === lcSearch || (command.commands.some(cmd => cmd === lcSearch))) {
        return [command]
      }
    }
    return matchedCommands.array()
  }

  /**
     * Find an single {@link Command}.
     * @param {Command|CommandMessage|string} module - Module to find.
     * @returns {Command} - Match.
     */
  resolveCommand(command) {
    if (command instanceof Command) return command
    if (command instanceof CommandMessage) return command.command
    if (typeof command === "string") {
      const commands = this.findCommands(command, true)
      if (commands.length === 1) return commands[0]
    }
    this.client.emit("warn", `Unable to resolve command: ${command}`)
    return null
  }

  /**
     * Add a single module to the Depot. must have a unique {@link Type#id}.
     * @param {Type} type
     * @returns {CommandDepot} - This {@link CommandDepot} so that functions can be chained.
     */
  addType(type) {
    if (typeof type === "function") type = new type(this.client)
    if (!(type instanceof Type))
      throw `Attempting to register an invalid argument type object: ${type}.`
    if (this.types.has(type.id)) throw new Error(`An argument type with the ID "${type.id}" is already registered.`)
    this.types.set(type.id, type)
    this.client.emit("typeRegistered", type, this)
    this.client.emit("debug", `Registered argument type ${type.id}.`)
    return this
  }

  /**
     * Add an array of {@link Type}s.
     * @param {...(function[]|Type[])} args
     * @returns {CommandDepot} - This {@link CommandDepot} so that functions can be chained.
     */
  addTypes(...args) {
    this.restParam(args, this.addType)
    return this
  }

  /**
     * Adds all files in an directory as {@link Type} into this {@link CommandDepot}.
     * @param {string} directory - directory
     * @returns {CommandDepot} - This {@link CommandDepot} so methods can be chained.
     */
  addTypesIn(directory) {
    this.addTypes(Util.requireAllInDirectory(directory))
    return this
  }

}
module.exports = CommandDepot
