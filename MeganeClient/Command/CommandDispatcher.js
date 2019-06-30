const CommandMessage = require("./CommandMessage")
const { Util } = require("../Utility")
const { Collection, DMChannel, GroupDMChannel } = require("discord.js")
/**
 * A class to handle received {@link external:Message}, and then finding corresponding {@link Command}s within the message from a {@link CommandDepot}.
 */
class CommandDispatcher {
    /**
     * @param {MeganeClient} client
     * @param {CommandDepot} commandDepot
     */
    constructor(client, commandDepot) {

        /**
         * A reference to the MeganeClient.
         * @name CommandMessage#client
         * @type {MeganeClient}
         * @readonly
         */
        Object.defineProperty(this, "client", { value: client })

        /**
         * The {@link CommandDepot} that is the database of commands.
         * @type {CommandDepot}
         */
        this.commandDepot = commandDepot

        /**
         * A storage for all the {@link Preprocess}s.
         * @type {Set<Preprocess>}
         */
        this.preprocesses = new Set()

        /**
         * A watchlist to keep track of some messages. for the callbacks of {@link ReactionUtil#execute}
         * @private
         * @type {external:Collection<string,external:Collection<emoji,ReactionUtil>>}
         */
        this.watchlist = new Collection()
    }
    /**
     * Handle a new message / an edited message
     * @param {external:Message} message
     * @param {external:Message} oldMessage
     */
    async handleMessage(message, oldMessage) {//old messgae before the update
        if (!this.preCheckMessage(message, oldMessage)) return
        let reasons = this.preprocess(message, oldMessage)
        if (reasons) return
        if (oldMessage) Object.defineProperty(message, "oldMessage", { value: oldMessage })
        const cmdMsg = await this.parseMessage(message)
        if (cmdMsg) {
            cmdMsg.execute()
        } //else throw new Error('Unable to resolve command.');
    }

    /**
     * Handle a reaction to a message. This usually calls the callback added by {@link ReactionUtil}.
     * @param {external:MessageReaction} messageReaction
     * @param {external:User} user
     */
    async handleReaction(messageReaction, user) {
        if (user.bot) return //wont respond to bots
        //console.log(messageReaction);
        //console.log(`NEW REACTION BOOO YEAH emoji.name:${messageReaction.emoji.name}, emoji.id:${messageReaction.emoji.id}, emoji.identifier:${messageReaction.emoji.identifier}, emoji.toString():${messageReaction.emoji.toString()}`);
        if (this.watchlist.has(messageReaction.message.id)) {
            let emojiCollection = this.watchlist.get(messageReaction.message.id)
            if (emojiCollection.has(messageReaction.emoji.toString())) {
                if (messageReaction.message.channel.type !== "dm")//cannot remove reactions from dm channels
                    await messageReaction.remove(user.id)
                this.handleResponse(await emojiCollection.get(messageReaction.emoji.toString()).execute(messageReaction, user), messageReaction.message)
            }
        }
    }

    /**
     * Handle a response as a result of {@link Command#execute}.
     * @param {null|string|MessageResolvable} response
     * @param {external:Message} message - The Message that triggered the command.
     */
    async handleResponse(response, message) {
        if (!response) return
        if (typeof response === "string") {
            message.reply(response)
        } else if (typeof response === "object" && !(response instanceof Promise)) {
            //try {
            this.client.autoMessageFactory(response)
            //} catch (err) {
            //    console.log(err);
            //}
        } else {
            throw new TypeError("Response must be typeof [null|string|MessageResolvable].")
        }
    }

    /**
     * A function that takes (message, OldMessage), and makes a determination whether it should be executed or not.
     * @typedef {function} Preprocess
     * @returns {false|string} - return false if the CommandMessage should not be stopped, and keep going to be processed; a String for the reason why the CommandMessage has to be blocked.
     */

    /**
     * Add a function to execute for almost every message, even ones without commands. Message is preprocessed before parsing for commands.
     * Note: this is relatively expensive, since almost all messages will be preprocessed.
     * @param {Preprocess} preprocess
     */
    addPreprocess(preprocess) {
        if (typeof preprocess !== "function") throw new TypeError("Preprocess must be a function.")
        if (this.preprocesses.has(preprocess)) return false
        this.preprocesses.add(preprocess)
        return true
    }

    /**
     * Removes a preprocess
     * @param {Preprocess} preprocess
     */
    removePrerocess(preprocess) {
        if (typeof preprocess !== "function") throw new TypeError("Preprocess must be a function.")
        if (this.preprocesses.has(preprocess)) return false
        this.preprocesses.add(preprocess)
        return true
    }
    /**
     * Preprocess this message using all the registered preprocesses.
     * @param {external:Message} message
     * @param {external:Message} oldMessage
     * @returns {null|string[]}
     */
    preprocess(message, oldMessage) {
        let reasons = []
        for (let prepro of this.preprocesses) {
            let reason = prepro(message, oldMessage)
            if (reason) {
                reasons.push(reason)
            }
        }
    }

    /**
     * this is executed right after receiving the message.
     * Will reject(return false) for messages:
     * - by a bot
     * - that are edits, but same as the original message
     * @param {external:Message} message the message to handle.
     * @param {external:Message} OldMessage the message before the update.
     * @private
     */
    preCheckMessage(message, OldMessage) {
        if (message.author.bot) return false //wont respond to bots
        if (OldMessage && OldMessage.content === message.content) return false
        return true
    }

    /**
     * Parse the cmdstring, and arguments for this message.
     * @param {external:Message} message - Message to parse for commands
     * @returns {?CommandMessage}
     */
    async parseMessage(message) {
        let cont = message.content
        const pattern = await this.buildPattern(message)
        const matches = pattern.exec(cont)
        if (!matches) return null
        const cmd = this.client.depot.resolveCommand(matches[2])
        const argString = cont.substring(matches[0].length)
        if (!cmd) return null
        return new CommandMessage(this.client, message, cmd, argString)
    }

    /**
     * A helper function to generate a regex that parses out the command using the prefix/mentions.
     * @private
     * @param {external:Message} message - Provides a context to get the prefix.
     */
    async buildPattern(message) {
        //when a message is from a guild, must use the prefix from the guild, if the guild has the prefix unset, then only mentions will work.
        //else, for a dm message, both the client's global prefix and mentions will work.
        let prefix = message.guild ? message.guild.prefix : null
        if (message.channel instanceof GroupDMChannel || message.channel instanceof DMChannel)
            prefix = this.client.prefix
        //if the prefix is either null or undefined, ie not a typeof string, try to resolve it.
        if (typeof prefix !== "string" && message.guild) {
            prefix = await message.guild.resolvePrefix()
        }


        /* matches {prefix}cmd
         * <{prefix}{cmd}
         * <@{id}> {cmd}
         * <@!{id}> {cmd}
         */
        if (!prefix) {
            return new RegExp(`(^<@!?${this.client.user.id}>\\s+)([^\\s]+)`, "i")
        }
        let escapedPrefix = Util.escapeRegexString(prefix)
        return new RegExp(`^(${escapedPrefix}\\s*|<@!?${this.client.user.id}>\\s+(?:${escapedPrefix})?)([^\\s]+)`, "i")
    }
}
module.exports = CommandDispatcher
