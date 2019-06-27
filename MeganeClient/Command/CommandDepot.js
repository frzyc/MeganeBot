const discord = require("discord.js")
const Command = require("./Command")
const CommandMessage = require("./CommandMessage")
const CommandModule = require("./CommandModule")
const Type = require("../DefaultTypes/Type")
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
     * Add an array of {@link CommandModule}s.
     * @param {CommandModule[]} modules
     * @returns {CommandDepot} - This {@link CommandDepot} so that functions can be chained.
     */
    addModules(modules) {
        if (!Array.isArray(modules)) throw new TypeError("Modules must be an array.")
        for (let module of modules)
            this.addModule(module)
        return this
    }

    /**
     * Add a single module to the Depot. must have a unique {@link CommandModule#id}.
     * @param {CommandModule} module
     * @returns {CommandDepot} - This {@link CommandDepot} so that functions can be chained.
     */
    addModule(module) {
        //convert the module to an CommandModule object for better parsing
        if (typeof module === "function") {
            module = new module(this.client)
        } else if (!(module instanceof CommandModule)) {
            module = new CommandModule(this.client, module.id, module.name, null, module.commands)
        }

        const existing = this.modules.get(module.id)
        if (existing) {
            throw new Error(`Module ${module.id} is already added.`)
        } else {
            if (!module.hasDescription()) this.client.emit("warn", `addModule:WARN: Module ${module.id} does not have a description.`)
            this.modules.set(module.id, module)
            this.client.emit("moduleAdded", module, this)
            this.client.emit("debug", `Added module ${module.id}.`)
            this.addCommands(module.commands.array())
        }
        return this
    }

    /**
     * Search for {@link CommandModule}s.
     * @param {string} searchString - A search string.
     * @param {boolean} [exact=false] - Whether to search using wholewords for {@link CommandModule#name}s/{@link CommandModule#id}s.
     * @param {?external:Message} [message] - Restricts the search using the context provided by the message.
     * @returns {CommandModule[]} - Matches.
     */
    findModules(searchString = null, exact = false, message = null) {
        if (!searchString) return message ? this.modules.filter(mod => mod.passContextRestriction(message) && mod.passPermissions(message)) : Array.from(this.modules.values())
        const lcSearch = searchString.toLowerCase()
        const matchedModules = this.modules.filter(
            mod => {
                if (exact) return mod.id === lcSearch || mod.name.toLowerCase() === lcSearch
                else return mod.id.includes(lcSearch) || mod.name.toLowerCase().includes(lcSearch)
            }
        )
        if (exact) return matchedModules

        for (const mod of matchedModules) {
            if (mod.name.toLowerCase() === lcSearch || mod.id === lcSearch) return [mod]
        }
        return matchedModules
    }

    /**
     * find an single {@link CommandModule}.
     * @param {CommandModule|string} module - Module to find.
     * @returns {CommandModule} - Match.
     */
    getModule(module) {
        if (module instanceof CommandModule) return module
        if (typeof module === "string") {
            const modules = this.findModules(module, true)
            if (modules.length === 1) return modules[0]
        }
        throw new Error("Unable to resolve module.")
    }

    /**
     * Add an array of {@link Command}s.
     * @param {Command[]} commands
     * @returns {CommandDepot} - This {@link CommandDepot} so that functions can be chained.
     */
    addCommands(commands) {
        if (!Array.isArray(commands)) throw new TypeError("Commands must be an Array.")
        for (let command of commands)
            this.addCommand(command)
        return this
    }

    /**
     * Add a single command to the Depot. must have a unique {@link Command#id}. Will also add it to the corresponding {@link CommandModule}.
     * @param {Command} command
     * @returns {CommandDepot} - This {@link CommandDepot} so that functions can be chained.
     */
    addCommand(command) {
        //convert the command to an Command object for better parsing
        if (typeof command === "function") command = new command(this.client)
        if (!(command instanceof Command)) return this.client.emit("warn", `Attempting to add an invalid command object: ${command}; skipping.`)
        if (this.commands.some(cmd => cmd.name === command.name || cmd.aliases.includes(command.name))) {
            throw new Error(`A command with the name/alias "${command.name}" is already added.`)
        }
        for (const alias of command.aliases) {
            if (this.commands.some(cmd => cmd.name === alias || cmd.aliases.includes(alias))) {
                throw new Error(`A command with the name/alias "${alias}" is already added.`)
            }
        }
        if (!command.moduleID) throw new Error("A command must have a moduleID to attach to a module.")//TODO create a internal module to store all the cmds without a module.
        const module = this.modules.find(mod => mod.id === command.moduleID)
        if (!module) throw new Error(`Module "${command.moduleID}" is not added.`)
        if (module.commands.some(cmd => cmd.id === command.id)) {
            this.client.emit("debug", `A command with the id "${command.id}" is already added in ${module.id}`)
        }
        if (!command.execute) throw new Error(`Command ${command.id} does not have a execute function.`)
        if (!command.usage) this.client.emit("warn", `Command ${command.id} does not have a usage.`)
        command.module = module
        module.commands.set(command.name, command)
        this.commands.set(command.name, command)
        this.client.emit("commandAdded", command, this)
        this.client.emit("debug", `Added command ${module.id}:${command.id}.`)
        return this
    }

    //addCommandsInDir(){
    /* TODO add all commands in a directory
    fs.readdir('./glassesicon', (err, files) => {
        if (err) {
            console.error(err);
        }
        files.forEach(file => {
            console.log(file);
        });
        this.addCommands(files);
    });
    return this;*/
    //}

    /**
     * Search for {@link Command}s.
     * @param {string} searchString - A search string.
     * @param {boolean} [exact=false] - Whether to search using wholewords for {@link Command#name}s/{@link Command#aliases}.
     * @param {?external:Message} [message] - Restricts the search using the context provided by the message.
     * @returns {Command[]} - Matches.
     */
    findCommands(searchString = null, exact = false, message = null) {
        if (!searchString) return message ? this.commands.filter(cmd => cmd.passContextRestriction(message) && cmd.passPermissions(message)) : Array.from(this.commands.values())

        const lcSearch = searchString.toLowerCase()
        const matchedCommands = this.commands.filter(
            cmd => {
                let lcname = cmd.name.toLowerCase()
                if (exact) return lcname === lcSearch || (cmd.aliases && cmd.aliases.some(ali => ali.toLowerCase() === lcSearch)) || `${cmd.moduleID}:${cmd.memberName}` === lcSearch
                else return lcname.includes(lcSearch) || `${cmd.moduleID}:${cmd.memberName}` === lcSearch || (cmd.aliases && cmd.aliases.some(ali => ali.toLowerCase().includes(lcSearch)))
            }
        )
        if (exact) return matchedCommands
        // See if there's an exact match
        for (const command of matchedCommands) {
            if (command.name === lcSearch || (command.aliases && command.aliases.some(ali => ali === lcSearch))) {
                return [command]
            }
        }
        return matchedCommands
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
        if (!(type instanceof Type)) {
            this.client.emit("warn", `Attempting to register an invalid argument type object: ${type}; skipping.`)
            return
        }
        if (this.types.has(type.id)) throw new Error(`An argument type with the ID "${type.id}" is already registered.`)
        this.types.set(type.id, type)
        this.client.emit("typeRegistered", type, this)
        this.client.emit("debug", `Registered argument type ${type.id}.`)
        return this
    }

    /**
     * Add an array of {@link Types}s.
     * @param {Types[]} types
     * @returns {CommandDepot} - This {@link CommandDepot} so that functions can be chained.
     */
    addTypes(types) {
        if (!Array.isArray(types)) throw new TypeError("Commands must be an Array.")
        for (let type of types)
            this.addType(type)
        return this
    }

    //TODO add modules/commands in a directory
    //TODO add types in a directory

}
module.exports = CommandDepot
