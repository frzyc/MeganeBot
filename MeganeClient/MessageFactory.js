const { Channel, Message, Emoji, ReactionEmoji } = require("discord.js")
const { Collection } = require("discord.js")
const joi = require("@hapi/joi")
/**
 * A Utilize class to handle Message creation/editing or adding reactions.
 */
class MessageFactory {
    /**
     * @typedef {Object} MessageResolvable
     * @property {Message|Channel} destination - A message or a channel as a destination to send the message.
     * @property {string} [messageContent] - A string for the content of the new message, or to edit an existing message.
     * @property {MessageOptions} [messageOptions] - Options to format embeds for the message.
     * @property {boolean} [edit=false] - If destination is a Message, apply all the content/emojis to this message as an edit.
     * @property {boolean} [typing=false] - Does the bot pretend to type this message out?
     * @property {boolean} [reply=false] - If destination is a Message, send the message as an reply to that message. (This is mutually exclusive to edit)
     * @property {ReactionUtil[]} [reactions] - An array of emojis to add to the message. Will delete all orginal emojis if the message already had emojis.
     * @property {number} [deleteTime] - Time in seconds to delete the message
     * @property {number} [destinationDeleteTime] - time in seconds to delete the destination message. (This is mutually exclusive to edit)
     */
    static MessageResolvableSchema = joi.object({
        destination: joi.alternatives().try([joi.object().type(Message), joi.object().type(Channel)]).required(),
        messageContent: joi.string(),
        messageOptions: joi.object(),//TODO validation
        edit: joi.when("destination", {//can't .edit the destChannel
            is: joi.object().type(Channel),
            then: joi.boolean().only(false),
            otherwise: joi.boolean()
        }),
        typing: joi.boolean(),
        reply: joi.when("destination", {//can't reply to a channel
            is: joi.object().type(Channel),
            then: joi.boolean().only(false),
            otherwise: joi.boolean()
        }).when("edit", {//can't edit and reply
            is: true,
            then: joi.boolean().only(false),
            otherwise: joi.boolean()
        }),
        reactions: joi.array().items(joi.object().keys({
            emoji: joi.alternatives().try([
                joi.string(),
                joi.object().type(Emoji),
                joi.object().type(ReactionEmoji),
            ]).required(),
            execute: joi.func().maxArity(2)
        })).single(),
        deleteTime: joi.number().positive().unit("seconds"),
        destinationDeleteTime: joi.number().min(0).unit("seconds")
            .when("edit", {
                is: true,
                then: joi.forbidden(),
            }).when("destination", {//can't delete the destChannel
                is: joi.object().type(Channel),
                then: joi.forbidden()
            }),
        destMessage: joi.object().type(Message),
        destChannel: joi.object().type(Channel)
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
    ).when(
        joi.object({
            destination: joi.object().type(Message).required()
        }).unknown(),
        {
            then: joi.object().rename("destination", "destMessage", { alias: true })
        }
    ).when(
        joi.object({
            destination: joi.object().type(Channel).required()
        }).unknown(),
        {
            then: joi.object().rename("destination", "destChannel", { alias: true })
        }
    )

    /**
     * The reaction to add to a message. Can have a callback function to triggered by someone reacting to it.
     * @typedef {Object} ReactionUtil
     * @property {string|Emoji|ReactionEmoji} emoji - The emoji to use.
     * @property {function} execute - a function to execute when someone reacts to this reaction.
     */

    /**
     * @param {MeganeClient} client
     * @param {MessageResolvable} msgResolvable
     */
    constructor(client, msgResolvable) {
        /**
         * A reference to the MeganeClient.
         * @name MessageFactory#client
         * @type {MeganeClient}
         * @readonly
         */
        Object.defineProperty(this, "client", { value: client })

        let result = this.constructor.MessageResolvableSchema.validate(msgResolvable)
        if (result.error) throw result.error
        Object.assign(this, result.value)
        if (this.deleteTime) this.deleteTime = Math.floor(this.deleteTime * 1000) //convert to ms
        if (this.destinationDeleteTime) this.destinationDeleteTime = Math.floor(this.destinationDeleteTime * 1000) //convert to ms

        /**
         * The destination message, a place to get the context of the channel/author. Mutually exclusive to {@link MessageFactory#destChannel}
         * @name MessageFactory#destMessage
         * @private
         * @type {?external:Message}
         */

        /**
         * The destination channel. Mutually exclusive to {@link MessageFactory#destMessage}
         * @name MessageFactory#destChannel
         * @private
         * @type {?Channel}
         */

        /**
         * The content of the message to be processed.
         * @name MessageFactory#messageContent
         * @private
         * @type {?string}
         */

        /**
         * The content of the messageOptions to be processed. This has the embeds and tts and other options.
         * @name MessageFactory#messageOptions
         * @private
         * @type {?messageOptionsObject}
         */

        /**
         * An array of {@link ReactionUtil}.
         * @name MessageFactory#reactions
         * @private
         * @type {?ReactionUtil[]}
         */

        /**
         * Whether to edit the message with the new {@link MessageFactory#messageContent}, {@link MessageFactory#messageOptions} and {@link MessageFactory#reactions}.
         * @name MessageFactory#edit
         * @private
         * @type {?boolean}
         */

        /**
         * Whether to simulate typing of the message before sending it. Will delay the sending of the message according to the length of {@link MessageFactory#messageContent}.
         * @name MessageFactory#typing
         * @private
         * @type {?boolean}
         */

        /**
         * Whether to send the message as a reply. Must have {@link MessageFactory#destMessage}.
         * @name MessageFactory#reply
         * @private
         * @type {?boolean}
         */

        /**
         * How long to send before deleting the generated message, in ms.
         * @name MessageFactory#deleteTime
         * @private
         * @type {?number}
         */

        /**
         * How long to send before deleting the {@link MessageFactory#destMessage}, in ms.
         * @name MessageFactory#destinationDeleteTime
         * @private
         * @type {?number}
         */
    }

    /**
     * Does all the actions inscribed by the options.
     * - Will simulate typing,
     * - Queue up deletion of message/original message
     * - Add reactions, and attach callbacks
     * @returns {Promise}
     */
    async execute() {
        let msgPromise = null
        if (this.typing) {//a simulated typing msg
            let channel = this.destMessage ? this.destMessage.channel : this.destChannel
            channel.startTyping()
            msgPromise = new Promise((replyResolve) => {
                let typelength = this.messageContent ? this.messageContent.length : 0 + this.messageOptions ? JSON.stringify(this.messageOptions).length : 0
                let typeduration = typelength * 30 + 100
                setTimeout(() => {
                    channel.stopTyping(true)
                    return replyResolve(this.sendMessage())
                }, (typeduration))
            })
        } else
            msgPromise = this.sendMessage()
        let msgToPostProcess = await msgPromise
        if (!msgToPostProcess && this.destMessage) msgToPostProcess = this.destMessage//there is a chance that no presending is needed, and its only updating the emoji/delete
        if (!msgToPostProcess) return// in theory this shouldn't happen...
        //do the post process on the message
        //TODO if a message is deleted, remove it from the waitlist
        if (Number.isInteger(this.deleteTime) && msgToPostProcess.deletable) msgToPostProcess.delete(this.deleteTime).catch(console.error)
        if (Number.isInteger(this.destinationDeleteTime) && this.destMessage && this.destMessage.deletable) this.destMessage.delete(this.destinationDeleteTime).catch(console.error)
        let dmChannel = msgToPostProcess.channel.type === "dm"//reactions and such interactions does not work for a DM channel.
        if (this.reactions) {
            if (!dmChannel)
                await msgToPostProcess.clearReactions()
            for (let reaction of this.reactions)
                await msgToPostProcess.react(reaction.emoji)
            //add the functions to the waitlist after the reactions are all added.
            for (let reaction of this.reactions) {
                if (reaction.execute && !dmChannel) {
                    if (!this.client.dispatcher.watchlist.has(msgToPostProcess.id))
                        this.client.dispatcher.watchlist.set(msgToPostProcess.id, new Collection())
                    this.client.dispatcher.watchlist.get(msgToPostProcess.id).set(reaction.emoji, reaction)
                }
            }
        }
        return msgToPostProcess
    }

    /**
     * Sends a message.
     * @private
     * @returns {Promise}
     */
    sendMessage() {
        if (this.destMessage) {
            if (this.reply)
                return this.destMessage.reply(this.messageContent, this.messageOptions)
            else if (this.edit && this.destMessage.editable)
                return this.destMessage.edit(this.messageContent, this.messageOptions)
            else
                return this.destMessage.channel.send(this.messageContent, this.messageOptions)
        }
        return this.destChannel.send(this.messageContent, this.messageOptions)
    }
}
module.exports = MessageFactory
