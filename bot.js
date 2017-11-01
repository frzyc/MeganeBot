//little helper function to keep track of the files... for now
exports.getRequire = function (modulename) {
    if (modulename === 'client') return require('./meganeClient');
    if (modulename === 'dispatcher') return require('./CommandDispatcher');
    if (modulename === 'util') return require('./utility/util');
    if (modulename === 'config') return require('./data/config.json');
    if (modulename === 'playerdata') return require('./modules/playerData');
    if (modulename === 'cmdDepot') return require('./CommandDepot');
    if (modulename === 'commandmodule') return require('./CommandModule');
    if (modulename === 'command') return require('./Command');
    if (modulename === 'commandmessage') return require('./CommandMessage');
    if (modulename === 'commandargument') return require('./CommandArgument');
    if (modulename === 'type') return require('./Types/Type');
    if (modulename === 'permissions') return require('./utility/permissions.json');
    throw 'codefile not found!';
}
const MeganeClient = require.main.exports.getRequire('client');
console.log(`Starting MeganeBot\nNode version: ${process.version}\nDiscord.js version: ${MeganeClient.version}`);

var config;
try {//do a config.json check, the bot will not operate without a valid config.
    config = require('./data/config.json');
} catch (e) {
    console.log('\nMeganeBot needs an ./data/config.json file with a valid bot license. An Error have been encountered:\n\n' + e.message)
    process.exit()
}

//initiate new client
const client = new MeganeClient({
    prefix: config.prefix,
    ownerid: config.ownerid
});
exports.client = client;

let reconnTimer = null;
// Handle discord.js warnings
client
    .on('error', (m) => console.log('[error]', m))
    .on('warn', (m) => console.log('[warn]', m))
    .on('debug', (m) => console.log('[debug]', m))
    .on('ready', () => {
        if (reconnTimer) {
            clearTimeout(reconnTimer);
            reconnTimer = null;
        }
        console.log(`Ready to serve in ${client.channels.size} channels on ${client.guilds.size} servers, for a total of ${client.users.size} users.`);
        console.log(client);
    })
    .on('disconnect', (m) => {
        console.log(`[disconnect]:ReconnTimer:${reconnTimer}`, m)
        function reconn(time) {
            if (reconnTimer != null) return;
            console.log(`Reconnecting after ${time / 1000} seconds`);
            reconnTimer = setTimeout((m) => {
                client.login(config.token).then((m) => {
                    reconnTimer = null;
                    console.log(`Reconnected! ${m}`);
                }).catch((m) => {
                    reconnTimer = null;
                    console.log(`Error with reconnecting: ${m}`);
                    reconn(time * 2);
                })
            }, time);
        }
        reconn(10000);
    });


process.on("unhandledRejection", err => {
    console.error("Uncaught Promise Error: \n");
    console.log(err);
    console.log(err.stack);
});

process.on('uncaughtException', function (err) {//technically not a good idea, but YOLO
    console.log("UNCAUGHTEXCEPTION!");
    console.log(err);
    console.log(err.stack);
});

//something to deal with spawn errors
(function () {
    var childProcess = require("child_process");
    var oldSpawn = childProcess.spawn;
    function mySpawn() {
        console.log('spawn called');
        console.log(arguments);
        var result = oldSpawn.apply(this, arguments);
        return result;
    }
    childProcess.spawn = mySpawn;
})();
client.depot.addTypes([
    require('./Types/Boolean'),
    require('./Types/Integer'),
    require('./Types/String'),
    require('./Types/Float')
])
.addModules([
    require('./modules/TestModule/TestModule')
])

/* A small test client just to test some messages
const Discord = require('discord.js');
const client = new Discord.Client();

client.on('ready', () => {
  console.log('I am ready!');
});

client.on('message', message => {
  if (message.content === 'ping') {
    message.reply('pong');
  }
});*/

client.login(config.token).then((m) => {
    console.log(`login success! ${m}`);
}).catch((m) => {
    console.log(`Error with login: ${m}`);
});

/*
process.stdin.resume();//so the program will not close instantly

function exitHandler(options, err) {
    if (options.cleanup) console.log('clean');
    if (err) console.log(err.stack);
    if (options.exit) process.exit();

}

//do something when app is closing
process.on('exit', exitHandler.bind(null, { cleanup: true }));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, { exit: true }));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, { exit: true }));*/

