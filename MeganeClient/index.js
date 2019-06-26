
const provider = "Provider"

const index = {
    MeganeClient: require("./MeganeClient"),
    Command: require("./Command"),
    CommandArgument: require("./CommandArgument"),
    CommandDepot: require("./CommandDepot"),
    CommandDispatcher: require("./CommandDispatcher"),
    CommandMessage: require("./CommandMessage"),
    CommandModule: require("./CommandModule"),
    MessageFactory: require("./MessageFactory"),
    Util: require("./Utility/Util"),
    permissions: require("./Utility/permissions.json"),

    Type: require("./DefaultTypes/Type"),
    
    Table: require(`./${provider}/Table`),
    Database: require(`./${provider}/Database`),
    GuildTable: require(`./${provider}/GuildTable`)
}
module.exports = index
require("./Extensions/GuildExtension")

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
