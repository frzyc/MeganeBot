const { TextChannel, DMChannel, GroupDMChannel, Message } = require("discord.js")
const { Collection } = require("discord.js")
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
     * @property {boolean} [typing=false] - Does the bot pretend to type this message out? Generally shouldnt be used for edit messages
     * @property {boolean} [reply=false] - If destination is a Message, send the message as an reply to that message. (This is mutually exclusive to edit)
     * @property {ReactionUtil[]} [reactions] - An array of emojis to add to the message. Will delete all orginal emojis if the message already had emojis.
     * @property {number} [deleteTime] - Time in seconds to delete the message
     * @property {number} [destinationDeleteTime] - time in seconds to delete the destination message. (This is mutually exclusive to edit)
     */

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
        this.constructor.preCheck(client, msgResolvable)

        /**
         * A reference to the MeganeClient.
         * @name MessageFactory#client
         * @type {MeganeClient}
         * @readonly
         */
        Object.defineProperty(this, "client", { value: client })

        /**
         * The destination message, a place to get the context of the channel/author. Mutually exclusive to {@link MessageFactory#destChannel}
         * @name MessageFactory#destMessage
         * @private
         * @type {?external:Message}
         */
        if (msgResolvable.destMessage) this.destMessage = msgResolvable.destMessage

        /**
         * The destination channel. Mutually exclusive to {@link MessageFactory#destMessage}
         * @name MessageFactory#destChannel
         * @private
         * @type {?Channel}
         */
        if (msgResolvable.destChannel) this.destChannel = msgResolvable.destChannel

        /**
         * The content of the message to be processed.
         * @name MessageFactory#messageContent
         * @private
         * @type {?string}
         */
        if (msgResolvable.messageContent) this.messageContent = msgResolvable.messageContent

        /**
         * The content of the messageOptions to be processed. This has the embeds and tts and other options.
         * @name MessageFactory#messageOptions
         * @private
         * @type {?messageOptionsObject}
         */
        if (msgResolvable.messageOptions) this.messageOptions = msgResolvable.messageOptions

        /**
         * An array of {@link ReactionUtil}.
         * @name MessageFactory#reactions
         * @private
         * @type {?ReactionUtil[]}
         */
        if (msgResolvable.reactions) this.reactions = msgResolvable.reactions

        /**
         * Whether to edit the message with the new {@link MessageFactory#messageContent}, {@link MessageFactory#messageOptions} and {@link MessageFactory#reactions}.
         * @name MessageFactory#edit
         * @private
         * @type {?boolean}
         */
        this.edit = msgResolvable.edit ? msgResolvable.edit : false

        /**
         * Whether to simulate typing of the message before sending it. Will delay the sending of the message according to the length of {@link MessageFactory#messageContent}.
         * @name MessageFactory#typing
         * @private
         * @type {?boolean}
         */
        this.typing = msgResolvable.typing ? msgResolvable.typing : false

        /**
         * Whether to send the message as a reply. Must have {@link MessageFactory#destMessage}.
         * @name MessageFactory#reply
         * @private
         * @type {?boolean}
         */
        this.reply = msgResolvable.reply ? msgResolvable.reply : false

        /**
         * How long to send before deleting the generated message, in ms.
         * @name MessageFactory#deleteTime
         * @private
         * @type {?number}
         */
        if (typeof msgResolvable.deleteTime === "number") this.deleteTime = Math.floor(msgResolvable.deleteTime * 1000) //convert to ms

        /**
         * How long to send before deleting the {@link MessageFactory#destMessage}, in ms.
         * @name MessageFactory#destinationDeleteTime
         * @private
         * @type {?number}
         */
        if (typeof msgResolvable.destinationDeleteTime === "number") this.destinationDeleteTime = Math.floor(msgResolvable.destinationDeleteTime * 1000) //convert to ms
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
                let typeduration = this.typelength * 30 + 100
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
        if (Number.isInteger(this.destinationDeleteTime)  && this.destMessage && this.destMessage.deletable) this.destMessage.delete(this.destinationDeleteTime).catch(console.error)
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

    /**
     * A helper function to validate the options before the class is created.
     * @private
     * @param {MeganeClient} client
     * @param {MessageResolvable} msgResolvable
     */
    static preCheck(client, msgResolvable) {
        let msgResName = "MessageResolvable"
        if (!client) throw new Error("The client must be specified for MessageFactory.")
        if (typeof msgResolvable !== "object") throw new TypeError(`${msgResName} must be an Object.`)
        if (!msgResolvable.destination) throw new TypeError(`${msgResName} must have an destination, either a Message or a Channel`)
        if (!(msgResolvable.destination instanceof Message ||
            msgResolvable.destination instanceof DMChannel ||
            msgResolvable.destination instanceof GroupDMChannel ||
            msgResolvable.destination instanceof TextChannel
        )) throw new TypeError(`${msgResolvable}.destionation must be an instanceof Message, or TextChannel, DMChannel, GroupDMChannel.`)
        let destinationTypeofMessage = msgResolvable.destination instanceof Message
        if (destinationTypeofMessage)
            msgResolvable.destMessage = msgResolvable.destination
        else
            msgResolvable.destChannel = msgResolvable.destination
        if (msgResolvable.messageContent && typeof msgResolvable.messageContent !== "string") throw new TypeError(`${msgResName}.messageContent must be a string.`)
        if (msgResolvable.messageOptions && typeof msgResolvable.messageOptions !== "object") throw new TypeError(`${msgResName}.messageContent must be an object.`)
        if (msgResolvable.reactions && !typeof Array.isArray(msgResolvable.reactions)) throw new TypeError(`${msgResName}.reactions must be an Array.`)
        if (msgResolvable.reactions)
            for (let reaction of msgResolvable.reactions)
                if (!reaction.emoji) throw new TypeError(`Each element in ${msgResName}.reactions must have an emoji property.`)
        if (typeof msgResolvable.edit !== "undefined" && typeof msgResolvable.edit !== "boolean") throw new TypeError(`${msgResName}.edit must be an boolean.`)
        if (typeof msgResolvable.typing !== "undefined" && typeof msgResolvable.typing !== "boolean") throw new TypeError(`${msgResName}.typing must be an boolean.`)
        if (msgResolvable.typing && (!msgResolvable.messageContent && !msgResolvable.messageOptions)) throw new Error(`${msgResName}.typing must accompany either ${msgResName}.messageContent or ${msgResName}.messageOptions`)
        if (typeof msgResolvable.reply !== "undefined" && typeof msgResolvable.reply !== "boolean") throw new TypeError(`${msgResName}.reply must be an boolean.`)
        if (typeof msgResolvable.deleteTime === "number" && msgResolvable.deleteTime <= 0) throw new TypeError(`${msgResName}.deleteTime must be a positive integer.`)
        if (typeof msgResolvable.destinationDeleteTime === "number" && msgResolvable.destinationDeleteTime < 0) throw new TypeError(`${msgResName}.destinationDeleteTime must be a positive integer or 0.`)
        if (!destinationTypeofMessage) {
            if (msgResolvable.destinationDeleteTime) throw new Error(`${msgResName}.destinationDeleteTime does not work when ${msgResName}.destination is not a Message`)
            if (msgResolvable.reply) throw new Error(`${msgResName}.reply does not work when ${msgResName}.destination is not a Message`)
            if (msgResolvable.edit) throw new Error(`${msgResName}.edit does not work when ${msgResName}.destination is not a Message`)
        }
    }
}
module.exports = MessageFactory
