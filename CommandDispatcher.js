//const playerData = require.main.exports.getRequire('playerdata').playerData;
//const currency = require.main.exports.getRequire('playerdata').currency;
const messageWatchList = require.main.exports.getRequire('util').messageWatchList;
const Command = require.main.exports.getRequire('command');
const CommandMessage = require.main.exports.getRequire('commandmessage');
const util = require.main.exports.getRequire('util');
/**
 * Interface to handle commands from a CommandDepot
 */
class CommandDispatcher {
    /**
     * @param {MeganeClient} client 
     * @param {CommandDepot} commandDepot 
     */
    constructor(client, commandDepot) {
        Object.defineProperty(this, 'client', { value: client });
        this.commandDepot = commandDepot;
        this.preprocesses = new Set();
        //this.restrictions = new Set();
        this.pattern = null;
    }
    /**
     * Parse through a new message / an edited message
     * @param {Message} message 
     * @param {Message} oldMessage 
     */
    async handleMessage(message, oldMessage) {//old messgae before the update
        if (!this.preCheckMessage(message, oldMessage)) return;
        if (!message.guild.members.has(message.author.id)) {
			await message.guild.members.fetch(message.author.id);
		}
        this.preprocess(message, oldMessage);
        
        //TODO add as preprocess in economy module
        /*//if this has a cost, and the user doesnt have any moneys
        if (command.cost && playerData.getOrCreatePlayer(message.author.id).wallet.getAmount() < command.cost)
            return util.createMessage(util.redel(`You don't have enough ${currency.nameplural} to use this command, need ${currency.symbol}${command.cost}.`), message);
        */

        if (oldMessage) Object.defineProperty(message, 'oldMessage', { value: oldMessage });

        //TODO this should go into economy module as a preprocess...
        /*if (playerData && util.percentChance(3)) {
            playerData.getOrCreatePlayer(message.author.id).wallet.addMoney(1);
            message.react(currency.emoji).catch(console.error);
        }*/

        const cmdMsg = this.parseMessage(message);
        //cmdMsg.command.CmdPreProcess;
        //cmdMsg.command.CmdRestrict;
        //this.restrict(cmdMsg);

        if (cmdMsg) {
            cmdMsg.execute();
        } //else throw new Error('Unable to resolve command.');
    }
    async handleReaction(messageReaction, user) {
        if (user.bot) return; //wont respond to bots
        console.log(`NEW REACTION BOOO YEAH emoji.name:${messageReaction.emoji.name}, emoji.id:${messageReaction.emoji.id}, emoji.identifier:${messageReaction.emoji.identifier}, emoji.toString():${messageReaction.emoji.toString()}`);

        //console.log(messageReaction.emoji.name);
        //console.log(messageReaction.emoji.id);
        //console.log(messageReaction.emoji.identifier);
        //console.log(messageReaction.emoji.toString());
        //just give the player some money for now...
        if (messageWatchList[messageReaction.message.id]) {
            console.log("IN messageWatchList");
            //console.log(messageWatchList[messageReaction.message.id]);
            console.log("messageReaction.toString():" + messageReaction.emoji.toString());
            if (messageReaction.emoji.toString() in messageWatchList[messageReaction.message.id].emojiButtons) {
                console.log("IN messageWatchList with emoji");
                Promise.resolve(messageWatchList[messageReaction.message.id].emojiButtons[messageReaction.emoji.toString()](messageReaction, user)).then(response => {
                    console.log("emoji resolved");
                    //console.log(response);
                    if (response) util.createMessage(response, messageReaction.message).catch(console.error);
                }).catch(reject => {
                    console.log("emoji rejected");
                    //console.log(reject);
                    if (reject) util.createMessage(reject, messageReaction.message).catch(console.error);;
                });
                //console.log(user);
                messageReaction.remove(user.id).catch(console.error);
            }
        }
        //TODO move to economy 
        /*else if (playerData && util.percentChance(5)) {
            playerData.getOrCreatePlayer(messageReaction.message.author.id).wallet.addMoney(1);
            messageReaction.message.react(currency.emoji).catch(console.error);//TODO: need to find how emojis work
        }*/

        //let msgOwnerAmount = msgOwnerPlayer.wallet.getAmount();
        //let currencyname = msgOwnerAmount > 1 ? currency.nameplural : currency.name
        //console.log(`${messageReaction.message.member.displayName} now has ${msgOwnerAmount} ${currencyname}`);
    }
    /**
     * Add a function to execute for almost every message, even ones without commands. Message is preprocessed before parsing for commands and restrictions
     * Note: this is relatively expensive, since almost all messages will be preprocessed. Add preprocessing if you absolutely need to go through every message. 
     * @param {function} preprocess 
     */
    addPreprocess(preprocess) {
        if (typeof preprocess !== 'function') throw new TypeError("Preprocess must be a function.");
        if (this.preprocesses.has(preprocess)) return false;
        this.preprocesses.add(preprocess);
        return true;
    }
    /**
     * Removes a preprocess
     * @param {function} preprocess 
     */
    removePrerocess(preprocess) {
        if (typeof preprocess !== 'function') throw new TypeError("Preprocess must be a function.");
        if (this.preprocesses.has(preprocess)) return false;
        this.preprocesses.add(preprocess);
        return true;
    }
    /**
     * Preprocess this message using all the registered preprocesses.
     * @param {Message} message 
     * @param {Message} oldMessage
     */
    preprocess(message, oldMessage) {
        for (prepro of this.preprocesses) prepro(message, oldMessage);
    }

