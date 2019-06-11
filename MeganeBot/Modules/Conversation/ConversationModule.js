const {CommandModule} = require("../../../MeganeClient")
module.exports = class ConversationModule extends CommandModule{
    constructor(client){
        super(client, {
            name: "Conversation Module",
            usage: "A module to converse with MeganeBot.",
            guildOnly: true
        })
        this.addCommandsIn(require("path").join(__dirname, "Commands"))
    }
}