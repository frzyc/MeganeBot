module.exports = class TextBasedChannelExtension {
    /**
     * @typedef {Object} TextBasedChannelExtensionMessageFactoryOptions
     * @property {string} [messageContent] - A string for the content of the new message, or to edit an existing message.
     * @property {MessageOptions} [messageOptions] - Options to format embeds for the message.
     * @property {boolean} [typing=false] - Does the bot pretend to type this message out?
     * @property {ReactionUtil[]} [reactions] - An array of emojis to add to the message. Will delete all orginal emojis if the message already had emojis.
     * @property {number} [deleteTime] - Time in ms to delete the message
     */

    /**
     * Does all the actions inscribed by the options.
     * - Will simulate typing,
     * - Queue up deletion of message/original message
     * - Add reactions, and attach callbacks
     * @param {TextBasedChannelExtensionMessageFactoryOptions} - Options to pass to {@link MessageFactory}
     * @returns {Promise} Promise that resolve to the new message/edited message
     */
    async messageFactory(options) {
        options.destChannel = this
        return this.client.autoMessageFactory(options)
    }

}
