const discord = require('discord.js');
class MeganeClient extends discord.Client {
    constructor(options = {}) {
        //option parsing
        super(options);
        this.globalPrefix = options.prefix ? options.prefix : null;
        this.ownerid = options.ownerid ? options.ownerid : 0;

        let cmdBaseobj = require.main.exports.getRequire('command').cmdBaseobj;
        this.cmdBase = new cmdBaseobj();


        let CommandDispatcher = require.main.exports.getRequire('dispatcher');
        this.dispatcher = new CommandDispatcher(this, this.cmdBase);

        this.on('message', (message) => { this.dispatcher.handleMessage(message); });
        this.on('messageReactionAdd', (messageReaction, user) => { this.dispatcher.handleReaction(messageReaction, user); });
        this.on('messageReactionRemove', (messageReaction, user) => {
            if (user.bot) return; //wont respond to bots
            console.log("REMOVE REACTION BOOO");
        });
        this.on('guildMemberAdd', (member) => {
            console.log(`New User "${member.user.username}" has joined "${member.guild.name}"`);
            member.guild.defaultChannel.send(`"${member.user.username}" has joined this server`);
        });
        this.on('ready', () => {
            if (reconnTimer) {
                clearTimeout(reconnTimer);
                reconnTimer = null;
            }
            console.log(`Ready to serve in ${client.channels.size} channels on ${client.guilds.size} servers, for a total of ${client.users.size} users.`);
            console.log(client.user);
        });
    }
    get prefix() {
        return this.globalPrefix;
    }
    set prefix(newPrefix) {
        this.globalPrefix = newPrefix;
        //globalPrefixChange , guild, prefix
        this.emit('globalPrefixChange', null, this.globalPrefix);
    }

}
module.exports = MeganeClient;