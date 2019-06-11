const Type = require("./Type")
module.exports = class GuildMember extends Type {
    constructor(client) {
        super(client, "guildmember")
    }
    validate(value, msg, arg) {
        if (value === "message-author") return true
        if (!msg.guild) return false
        let matches = value.match(/^(?:<@!?)?([0-9]+)>?$/)
        if (matches && msg.guild.members.has(matches[1])) {
            return true
        } else return false
        /* TODO a search function for words as well.
		let members = null;
		
		if (msg.channel.type === "text") {//guild channel
			members = msg.channel.members
		} else if (msg.channel.type === "group") {//group DM

		}

		*/
    }

    parse(value, msg, arg) {
        if (value === "message-author")
            return msg.author
        let matches = value.match(/^(?:<@!?)?([0-9]+)>?$/)
        if (matches) {
            return msg.guild.members.get(matches[1])
        }
    }
}