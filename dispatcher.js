const playerData = require.main.exports.getRequire('playerdata').playerData;
const currency = require.main.exports.getRequire('playerdata').currency;
const messageWatchList = require.main.exports.getRequire('util').messageWatchList;
const util = require.main.exports.getRequire('util');
class CommandDispatcher {
    constructor(client, cmdBase) {
        console.log("commandDispatcher const");
        //make this read only property
        Object.defineProperty(this, 'client', { value: client });
        this.cmdBase = cmdBase;
        console.log(this.client);
    }
    
    async handleMessage(message, oldMessage) {//old messgae before the update
        if (message.author.bot) return; //wont respond to bots

        if (playerData && util.percentChance(3)) {
            playerData.getOrCreatePlayer(message.author.id).wallet.addMoney(1);
            message.react(currency.emoji).catch(console.error);
        }
        let cont = message.content;
        
        //normal message processing with commands
        let startprefix = cont.startsWith(this.client.prefix);
        let startmention = cont.startsWith(`<@!${this.client.user.id}>`) || cont.startsWith(`<@${this.client.user.id}>`);
        if (!startprefix && !startmention) return;

        var args = cont.split(' ').filter(a => a.length > 0);//get split and get rid of zero length args
        var cmd = args.shift().slice(this.client.prefix.length).toLowerCase();//commands are not case-sensitive
        if (startmention)
            cmd = args.shift().toLowerCase();// shift again cause the cmd is the 2nd arg, commands are not case-sensitive
        console.log(`MESSAGE: cmd(${cmd})  args(${args})`);
        if (this.cmdBase.cmdlist[cmd]) {
            let cmdobj = this.cmdBase.cmdlist[cmd];
            let restriction = cmdobj.checkRestriction(message);
            if (restriction !== '') return util.createMessage(util.redel(`This command is restricted to ${restriction} only.`), message);

            if (cmdobj.reqBotPerms &&
                message.channel.type === 'text' && //commands are only existant in text channels
                !message.channel.permissionsFor(this.client.user).has(cmdobj.reqBotPerms)) //check if meganeBot has the permissions to do this action
                return util.createMessage({ messageContent: `I don't have enough permissions to use this command. need:\n${cmdobj.reqBotPerms.join(', and ')}`, deleteTime: 5 * 60 * 1000 });
            if (cmdobj.reqUserPerms && !message.member.permissions.hasPermissions(cmdobj.reqUserPerms))
                return util.createMessage({ messageContent: `You have enough permissions to use this command. need:\n${cmdobj.reqUserPerms.join(', and ')}`, deleteTime: 60 * 1000 });
            console.log(`${cmd} args: ${args}`);
            let inCD = cmdobj.inCooldown(message);
            if (inCD) {
                let msg = '';
                //this accounts for multiple cooldowns
                if (inCD.userCooldown) msg += `This command is time-restricted per user. Cooldown: ${inCD.userCooldown / 1000} seconds.\n`
                if (inCD.serverCooldown) msg += `This command is time-restricted per server. Cooldown: ${inCD.serverCooldown / 1000} seconds.\n`
                if (inCD.channelCooldown) msg += `This command is time-restricted per channel. Cooldown: ${inCD.channelCooldown / 1000} seconds.\n`
                return util.createMessage(util.redel(msg), message);
            }
            //if this has a cost, and the user doesnt have any moneys
            if (cmdobj.cost && playerData.getOrCreatePlayer(message.author.id).wallet.getAmount() < cmdobj.cost)
                return util.createMessage(util.redel(`You don't have enough ${currency.nameplural} to use this command, need ${currency.symbol}${cmdobj.cost}.`), message);

            //perliminary check of args
            if (cmdobj.argsTemplate) {
                args = cmdobj.checkArgs(args, message);
                if (args.every(v => v === null)) {
                    let msg = 'Bad Parameter:\n' + cmdobj.getUseage();
                    return util.createMessage({
                        messageContent: msg,
                        reply: true,
                        deleteTime: 3 * 60 * 1000
                    }, message);
                }
                console.log('bot args:')
                console.log(args);
            }
            cmdobj.setCooldown(message);
            //use Promise.resolve just incase a process doesnt return a promise...
            Promise.resolve(cmdobj.process(message, args, this.client)).then(response => {
                console.log("cmd resolved");
                //console.log(response);
                if (response) util.createMessage(response, message).catch(console.error);
            }).catch(reject => {
                console.log("cmd rejected");
                cmdobj.clearCooldown(message);
                //console.log(reject);
                if (reject) util.createMessage(reject, message).catch(console.error);;
            });

        }
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
        } else if (playerData && util.percentChance(5)) {
            playerData.getOrCreatePlayer(messageReaction.message.author.id).wallet.addMoney(1);
            messageReaction.message.react(currency.emoji).catch(console.error);//TODO: need to find how emojis work
        }

        //let msgOwnerAmount = msgOwnerPlayer.wallet.getAmount();
        //let currencyname = msgOwnerAmount > 1 ? currency.nameplural : currency.name
        //console.log(`${messageReaction.message.member.displayName} now has ${msgOwnerAmount} ${currencyname}`);
    }
}
module.exports = CommandDispatcher;