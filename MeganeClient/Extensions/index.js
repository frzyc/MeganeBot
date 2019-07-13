const { Guild, Message, TextChannel, DMChannel, GroupDMChannel } = require("discord.js")
const extend = require("./extend")
const GuildExtension = require("./GuildExtension")
const MessageExtension = require("./MessageExtension")
const TextBasedChannelExtension = require("./TextBasedChannelExtension")
module.exports = {
  extend: extend,
  GuildExtension: GuildExtension,
  MessageExtension: MessageExtension,
  TextBasedChannelExtension: TextBasedChannelExtension
}

extend(Guild, GuildExtension)
extend(Message, MessageExtension)

//TextChannel, DMChannel, GroupDMChannel
extend(TextChannel,TextBasedChannelExtension)
extend(DMChannel,TextBasedChannelExtension)
extend(GroupDMChannel,TextBasedChannelExtension)


