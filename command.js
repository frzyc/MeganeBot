const util = require('./util.js');
const config = require('./data/config.json');

var cmdBaseobj = function () {
    this.cmdlist = {};
    this.modulelist = {};
}
cmdBaseobj.prototype.addCmd = function (cmdobj) {
    //console.log(`cmdBaseobj.prototype.addCmd: ${cmdobj.name}`);
    let addcomplete = true;
    if (!cmdobj.name || cmdobj.name.length === 0) {
        console.log(`cmdBaseobj.addCmd:ERROR: Command has invalid cmdname.`);
        return false;
    }
    if (!cmdobj.process) return console.log(`cmdBaseobj.addCmd: ERROR: Command ${cmdobj.name[0]} does not have a process.`);
    if (!cmdobj.usage) console.log(`cmdBaseobj.addCmd: WARN: Command ${cmdobj.name[0]} does not have a usage.`);

    for (n of cmdobj.name) {
        if (this.cmdlist[n]) {
            console.log(`cmdBaseobj.addCmd: ERROR: Command with name '${n}' already exists.`);
            addcomplete = false;
            break;
        }

        this.cmdlist[n] = cmdobj;
    }
    return addcomplete;
}
//modules will have multiple cmdname mappings due to cmdname shortcuts. just use module mapping so all of cmdobj.name gets used.
cmdBaseobj.prototype.addCmdWithName = function (cmdobj,name) {
    //console.log(`cmdBaseobj.addCmdWithName: ${name}`);
    if (!name) {
        console.log(`cmdBaseobj.addCmdWithName:ERROR: Command has invalid cmdname.`);
        return false;
    }
    if (!cmdobj.process) return console.log(`cmdBaseobj.addCmdWithName: ERROR: Command ${name} does not have a process.`);
    if (!cmdobj.usage) console.log(`cmdBaseobj.addCmdWithName: WARN: Command ${name} does not have a usage.`);

    if (this.cmdlist[name]) {
        console.log(`cmdBaseobj.addCmdWithName: ERROR: Command ${name} already exists.`);
        return false;
    }

    this.cmdlist[name] = cmdobj;

    return true;
}

cmdBaseobj.prototype.addModule = function (moduleobj) {
    //console.log(`cmdBaseobj.prototype.addModule: ${moduleobj.name}`);
    let addcomplete = true;
    if (!moduleobj.name) {
        console.log(`addModule:ERROR: Module has invalid name.`);
        return false;
    }
    let mname = moduleobj.name.toLowerCase();
    if (this.modulelist[mname]) {
        console.log(`addModule:ERROR: Module with the same name: ${moduleobj.name}, already exists.`);
        return false;
    }
    this.modulelist[mname] = moduleobj;
    if (!moduleobj.description) console.log(`addModule:WARN: Command ${moduleobj.name} does not have a description.`);

    for (cmd in moduleobj.cmdlist) {
        //this.addCmdWithName(moduleobj.cmdlist[cmd],cmd);
        this.addCmd(moduleobj.cmdlist[cmd]);
    }

    return addcomplete;
}

var cmdModuleobj = function (modulename) {
    this.name = modulename;
    this.cmdlist = {};
}
cmdModuleobj.prototype.addCmd = function (cmdobj) {
    //console.log(`cmdModuleobj.prototype.addCmd: ${cmdobj.name}`);
    let addcomplete = true;
    if (!cmdobj.name || cmdobj.name.length === 0) {
        console.log(`module.addCmd:ERROR: Command has invalid cmdname.`);
        return false;
    }
    let cmdname = cmdobj.name[0];
    if (!cmdobj.process) return console.log(`module.addCmd:ERROR: Command ${cmdname} does not have a process.`);
    /*
    for (n of cmdobj.name) {
        if (this.cmdlist[n]) {
            console.log(`module.addCmd:ERROR: Command ${n} already exists.`);
            addcomplete = false;
            return;
        }

        this.cmdlist[n] = cmdobj;
    }*/
    if (this.cmdlist[cmdname]) {
        console.log(`module.addCmd:ERROR: Command ${n} already exists in this module.`);
        addcomplete = false;
        return;
    }
    this.cmdlist[cmdname] = cmdobj;
    if (this.serverOnly) cmdobj.serverOnly = true;
    if (this.dmOnly) cmdobj.dmOnly = true;
    return addcomplete;
}
cmdModuleobj.prototype.getDesc = function () {
    if (this.description) return this.description;
    else return '';
}

var command = function (cmdnames) {
    this.name = cmdnames;
}
command.prototype.getUseage = function () {
    if (!this.usage) return `This command does not have a usage description.`
    else {
        //console.log(`number of usages: ${this.usage.length}`);
        let usagetxt = `Usage of [${this.name.join(', ')}]: `;

        for (let value of this.usage)
            usagetxt += `\n**${config.prefix}${this.name[0]} ${value}`;
        return usagetxt;
    }
}
command.prototype.setCooldown = function (message) {
    //NOTE: apply binds the 'this' in the function to the scope of this prototype.setcooldown function... whoes 'this' is the command obj. 
    //so basically binds 'this' in the setcooldown function to the command obj
    setCD.apply(this, ['userCooldown', message.author.id]);
    if (message.guild && message.guild.available)
        setCD.apply(this, ['serverCooldown', message.guild.id]);
    setCD.apply(this, ['channelCooldown', message.channel.id]);
    function setCD(coolDownType, property) {
        if (this[coolDownType]) {
            let now = new Date();
            let cdlist = coolDownType + 'List';
            if (!this[cdlist]) this[cdlist] = [];
            this[cdlist][property] = now.setSeconds(now.getSeconds() + this[coolDownType]);
            console.log(`setcooldown: ${this.name[0]}[${cdlist}][${property}] = ${this[cdlist][property]}`);
        }
    }
}
command.prototype.inCooldown = function (message) {
    if (inCD.apply(this, ['userCooldown', message.author.id, `This command is time-restricted per user.`])) return true;
    if(message.guild && message.guild.available)
        if (inCD.apply(this, ['serverCooldown', message.guild.id, `This command is time-restricted per server.`])) return true;
    if (inCD.apply(this, ['channelCooldown', message.channel.id, `This command is time-restricted per channel.`])) return true;
    return false;

    function inCD(coolDownType, property, msg) {
        if (!this[coolDownType]) return false;
        let now = new Date();
        let nowtime = now.getTime();
        let cd = util.getChain(this, `${coolDownType}List.${property}`); //this.coolDownTypeList[property]
        if (cd) console.log("prop exists");
        if (cd && cd > nowtime) {//if current time has not surpassed cd time, means still in cooldown.
            util.replyWithTimedDelete(message, `${msg} Cooldown: ${(cd - nowtime) / 1000}seconds.`, 10 * 1000);//TODO get a time format function for this
            return true;
        } else if (cd && cd <= nowtime) {
            delete this[coolDownType + 'List'][property];//delete this
        }
        return false;
    }

}

module.exports = {
    cmdBaseobj: cmdBaseobj,
    cmdModuleobj: cmdModuleobj,
    command:command,
}