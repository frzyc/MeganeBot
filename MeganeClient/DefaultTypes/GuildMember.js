const { Type } = require("../")
module.exports = class GuildMember extends Type {
  constructor(client) {
    super(client, "guildmember")
  }
    static regex = /^(?:<@!?)?([0-9]+)>?$/
    validate(value, msg) {
      if (value === "message-author") return { value: msg.author }
      if (!msg.guild) return { error: "not in a guild" }
      let matches = value.match(this.regex)
      if (matches && msg.guild.members.has(matches[1])) {
        return { value: msg.guild.members.get(matches[1]) }
      } else return { error: Error() }
      /* TODO a search function for words as well.
		let members = null;
		
		if (msg.channel.type === "text") {//guild channel
			members = msg.channel.members
		} else if (msg.channel.type === "group") {//group DM

		}

		*/
    }

    parse(value) {
      return value
    }
}