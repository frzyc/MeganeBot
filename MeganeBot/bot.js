const { MeganeClient } = require("@frzyc/meganeclient")
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
client.depot.addModulesIn(require("path").join(__dirname, "Modules"))

// Handle discord.js warnings
client
  .on("error", (m) => console.log("[error]", m))
  .on("warn", (m) => console.log("[warn]", m))
  .on("debug", (m) => console.log("[debug]", m))
  .on("ready", () => {
    console.log(`Ready to serve in ${client.channels.size} channels on ${client.guilds.size} servers, for a total of ${client.users.size} users.`)
  })

client.login(config.token).then((m) => {
  console.log(`login success! ${m}`)
}).catch((m) => {
  console.log(`Error with login: ${m}`)
})
