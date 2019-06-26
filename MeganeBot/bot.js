const { MeganeClient } = require("../MeganeClient")
console.log(`Starting MeganeBot\nNode version: ${process.version}`)

var config
try {//do a config.json check, the bot will not operate without a valid config.
    config = require("./data/config.json")
} catch (e) {
    console.log("\nMeganeBot needs an ./data/config.json file with a valid bot license. An Error have been encountered:\n\n" + e.message)
    process.exit()
}

//initiate new client
const client = new MeganeClient({
    prefix: config.prefix,
    ownerids: config.ownerids,
    profilePictureDirectory: require("path").join(__dirname, "/glassesicon")
})
exports.client = client

let reconnTimer = null
// Handle discord.js warnings
client
    .on("error", (m) => console.log("[error]", m))
    .on("warn", (m) => console.log("[warn]", m))
    .on("debug", (m) => console.log("[debug]", m))
    .on("ready", () => {
        if (reconnTimer) {
            clearTimeout(reconnTimer)
            reconnTimer = null
        }
        console.log(`Ready to serve in ${client.channels.size} channels on ${client.guilds.size} servers, for a total of ${client.users.size} users.`)
        console.log(client)
    });

//something to deal with spawn errors
(function () {
    var childProcess = require("child_process")
    var oldSpawn = childProcess.spawn
    function mySpawn() {
        console.log("spawn called")
        console.log(arguments)
        var result = oldSpawn.apply(this, arguments)
        return result
    }
    childProcess.spawn = mySpawn
})()
client.depot.addModules([
    require("./Modules/Music/MusicModule"),
    require("./Modules/Conversation/ConversationModule"),
    require("./Modules/CYOA/CYOAModule"),
])


client.login(config.token).then((m) => {
    console.log(`login success! ${m}`)
}).catch((m) => {
    console.log(`Error with login: ${m}`)
})
