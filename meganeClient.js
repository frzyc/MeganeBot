const discord = require('discord.js');
class MeganeClient extends discord.Client {
    constructor(options = {}) {
        super(options);
        this.globalPrefix = options.prefix ? options.prefix : null;
        if (options.ownerid) {
            if (typeof options.ownerid === "string")
                options.owner = new Set([options.ownerid]);
            if (options.ownerid instanceof Array)
                options.owner = new Set(options.ownerid);
            this.once('ready', () => {
                for (const owner of options.owner) {
                    this.fetchUser(owner).catch(err => {
                        this.emit('warn', `Unable to fetch owner ${owner}.`);
                        this.emit('error', err);
                    });
                }
                delete options.ownerid;
            });
        }

        let commandDepot = require.main.exports.getRequire('cmdDepot');
        this.depot = new commandDepot(this);


        let CommandDispatcher = require.main.exports.getRequire('dispatcher');
        this.dispatcher = new CommandDispatcher(this, this.depot);

        this.on('message', (message) => { this.dispatcher.handleMessage(message); });
        this.on('messageUpdate', (oldMessage, newMessage) => { this.dispatcher.handleMessage(newMessage, oldMessage); });
        this.on('messageReactionAdd', (messageReaction, user) => { this.dispatcher.handleReaction(messageReaction, user); });
        this.on('messageReactionRemove', (messageReaction, user) => {
            if (user.bot) return; //wont respond to bots
            console.log("REMOVE REACTION BOOO");
        });
        this.on('guildMemberAdd', (member) => {
            console.log(`New User "${member.user.username}" has joined "${member.guild.name}"`);
            member.guild.defaultChannel.send(`"${member.user.username}" has joined this server`);
        });

        //a helper function to format strings
        if (!String.prototype.format) {
            String.prototype.format = function () {
                var args = arguments;
                return this.replace(/{(\d+)}/g, function (match, number) {
                    return typeof args[number] != 'undefined'
                        ? args[number]
                        : match
                        ;
                });
            };
        }
    }
    get prefix() {
        return this.globalPrefix;
    }
    set prefix(newPrefix) {
        this.globalPrefix = newPrefix;
        //globalPrefixChange , guild, prefix
        this.emit('globalPrefixChange', null, this.globalPrefix);
    }
    get owners() {
        if (!this.options.owner) return null;
        return this.options.owner;
    }
    isOwner(user) {
        if (!this.options.owner) return false;
        user = this.users.get(user);
        if (!user) throw new RangeError("user unresolvable.");
        if (this.options.owner instanceof Set) return this.options.owner.has(user.id);
        throw new RangeError('The client\'s "owner" option is an unknown value.');
    }


}
module.exports = MeganeClient;