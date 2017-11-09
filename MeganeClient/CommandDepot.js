const discord = require('discord.js');
const fs = require('fs');
const Command = require('./Command');
const CommandMessage = require('./CommandMessage');
const CommandModule = require('./CommandModule');
const Type = require('./DefaultTypes/Type');
module.exports = class CommandDepot {
    constructor(client) {
        //read only property for client
        Object.defineProperty(this, 'client', { value: client });
        this.commands = new discord.Collection();
        this.modules = new discord.Collection();
        this.types = new discord.Collection();
    }
    addModules(modules) {
        if (!Array.isArray(modules)) throw new TypeError("Modules must be an array.");
        for (let module of modules)
            this.addModule(module);
        return this;
    }
    addModule(module) {
        //convert the module to an CommandModule object for better parsing
        if (typeof module === 'function') {
            module = new module(this.client);
        } else if (!(module instanceof CommandModule)) {
            module = new CommandModule(this.client, module.id, module.name, null, module.commands);
        }

        const existing = this.modules.get(module.id);
        if (existing) {
            throw new Error(`Module ${module.id} is already added.`);
        } else {
            if (!module.description) this.client.emit('warn', `addModule:WARN: Module ${module.id} does not have a description.`);
            this.modules.set(module.id, module);
            this.client.emit('moduleAdded', module, this);
            this.client.emit('debug', `Added module ${module.id}.`);
            this.addCommands(module.commands.array());
        }
        return this;
    }
    findModules(searchString = null, exact = false) {
        if (!searchString) return this.modules;
        const lcSearch = searchString.toLowerCase();
        const matchedModules = this.modules.filterArray(
            exact ? moduleFilterExact(lcSearch) : moduleFilterInexact(lcSearch)
        );
        if (exact) return matchedGroups;

        for (const mod of matchedGroups) {
            if (mod.name.toLowerCase() === lcSearch || mod.id === lcSearch) return [mod];
        }
        return matchedGroups;
        function ModuleFilterExact(search) {//has to match the id exactly
            return mod => mod.id === search || mod.name.toLowerCase() === search;
        }

        function ModuleFilterInexact(search) {//can partially match the id
            return mod => mod.id.includes(search) || mod.name.toLowerCase().includes(search);
        }
    }
    getModule(module) {
        if (module instanceof CommandModule) return module;
        if (typeof module === 'string') {
            const modules = this.findGroups(module, true);
            if (modules.length === 1) return modules[0];
        }
        throw new Error('Unable to resolve group.');
    }

    addCommands(commands) {
        if (!Array.isArray(commands)) throw new TypeError('Commands must be an Array.');
        for (let command of commands)
            this.addCommand(command);
        return this;
    }
    addCommand(command) {
        //convert the command to an Command object for better parsing
        if (typeof command === 'function') command = new command(this.client);
        if (!(command instanceof Command)) return this.client.emit('warn', `Attempting to add an invalid command object: ${command}; skipping.`);
        if (this.commands.some(cmd => cmd.name === command.name || cmd.aliases.includes(command.name))) {
            throw new Error(`A command with the name/alias "${command.name}" is already added.`);
        }
        for (const alias of command.aliases) {
            if (this.commands.some(cmd => cmd.name === alias || cmd.aliases.includes(alias))) {
                throw new Error(`A command with the name/alias "${alias}" is already added.`);
            }
        }
        if(!command.moduleID) throw new Error('A command must have a moduleID to attach to a module.');//TODO create a internal module to store all the cmds without a module.
        const module = this.modules.find(mod => mod.id === command.moduleID);
        if (!module) throw new Error(`Group "${command.moduleID}" is not added.`);
        if (module.commands.some(cmd => cmd.id === command.id)) {
            this.client.emit('debug', `A command with the id "${command.id}" is already added in ${module.id}`);
        }
        if (!command.execute) throw new Error(`Command ${command.id} does not have a execute function.`);
        if (!command.usage) this.client.emit('warn', `Command ${command.id} does not have a usage.`);
        command.module = module;
        module.commands.set(command.name, command);
        this.commands.set(command.name, command);
        this.client.emit('commandAdded', command, this);
        this.client.emit('debug', `Added command ${module.id}:${command.id}.`);
        return this;
    }
    addCommandsInDir(){
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
    }
    findCommands(searchString = null, exact = false, message = null) {
        if (!searchString) return message ? this.commands.filterArray(cmd => cmd.hasPermissions(message)) : this.commands;

        const lcSearch = searchString.toLowerCase();
        const matchedCommands = this.commands.filterArray(
            exact ? commandFilterExact(lcSearch) : commandFilterInexact(lcSearch)
        );
        if (exact) return matchedCommands;

        // See if there's an exact match
        for (const command of matchedCommands) {
            if (command.name === lcSearch || (command.aliases && command.aliases.some(ali => ali === lcSearch))) {
                return [command];
            }
        }

        return matchedCommands;
        function commandFilterExact(search) {
            return cmd => cmd.name === search ||
                (cmd.aliases && cmd.aliases.some(ali => ali === search)) ||
                `${cmd.moduleID}:${cmd.memberName}` === search;
        }

        function commandFilterInexact(search) {
            return cmd => cmd.name.includes(search) ||
                `${cmd.moduleID}:${cmd.memberName}` === search ||
                (cmd.aliases && cmd.aliases.some(ali => ali.includes(search)));
        }
    }

    resolveCommand(command) {
        if (command instanceof Command) return command;
        if (command instanceof CommandMessage) return command.command;
        if (typeof command === 'string') {
            const commands = this.findCommands(command, true);
            if (commands.length === 1) return commands[0];
        }
        this.client.emit('warn', `Unable to resolve command: ${command}`);
        return null;
    }

    addType(type) {
        if (typeof type === 'function') type = new type(this.client);
        if (!(type instanceof Type)) {
            this.client.emit('warn', `Attempting to register an invalid argument type object: ${type}; skipping.`);
            return;
        }
        if (this.types.has(type.id)) throw new Error(`An argument type with the ID "${type.id}" is already registered.`);
        this.types.set(type.id, type);
        this.client.emit('typeRegistered', type, this);
        this.client.emit('debug', `Registered argument type ${type.id}.`);
        return this;
    }
    addTypes(types) {
        if (!Array.isArray(types)) throw new TypeError('Commands must be an Array.');
        for (let type of types)
            this.addType(type);
        return this;
    }

    //TODO add modules/commands in a directory
    //TODO add types in a directory

}
