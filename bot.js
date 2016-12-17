const Discord = require('discord.js');
const ytdl = require('ytdl-core');
const config = require('./data/config.json');
const fs = require("fs");

const client = new Discord.Client();

//command object
var command = function (cmdname) {
    this.name = cmdname;
}
command.prototype.getUseage = function () {
    if (this.usage) return `Usage: ${config.prefix}${this.name} ${this.usage}`;
    else return `This command does not have a usage description.`
}

//commandlist
var cmdList = {};
cmdList.addCmd = function (cmdobj) {
    if (!cmdobj.name) {
        console.log(`addCmd:ERROR: Command has invalid cmdname.`);
        return false;
    }
    if (this[cmdobj.name]) {
        console.log(`addCmd:ERROR: Command ${cmdobj.name} already exists.`);
        return false;
    }
    if (!cmdobj.process) console.log(`addCmd:WARN: Command ${cmdobj.name} does not have a process.`);
    if (!cmdobj.usage) console.log(`addCmd:WARN: Command ${cmdobj.name} does not have a usage.`);
    this[cmdobj.name] = cmdobj;
    if (this.help && this.help.cmdlist) {
        this.help.cmdlist.push(cmdobj.name);
    }

    return true;
}

//general help command. He keeps track of all the commands, and process usages
let helpcmd = new command("help");
helpcmd.usage = "get some help mate, seriously."
helpcmd.cmdlist = [];//this keep track of all the commands
helpcmd.process = function (message, args) {
    if (args && args[0]) {// if ask for a specific command
        if (args[0].startsWith(config.prefix))
            args[0] = args[0].slice(config.prefix.length).toLowerCase();//incase someone asked !help !command
        if (cmdList[args[0]])
            message.reply(cmdList[args[0]].getUseage());
        else
            message.reply(`command ${args[0]} does not exist.`);
    } else {
        msg = `List of commands:\n`
        msg += this.cmdlist.sort().join(' ');
        msg += `\nUse !help [commandname] to get specific usage.`
        message.reply(msg); 
    }
}
cmdList.addCmd(helpcmd);

var basicResponse = {
    'hello': 'Hello.',//H-Hi... its not like I\'m replying back because I like you... BAKA
    'bestgirl': 'Kuriyama Mirai...obviously',
    'zone': 'Dont let me into my zone\nDont let me into my zone\nDont let me into my zone\nI\'m in my zone',
    'ping': 'pong',
    'pizza': ':pizza:',
    'surrender':':flag_white: DEFEATED :flag_white:'
};
var masterResponse = {
    'hello': 'Hello Master :heart:'
};

//TODO add basic response & masterresponse as commands

client.on('ready', () => {
    console.log(`Ready to server in ${client.channels.size} channels on ${client.guilds.size} servers, for a total of ${client.users.size} users.`);
    console.log(client.user);
    //client.user.setUsername("MeganeBot");
    //console.log(client.options);
});

client.on('message', message => {
    if (!message.content.startsWith(config.prefix)) return;

    if (message.author.bot) return; //wont respond to bots
    //if(message.author.id !== config.ownerid) return;//locked to me, FRED!

    args = message.content.split(' ').filter(a => a.length>0);//get split and get rid of zero length args
    const cmd = args.shift().slice(config.prefix.length).toLowerCase();//commands are not case-sensitive

    
    if (message.author.id === config.ownerid && masterResponse[cmd])
        simulateTypingReply(message, masterResponse[cmd]);
    else if(basicResponse[cmd]) 
        simulateTypingReply(message, basicResponse[cmd]);
    else if (cmdList[cmd]) {
        if (cmdList[cmd].reqperms && !message.member.permissions.hasPermissions(cmdList[cmd].reqperms)) return;//check if has permission
        console.log(`${cmd} args: ${args}`);
        cmdList[cmd].process(message, args);
    }
});

client.on("guildMemberAdd", (member) => {
    console.log(`New User "${member.user.username}" has joined "${member.guild.name}"`);
    member.guild.defaultChannel.sendMessage(`"${member.user.username}" has joined this server`);
});

