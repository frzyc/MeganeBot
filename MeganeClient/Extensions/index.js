const { Guild, Message } = require("discord.js")
const extend = require("./extend")
const GuildExtension = require("./GuildExtension")
const MessageExtension = require("./MessageExtension")
module.exports = {
    extend: extend,
    GuildExtension: GuildExtension,
    MessageExtension: MessageExtension,
}

extend(Guild, GuildExtension)
extend(Message, MessageExtension)
