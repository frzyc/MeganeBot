const { TextChannel, DMChannel, GroupDMChannel, Message, Emoji, ReactionEmoji } = require("discord.js")
const joi = require("@hapi/joi")
/**
 * A Utilize class to handle Message creation/editing or adding reactions.
 */
class MessageFactory {
    /**
     * @typedef {Object} MessageResolvable
     * @property {[Message|TextChannel|DMChannel|GroupDMChannel]} destination - A message or a channel as a destination to send the message.
     * @property {string} [messageContent] - A string for the content of the new message, or to edit an existing message.
     * @property {MessageOptions} [messageOptions] - Options to format embeds for the message.
     * @property {boolean} [edit=false] - If destination is a Message, apply all the content/emojis to this message as an edit.
     * @property {boolean} [typing=false] - Does the bot pretend to type this message out?
     * @property {boolean} [reply=false] - If destination is a Message, send the message as an reply to that message. (This is mutually exclusive to edit)
     * @property {ReactionUtil[]} [reactions] - An array of emojis to add to the message. Will delete all orginal emojis if the message already had emojis.
     * @property {number} [deleteTime] - Time in seconds to delete the message
     * @property {number} [destinationDeleteTime] - time in seconds to delete the destination message. (This is mutually exclusive to edit)
     */
    static textBasedChannel = joi.alternatives().try([joi.object().type(TextChannel), joi.object().type(DMChannel), joi.object().type(GroupDMChannel)])
    static messageResolvableSchema = joi.object({
      destination: joi.alternatives().try([joi.object().type(Message), MessageFactory.textBasedChannel]),
      destMessage: joi.object().type(Message),
      destChannel: MessageFactory.textBasedChannel,
      messageContent: joi.string(),
      messageOptions: joi.object(),//TODO validation
      edit: joi.when("destChannel", {//can't .edit the destChannel
        is: joi.exist(),
        then: joi.boolean().only(false),
        otherwise: joi.boolean()
      }),
      typing: joi.boolean(),
      reply: joi.when("destChannel", {//can't reply to a channel
        is: joi.exist(),
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
      deleteTime: joi.number().positive().unit("ms"),
      destinationDeleteTime: joi.number().min(0).unit("ms")
        .when("edit", {
          is: true,
          then: joi.forbidden(),
        }).when("destChannel", {//can't delete the destChannel
          is: joi.exist(),
          then: joi.forbidden()
        }),
    })
      .xor("destMessage", "destChannel").error(() => "Must define one of: .destination, .destMessage or .destChannel")
      .when(//when .typing, specify either .messageContent or .messageOptions
        joi.object({
          typing: joi.equal(true).required()
        }).unknown(),
        {
          then: joi.object({
            messageContent: joi.any(),
            messageOptions: joi.any()
          }).or("messageContent", "messageOptions")
        }
      ).when(
        joi.object({
          destination: joi.object().type(Message).required()
        }).unknown(),
        {
          then: joi.object().rename("destination", "destMessage")
        }
      ).when(
        joi.object({
          destination: MessageFactory.textBasedChannel.required()
        }).unknown(),
        {
          then: joi.object().rename("destination", "destChannel")
        }
      )

    static MAX_TYPING_DURATION_MS = 5000

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

      let result = MessageFactory.messageResolvableSchema.validate(msgResolvable)
      if (result.error) throw result.error
      Object.assign(this, result.value)

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
      if (this.typing)
        await this.simulateTyping()
      return this.sendMessage().then(async msg => {
        if (typeof this.deleteTime === "number" && msg.deletable)
          msg.delete(this.deleteTime).catch(console.error)
        if (typeof this.destinationDeleteTime === "number" && this.deletable)
          this.delete(this.destinationDeleteTime).catch(console.error)
        if (this.reactions) {
          if (msg.channel.type !== "dm")//bot can't remove user reactions in a DM channel
            await msg.clearReactions()
          for (let reaction of this.reactions)
            await msg.react(reaction.emoji)
          //add the functions to the waitlist after the reactions are all added.
          for (let reaction of this.reactions)
            if (reaction.execute)
              this.client.dispatcher.addReactionToWatchlist(msg.id, reaction)
        }
        return msg
      })
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
     * Simulating the bot typing the response message using the length of {@link MessageFactory#messageContent} and {@link MessageFactory#messageOptions}.
     * @private
     */
    simulateTyping() {
      let channel = this.destMessage ? this.destMessage.channel : this.destChannel
      let typeduration =
            ((this.messageContent ? this.messageContent.length : 0) + (this.messageOptions ? JSON.stringify(this.messageOptions).length : 0)) * 30 + 100
      return MessageFactory.typeInChannel(channel, typeduration > MessageFactory.MAX_TYPING_DURATION_MS ? MessageFactory.MAX_TYPING_DURATION_MS : typeduration)
    }
    /**
     *
     * @param {Channel} channel
     * @param {number} time in ms
     * @returns {Promise}
     */
    static typeInChannel(channel, time) {
      channel.startTyping()
      return new Promise((resolve) => {
        setTimeout(() => {
          channel.stopTyping()
          return resolve()
        }, time)
      })
    }
}
module.exports = MessageFactory
