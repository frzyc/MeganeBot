const { Emoji, ReactionEmoji, Collection } = require("discord.js")
const joi = require("@hapi/joi")
module.exports = class TextBasedChannelExtension {
    /**
     * @typedef {Object} messageFactoryOptions
     * @property {string} [messageContent] - A string for the content of the new message, or to edit an existing message.
     * @property {MessageOptions} [messageOptions] - Options to format embeds for the message.
     * @property {boolean} [typing=false] - Does the bot pretend to type this message out?
     * @property {ReactionUtil[]} [reactions] - An array of emojis to add to the message. Will delete all orginal emojis if the message already had emojis.
     * @property {number} [deleteTime] - Time in ms to delete the message
     */

    static messageResolvableSchema = joi.object({
        messageContent: joi.string(),
        messageOptions: joi.object(),//TODO validation
        typing: joi.boolean(),
        reactions: joi.array().items(joi.object().keys({
            emoji: joi.alternatives().try([
                joi.string(),
                joi.object().type(Emoji),
                joi.object().type(ReactionEmoji),
            ]).required(),
            execute: joi.func().maxArity(2)
        })).single(),
        deleteTime: joi.number().integer().positive().unit("ms")
    }).when(//when .typing, specify either .messageContent or .messageOptions
        joi.object({
            typing: joi.equal(true).required()
        }).unknown(),
        {
            then: joi.object({
                messageContent: joi.any(),
                messageOpsadtions: joi.any()
            }).or("messageContent", "messageOptions")
        }
    )

    /**
     * Does all the actions inscribed by the options.
     * - Will simulate typing,
     * - Queue up deletion of message/original message
     * - Add reactions, and attach callbacks
     * @returns {Promise} Promise that resolve to the new message/edited message
     */
    async messageFactory(options) {
        let result = this.constructor.messageResolvableSchema.validate(options)
        if (result.error) throw result.error
        options = result.value
        if (options.typing) {
            let typeduration =
                ((this.messageContent ? this.messageContent.length : 0) + (this.messageOptions ? JSON.stringify(this.messageOptions).length : 0)) * 30 + 100
            await this.typeInChannel(this, typeduration)
        }

        return (() => {
            let content = options.messageContent
            let mOption = options.messageOptions
            return this.send(content, mOption)
        })().then(async msg => {
            if (typeof options.deleteTime === "number" && msg.deletable)
                msg.delete(options.deleteTime).catch(console.error)
            if (options.reactions) {
                if (msg.channel.type !== "dm")//bot can't remove user reactions in a DM channel
                    await msg.clearReactions()
                for (let reaction of options.reactions)
                    await msg.react(reaction.emoji)
                //add the functions to the waitlist after the reactions are all added.
                for (let reaction of options.reactions) {
                    if (reaction.execute) {
                        if (!this.client.dispatcher.watchlist.has(msg.id))
                            this.client.dispatcher.watchlist.set(msg.id, new Collection())
                        this.client.dispatcher.watchlist.get(msg.id).set(reaction.emoji, reaction)
                    }
                }
            }
        })
    }

    /**
     *
     * @param {Channel} channel
     * @param {number} time in ms
     * @returns {Promise}
     */
    typeInChannel(channel, time) {
        channel.startTyping()
        return new Promise((resolve) => {
            setTimeout(() => {
                channel.stopTyping()
                return resolve()
            }, time)
        })
    }

}