//helper functions
//This function prevents the use of actual mentions within the return line by adding a zero-width character between the @ and the first character of the mention - blocking the mention from happening.
function clean(text) {
    if (typeof (text) === "string")
        return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
    else
        return text;
}

function simulateTyping(message, time, callback) {
    message.channel.startTyping();
    setTimeout(function () {
        callback();
        message.channel.stopTyping(true);
    }, time);
}
function simulateTypingReply(message, msg) {
    simulateTyping(message, (msg.length * 30 + 100), function () {
        message.reply(msg);
    });
}


//general commands
(function (clist) {
    var package = require('./package.json');

    let about = new command('about');
    about.usage = "get some information about me, MeganeBot :D"
    about.process = function (message, args) {
        msg = `Name: ${package.name} \nVersion: ${package.version} \nDescription: ${package.description}\nMaster(owner): <@${config.ownerid}>`;
        let uptime = Math.floor(process.uptime());
        let hours = Math.floor(uptime / (60*60))
        let minutes = Math.floor((uptime % (60*60))/60);
        let seconds = uptime % 60;
        msg += `\nUptime: ${hours} Hours ${minutes} Mintues and ${seconds} Seconds`;
        message.channel.sendMessage(msg);
    }
    clist.addCmd(about);

    let prune = new command('prune');
    prune.usage = "[number of your own messages to prune, max 100]";
    prune.process = function (message, args) {
        let messagecount = parseInt(args[0]);
        message.channel.fetchMessages({ limit: 100 })
            .then(messages => {
                let msg_array = messages.array();
                msg_array = msg_array.filter(m => m.author.id === message.author.id);
                // limit to the requested number + 1 for the command message
                if (msg_array.length > (messagecount + 1))
                    msg_array.length = messagecount + 1;
                msg_array.map(m => m.delete().catch(console.error));
            });
    }
    clist.addCmd(prune);

    let nick = new command('nick');
    nick.usage = "[desiredNickname] NOTE: botowner only.";
    nick.reqperms = ["MANAGE_NICKNAMES"];
    nick.process = function (message, args) {
        //if (message.author.id !== config.ownerid) return;
        let newname = args.join(' ');
        message.channel.members.get(client.user.id).setNickname(newname);
    }
    clist.addCmd(nick);

    let eval = new command('eval');
    eval.usage = "[string] \nNOTE: bot owner only";
    eval.process = function (message, args) {
        console.log("EVAL user:" + message.author.id + " should be " + config.ownerid);
        if (message.author.id !== config.ownerid) return;
        try {
            let code = args.join(' ');//args.slice(1).join(' ');
            console.log("code:" + code);
            let evaled = eval(code);

            if (typeof evaled !== "string")
                evaled = require("util").inspect(evaled);

            message.channel.sendCode("xl", clean(evaled));
        } catch (err) {
            message.channel.sendMessage("ERROR :" + clean(err) + "\n");
        }
    }
    clist.addCmd(eval);
} (cmdList));

