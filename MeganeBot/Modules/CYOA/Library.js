const { Util } = require("../../../MeganeClient")
const Story = require("./Story")
module.exports = class Library {
    constructor() {
        this.lib = new Map()
    }
    addStory(obj) {
        let st = new Story(this, obj)
        this.lib.set(st.title, st)
        //TODO check version of story to see whether to load. currently all story will be reloaded.
    }
    getMessageResolvable(dest) {
        //generate the message object resolvable for listing the stories
        let msgobj = {
            destination:dest,
            messageOptions: {
                embed: {
                    title: "CYOA Library",
                    description: "List of stories you can read.",
                    fields: []
                }
            },
            reactions: []
        }
        let stories = Array.from(this.lib.values())
        
        //iterate through the stories and add it to the msgobj resolvable
        for (let i = 0; i < stories.length; i++) {
            let story = stories[i]

            msgobj.messageOptions.embed.fields.push({
                name: `${Util.getLetterSymbol(String.fromCharCode(97 + i))} ` + story.title,
                value: story.excerpt
            })
            msgobj.reactions.push({
                emoji: Util.getLetterSymbol(String.fromCharCode(97 + i)),
                execute: (reactionMessage) => {
                    let storyMsgRes = story.getMessageResolvable()
                    storyMsgRes.destination = reactionMessage.message
                    storyMsgRes.edit = true
                    return storyMsgRes
                }
            })
        }
        return msgobj
    }
}