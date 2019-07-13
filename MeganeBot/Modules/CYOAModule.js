const { CommandModule } = require("@frzyc/meganeclient")
const Library = require("./CYOAModule/Library")
module.exports = class CYOAModule extends CommandModule {
  constructor(client) {
    super(client, {
      name: "CYOA Module",
      usage: "A module to play Choose-Your-Own-Adventure Games.",
      guildOnly: true
    })
    this.addCommandsIn(require("path").join(__dirname, "CYOAModule", "Commands"))

    this.library = new Library()

    let story = require("./CYOAModule/story.json")
    this.library.addStory(story)

  }
}
