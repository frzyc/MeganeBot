const { TextChannel, DMChannel, GroupDMChannel, Message } = require('discord.js');
const { Collection } = require('discord.js');
/**
 * A Utilize class to handle Message creation/editing or adding reactions. 
 */
module.exports = class MessageUtil {
    /**
     * @typedef {Object} MessageUtilOptions
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
     * @typedef {Object} ReactionUtil
     * @property {string|Emoji|ReactionEmoji} emoji
     * @property {function} execute - a function to execute when someone reacts to this reaction.
     */

    /**
     * @param {MeganeClient} client 
     * @param {MessageUtilOptions} options 
     */
    constructor(client, options) {
        console.log('new MessageUtils');
        console.log(client);
        console.log(options);
        this.constructor.preCheck(client, options);
        Object.defineProperty(this, 'client', { value: client });
        this.constructor.preCheck(client, options);
        if (options.destMessage) this.destMessage = options.destMessage;
        if (options.destChannel) this.destChannel = options.destChannel;
        if (options.messageContent) this.messageContent = options.messageContent;
        if (options.messageOptions) this.messageOptions = options.messageOptions;
        if (options.reactions) this.reactions = options.reactions;
        this.edit = options.edit ? options.edit : false;
        this.typing = options.typing ? options.typing : false;
        this.reply = options.reply ? options.reply : false;
        if (options.deleteTime) this.deleteTime = options.deleteTime * 10000; //convert to ms
        if (options.destinationDeleteTime) this.destinationDeleteTime = options.destinationDeleteTime * 1000; //convert to ms
    }
    async execute() {
        let msgPromise = null;
        if (this.typing) {//a simulated typing msg
            let channel = this.destMessage ? this.destMessage.channel : this.destChannel;
            channel.startTyping();
            msgPromise = new Promise((replyResolve) => {
                let typelength = this.messageContent ? this.messageContent.length : 0 + this.messageOptions ? JSON.stringify(this.messageOptions).length : 0;
                let typeduration = this.typelength * 30 + 100;
                setTimeout(() => {
                    channel.stopTyping(true);
                    return replyResolve(sendMessage());
                }, (typeduration));
            });
        } else
            msgPromise = this.sendMessage();
        let msgToPostProcess = await msgPromise;
        if (!msgToPostProcess && this.destMessage) msgToPostProcess = this.destMessage;//there is a chance that no presending is needed, and its only updating the emoji/delete
        if (!msgToPostProcess) return;// in theory this shouldn't happen...
        //do the post process on the message
        //TODO if a message is deleted, remove it from the waitlist
        if (this.deleteTime && msgToPostProcess.deletable) msgToPostProcess.delete(this.deleteTime).catch(console.error);
        if (this.destinationDeleteTime && this.destMessage && this.destMessage.deletable) message.delete(this.destinationDeleteTime).catch(console.error);

        if (this.reactions) {
            await msgToPostProcess.clearReactions();
            for (let reaction of this.reactions)
                await msgToPostProcess.react(reaction.emoji);
            //add the functions to the waitlist after the reactions are all added.
            for (let reaction of this.reactions) {
                if (reaction.execute) {
                    if (!this.client.dispatcher.watchlist.has(msgToPostProcess.id))
                        this.client.dispatcher.watchlist.set(msgToPostProcess.id, new Collection());
                    this.client.dispatcher.watchlist.get(msgToPostProcess.id).set(reaction.emoji, reaction);
                }
            }
        }
        return msgToPostProcess;
    }

    sendMessage() {
        if (this.destMessage) {
            if (this.reply)
                return this.destMessage.reply(this.messageContent, this.messageOptions);
            else if (this.edit)
                return this.destMessage.edit(this.messageContent, this.messageOptions);
            else
                return this.destMessage.channel.send(this.messageContent, this.messageOptions);
        }
        return this.destChannel.send(this.messageContent, this.messageOptions);
    }

    static preCheck(client, options) {
        if (!client) throw new Error('The client must be specified for MessageUtil.');
        if (typeof options !== 'object') throw new TypeError('MessageUtilOptions must be an Object.');
        if (!options.destination) throw new TypeError('MessageUtilOptions must have an destination, either a Message or a Channel');
        if (!(options.destination instanceof Message ||
            options.destination instanceof DMChannel ||
            options.destination instanceof GroupDMChannel ||
            options.destination instanceof TextChannel
        )) throw new TypeError('MessageUtilOptions.destionation must be an instanceof Message, or TextChannel, DMChannel, GroupDMChannel.');
        let destinationTypeofMessage = options.destination instanceof Message;
        if (destinationTypeofMessage)
            options.destMessage = options.destination;
        else
            options.destChannel = options.destination;
        if (options.messageContent && typeof options.messageContent !== 'string') throw new TypeError('MessageUtilOptions.messageContent must be a string.');
        if (options.messageOptions && typeof options.messageOptions !== 'object') throw new TypeError('MessageUtilOptions.messageContent must be an object.');
        if (options.reactions && !typeof Array.isArray(options.reactions)) throw new TypeError('MessageUtilOptions.reactions must be an Array.');
        if (options.reactions)
            for (let reaction of options.reactions)
                if (!reaction.emoji) throw new TypeError('Each element in MessageUtilOptions.reactions must have an emoji property.');
        if (typeof options.edit !== 'undefined' && typeof options.edit !== 'boolean') throw new TypeError('MessageUtilOptions.edit must be an boolean.');
        if (typeof options.typing !== 'undefined' && typeof options.typing !== 'boolean') throw new TypeError('MessageUtilOptions.typing must be an boolean.');
        if (options.typing && (!options.messageContent && !optoins.messageOptions)) throw new Error('MessageUtilOptions.typing must accompany either MessageUtilOptions.messageContent or MessageUtilOptions.messageOptions');
        if (typeof options.reply !== 'undefined' && typeof options.reply !== 'boolean') throw new TypeError('MessageUtilOptions.reply must be an boolean.');
        if (options.deleteTime && (!Number.isInteger(options.deleteTime) || options.deleteTime < 0)) throw new TypeError('MessageUtilOptions.deleteTime must be a positive integer.');
        if (options.destinationDeleteTime && (!Number.isInteger(options.destinationDeleteTime) || options.destinationDeleteTime < 0)) throw new TypeError('MessageUtilOptions.destinationDeleteTime must be a positive integer.');
        if (!destinationTypeofMessage) {
            if (options.destinationDeleteTime) throw new Error('MessageUtilOptions.destinationDeleteTime does not work when MessageUtilOptions.destination is not a Message');
            if (options.reply) throw new Error('MessageUtilOptions.reply does not work when MessageUtilOptions.destination is not a Message');
            if (options.edit) throw new Error('MessageUtilOptions.edit does not work when MessageUtilOptions.destination is not a Message');
        }
    }
}