    /**
     * A function that takes a CommandMessage, and makes a determination whether it should be executed or not. 
     * return false if the CommandMessage should not be stopped, and keep going to be processed
     * reutrn a String for the reason why the CommandMessage has to be blocked.
     * @typedef {function} Restriction
     */
    /**
     * Add a restriction to process the message after it gets parsed for commands. 
     * @param {Restriction} restriction  
     * @returns {boolean} Whether the addition was successful
     */
    /*addRestrction(restriction) {
        if (typeof restriction !== 'function') throw new TypeError("Restriction must be a function.");
        if (this.restrictions.has(restriction)) return false;
        this.restrictions.add(restriction);
        return true;
    }*/
    /**
     * Removes a restriction.
     * If it was added as an command-specific restriction, it must be removed for that command.
     * @param {Restriction} restriction 
     */
    /*removeRestrction(restriction, command) {
        if (typeof restriction !== 'function') throw new TypeError('Restriction must be a function.');
        return this.restrictions.delete(restriction);
    }*/
    /**
     * Process a parsed CommandMessage through the registered restrictions.
     * @param {CommandMessage} cmdMsg 
     * @returns {String} if CommandMessage is restricted.
     * @private
     */
    /*restrict(cmdMsg) {
        for (const restriction of this.restrictions) {
            const restrictMsg = restriction(cmdMsg);
            if (restrictMsg) {
                this.client.emit('commandBlocked', cmdMsg, restrictMsg);
                return restrictMsg
            }
        }
        return null;
    }*/
    /**
     * this is executed right after receiving the message.
     * Will reject(return false) for messages:
     * * by a bot
     * * that are edits, but same as the original message
     * @param {Message} message the message to handle.
     * @param {OldMessage} OldMessage the message before the update.
     * @private
     */
    preCheckMessage(message, OldMessage) {
        if (message.author.bot) return false; //wont respond to bots
        if (OldMessage && OldMessage.content === message.content) return false;
        return true;
    }
    /**
     * Parse the cmdstring, and arguments for this message.
     * @param {Message} message message to parse for commands
     * @returns {?CommandMessage}
     */
    parseMessage(message){
        let cont = message.content;
        //normal message processing with commands

        if(!this.pattern) this.buildPattern();

        const matches = this.pattern.exec(cont);
        if(!matches) return null;
        const cmd = this.client.depot.resolveCommand(matches[2]);
        const argString = cont.substring(matches[0].length);
        if(!cmd) return null;
        return new CommandMessage(message, cmd, argString);
    }
    buildPattern(){
        const escapedPrefix = util.escapeRegexString(this.client.prefix);
        /* matches {prefix}cmd
         * <@{id}> cmd
         * <@!{id}> cmd
         */
        this.pattern = new RegExp(
            `^(${escapedPrefix}\\s*|<@!?${this.client.user.id}>\\s+(?:${escapedPrefix})?)([^\\s]+)`, 'i'
        );
        return this.pattern;
    }


}
module.exports = CommandDispatcher;