//Color stuff
(function (clist) {
    let jsonfile = './data/color.json';
    var colorList = require(jsonfile);
    if (!colorList) colorList = [];

    //lets user change their own color.
    //the color roles are roles with only a color, they should not grant any permissions.
    let colorcmd = new command('color');
    colorcmd.usage = "[desired color]\nNOTE: choosing \"White\" will current color";
    colorcmd.process = function (message, args) {
        if (args[0].toLowerCase() === "white") {
            removeColorRoles();
            message.reply(`resetted your color to default.`);
            message.delete();
            return;
        }
        let color = colorList.find(val => val.toLowerCase() === args[0].toLowerCase())
        let colorrole = message.guild.roles.find(val => val.name.toLowerCase() === args[0]);
        if (colorrole) {
            console.log("selected role: " + colorrole.name);
            removeColorRoles()
            //message.member.roles.filter((r) => colorList.includes(r.name)).map(function (r) { console.log("check:" + r.name); });
            setTimeout(function () { // apparently this needs some time before you can add roles again...
                console.log("add role: " + colorrole.name);
                message.member.addRole(colorrole);
                message.reply(`changed your color to ${color}.`);
                message.delete();
            }, 500);
        }
        function removeColorRoles() {
            let currColors = message.member.roles.filter((r) => colorList.includes(r.name));
            message.member.removeRoles(currColors).catch(console.error);
        }
    }
    clist.addCmd(colorcmd);

    let colorlistcmd = new command('colorlist');
    colorlistcmd.process = function (message, args) {
        if (!colorList || colorList.length === 0) return;
        let res = colorList.join(", ");
        message.channel.sendMessage(res);
    }
    clist.addCmd(colorlistcmd);

    let coloraddcmd = new command('coloradd');
    coloraddcmd.usage = `[color role]\nNOTE: all role permissions will be removed. Color "White" cannot be added.`;
    coloraddcmd.reqperms = ["MANAGE_ROLES_OR_PERMISSIONS"]
    coloraddcmd.process = function (message, args) {
        if (!colorList) return;
        if (args[0].toLowerCase() === "white") return message.reply("Color \"White\" cannot be added.");
        if (colorList.find(val => val.toLowerCase() === args[0].toLowerCase())) return message.reply("Color already added.");
        let colorrole = message.guild.roles.find(val => val.name.toLowerCase() === args[0].toLowerCase());
        if (!colorrole) return message.reply("Invalid role");
        if (colorrole.color === 0) return message.reply("Role does not have a color.");
        let colorname = colorrole.name;
        colorrole.setPermissions([]);
        colorList.push(colorname);
        fs.writeFile(jsonfile, JSON.stringify(colorList), 'utf8', function () {
            message.reply(`${colorname} added, json file updated.`);
        });
    }
    clist.addCmd(coloraddcmd);

    //TODO coloraddnew //add a new color using the hex code
    //todo coloredit //edit the color using a hex code

} (cmdList));

//music
(function (clist) {
    var connection = null;
    var dispatcher = null;

    let joinvoice = new command('joinvoice');
    joinvoice.process = function (message, args) {
        let channel = message.member.voiceChannel
        if (!channel) {
            message.reply("BAKA... You are not in a voice channel. ");
            return;
        }
        channel.join()
            .then(conn => {
                connection = conn
                console.log('Connected!');
            })
            .catch(console.error);
    }
    clist.addCmd(joinvoice);

    let leavevoice = new command('leavevoice')
    leavevoice.process = function (message, args) {
        let me = message.guild.members.find("id", client.user.id);
        let channel = me.voiceChannel;
        if (channel) channel.leave();
        if (connection) {
            connection.disconnect();
            connection = null;
        }
    }
    clist.addCmd(leavevoice);

    let thefuck = new command('thefuck')
    thefuck.process = function (message, args) {
        if (connection) dispatcher = connection.playFile('Whatthefuckdidyousaytome.mp3');
    }
    clist.addCmd(thefuck);

    let dunkey = new command('dunkey')
    dunkey.process = function (message, args) {
        if (!connection) return;
        var stream = ytdl('https://www.youtube.com/watch?v=VjzgbZL12VI', { filter: 'audioonly' });
        dispatcher = connection.playStream(stream);
    }
    clist.addCmd(dunkey);

    let shutup = new command('shutup')
    shutup.process = function (message, args) {
        if (dispatcher) dispatcher.end();
    }
    clist.addCmd(shutup);

    let pause = new command('pause')
    pause.process = function (message, args) {
        if (dispatcher) dispatcher.pause();
    }
    clist.addCmd(pause);

    let resume = new command('resume')
    resume.process = function (message, args) {
        if (dispatcher) dispatcher.resume();
    }
    clist.addCmd(resume);

    let youtube = new command('youtube')
    youtube.process = function (message, args) {
        if (!connection) return;
        try {
            const streamOptions = { seek: 0, volume: 1 };
            var stream = ytdl(args[0], { filter: 'audioonly' });
            dispatcher = connection.playStream(stream, streamOptions);
        } catch (err) {
            message.channel.sendMessage(clean(err) + "\n");
        }
    }
    clist.addCmd(youtube);
} (cmdList))

client.login(config.token);