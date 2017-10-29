const discord = require('discord.js');
const util = require.main.exports.getRequire('util');
/**
 * This is the main command object.
 * .name: 'cmdname'
 * .aliases:['cmdalias1','cmdalias2']
 * .usage: ['usemeoneway','usemeanotherway'] can support multiple usages, used by help command
 * .argsTemplate: [[typings for usemeoneway],[typings for usemeanotherway]] //list of templates to precheck params against
 * 
 * restriction properties
 * .owneronly: bool //true -> only owner can use this command
 * .serverOnly: bool
 * .dmOnly: bool
 * .reqperms: [] necessary permissions needed to run command
 * .requserperms: [] require the user calling this command to have perms
 * 
 * Cooldowns    
 * .usercooldown: number //time in second required for user to reuse this command
 * .servercooldown: number //time in second required for server to reuse this command
 * .channelcooldown: number //time in second required for channel to reuse this command
 * .execute: (message, args, client) => {
 *     return new Promise((resolve,reject) => {
 * 	       //Whatever function you want here to process the command stuff look in util.js for resolve message formatting
 * 	       return resolve({ Resolved message });
 *         return reject({ Resolved message });
 *     })
 * }
 * 
 * functions
 * .prototype.getusage: function(ind)//get all usage or usage[ind]
 * .prototype.setCooldown: function(message)//put cmd on cooldown for specific cooldowns(see above in cooldowns)
 * .prototype.inCooldown: function(message)//check if a specific cooldown still applies
 * .prototype.clearCooldown: function(message)//clear all the cooldowns for this cmd
 * .prototype.checkRestriction: function(message)//check if a message is restricted in any manner(see restrictions above)
 * 
 * new template usage
.templates :[
    {
        args:[
            {
                type: int,
                label: number
            },
            {
                type: word,
                label: name
            }
        ],
        usage: "usage of this template"
    }
]
*/
module.exports = class Command {
    /**
     * @typedef {CommandOptions}
     * @property {String} cmdname the name of the command. Should be unique to avoid conflicts
     * @property {String} id . Will only be used internally
     */
    constructor(client, options) {
        Object.defineProperty(this, 'client', { value: client });
        if (!options.name || typeof options.name !== 'string') throw new TypeError('Command name must be a string.');
        if (options.aliases && !Array.isArray(options.aliases)) throw new TypeError('Command aliases must be an Array of unique strings.');
        if (!options.id) options.id = options.name.toLowerCase();
        this.name = options.name;
        this.id = options.id;
        this.aliases = options.aliases ? options.aliases : [];
    }
    getUseage(ind) {
        if (!this.usage) return `This command does not have a usage description.`
        else {
            let usagetxt = `Usage of **${this.name}${this.aliases.length>0 ? ", "+ this.aliases.join(", "):""}**:`;//TODO add aliases
            if (isFinite(ind) && ind < this.usage.length) {
                return this.usage[ind].format(this.client.prefix + this.name);
            } else {
                //console.log(`number of usages: ${this.usage.length}`);
                

                for (let value of this.usage)
                    usagetxt += `\n${value.format(this.client.prefix + this.name)}`;
                return usagetxt;
            }
        }
    }
    setCooldown(message) {
        let setCD = (coolDownType, property) => {
            if (this[coolDownType]) {
                let now = new Date();
                let cdlist = coolDownType + 'List';
                if (!this[cdlist]) this[cdlist] = {};
                this[cdlist][property] = now.setSeconds(now.getSeconds() + this[coolDownType]);
                console.log(`setcooldown: ${this.name}[${cdlist}][${property}] = ${this[cdlist][property]}`);
            }
        }
        setCD('userCooldown', message.author.id);
        if (message.guild && message.guild.available)
            setCD('serverCooldown', message.guild.id);
        setCD('channelCooldown', message.channel.id);
    }
    inCooldown(message) {
        let inCD = (coolDownType, property, msg) => {
            if (!this[coolDownType]) return 0;
            let now = new Date();
            let nowtime = now.getTime();
            let cd = util.getChain(this, `${coolDownType}List.${property}`); //this.coolDownTypeList[property]
            if (cd && cd > nowtime) //if current time has not surpassed cd time, means still in cooldown.
                return cd - nowtime;
            else if (cd && cd <= nowtime)
                delete this[coolDownType + 'List'][property];//delete this
            return 0;
        }
        let ret = {
            userCooldown: inCD('userCooldown', message.author.id),//`This command is time-restricted per user.`
            serverCooldown: message.guild && message.guild.available ? inCD('serverCooldown', message.guild.id) : 0, //`This command is time-restricted per server.`
            channelCooldown: inCD('channelCooldown', message.channel.id)//`This command is time-restricted per channel.`
        }

        return (!ret.userCooldown && !ret.serverCooldown && !ret.channelCooldown) ? null : ret;
    }
    clearCooldown(message) {
        let clrCD = (coolDownType, property, msg) => {
            if (!this[coolDownType]) return;
            if (util.hasChain(this, `${coolDownType}List.${property}`)) //this.coolDownTypeList[property]
                delete this[coolDownType + 'List'][property];//delete this
        }
        clrCD('userCooldown', message.author.id);
        if (message.guild && message.guild.available)
            clrCD('serverCooldown', message.guild.id);
        clrCD('channelCooldown', message.channel.id);
    }
    checkArgs(args, message) {
        if (this.argsTemplate) return this.argsTemplate.map(tem => util.parseArgs(tem, args.slice(0), message));
    }
    checkRestriction(message) {
        //check Location restriction
        let returnMsg = null;
        if (this.dmOnly && message.channel.type === 'text') returnMsg = 'direct message';
        else if (this.serverOnly && (message.channel.type === 'dm' || message.channel.type === 'group')) returnMsg = 'server';
        else if (this.ownerOnly && !this.client.isOwner(message.author.id)) returnMsg = 'botowner only';
        if (returnMsg)
            util.createMessage(util.redel(`This command is restricted to ${returnMsg} only.`), message);
        return false;

        //check permission restriction
        if (this.reqBotPerms &&
            message.channel.type === 'text' && //commands are only existant in text channels
            !message.channel.permissionsFor(this.client.user).has(this.reqBotPerms)) { //check if meganeBot has the permissions to do this action
            util.createMessage({ messageContent: `I don't have enough permissions to use this command. need:\n${this.reqBotPerms.join(', and ')}`, deleteTime: 5 * 60 * 1000 });
            return false;
        }
        if (this.reqUserPerms && !message.member.permissions.hasPermission(this.reqUserPerms)) {
            util.createMessage({ messageContent: `You don't have enough permissions to use this command. need:\n${this.reqUserPerms.join(', and ')}`, deleteTime: 60 * 1000 });
            return false;
        }

        //check cooldown restriction
        let inCD = this.inCooldown(message);
        if (inCD) {
            let msg = '';
            //this accounts for multiple cooldowns
            if (inCD.userCooldown) msg += `This command is time-restricted per user. Cooldown: ${inCD.userCooldown / 1000} seconds.\n`
            if (inCD.serverCooldown) msg += `This command is time-restricted per server. Cooldown: ${inCD.serverCooldown / 1000} seconds.\n`
            if (inCD.channelCooldown) msg += `This command is time-restricted per channel. Cooldown: ${inCD.channelCooldown / 1000} seconds.\n`
            return util.createMessage(util.redel(msg), message);
        }

    }
}
