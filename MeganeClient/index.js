
const provider = "Provider"
const {Command,CommandArgument,CommandDepot,CommandDispatcher,CommandMessage,CommandModule} = require("./Command")
const {Util,permissions} = require("./Utility")
const index = {
    MeganeClient: require("./MeganeClient"),
    Command: Command,
    CommandArgument: CommandArgument,
    CommandDepot: CommandDepot,
    CommandDispatcher: CommandDispatcher,
    CommandMessage: CommandMessage,
    CommandModule: CommandModule,
    MessageFactory: require("./MessageFactory"),
    Util: Util,
    permissions: permissions,

    Type: require("./DefaultTypes/Type"),

    Table: require(`./${provider}/Table`),
    Database: require(`./${provider}/Database`),
    GuildTable: require(`./${provider}/GuildTable`),

    CommandArgumentParseError: require("./Errors/CommandArgumentParseError")
}
module.exports = index
require("./Extensions/")

/**
 * The discord.js Client.
 * @external Client
 * @see {@link https://discord.js.org/#/docs/main/master/class/Client}
 */

/**
 * Basically a map with extra Utility.
 * @external Collection
 * @see {@link https://discord.js.org/#/docs/main/master/class/Collection}
 */

/**
 * The discord.js Message Object.
 * @external Message
 * @see {@link https://discord.js.org/#/docs/main/master/class/Message}
 */

/**
 * The discord.js MessageRection Object.
 * @external MessageReaction
 * @see {@link https://discord.js.org/#/docs/main/master/class/MessageReaction}
 */

/**
 * The discord.js User Object.
 * @external User
 * @see {@link https://discord.js.org/#/docs/main/master/class/User}
 */

/**
 * The discord.js Guild Object.
 * @external Guild
 * @see {@link https://discord.js.org/#/docs/main/master/class/Guild}
 */
