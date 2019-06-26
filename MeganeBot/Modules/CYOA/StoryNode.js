/**
 * 
 */
const { Util } = require("../../../MeganeClient")
module.exports = class StoryNode {
    constructor(story, storyNodeObj) {
        /**
         * A reference to the Story this node belongs to.
         * @name StoryNode#story
         * @type {Story}
         * @readonly
         */
        Object.defineProperty(this, "story", { value: story })
        //TODO check fields and stuff

        Object.assign(this, storyNodeObj)
    }
    getMessageResolvable() {
        let msgobj = {
            messageOptions: {
                embed: {
                    title: this.title,
                    description: this.description,
                    fields: []
                }
            },
            reactions: []
        }
        for (let i = 0; i < (this.choices ? this.choices.length : 0); i++) {
            let choice = this.choices[i]
            msgobj.messageOptions.embed.fields.push({
                name: `${Util.getLetterSymbol(String.fromCharCode(97 + i))} ` + choice.name,
                value: choice.description
            })
            msgobj.reactions.push({
                emoji: Util.getLetterSymbol(String.fromCharCode(97 + i)),
                execute: (reactionMessage) => {
                    let nodeMsgRes = choice.node.getMessageResolvable()
                    nodeMsgRes.destination = reactionMessage.message
                    nodeMsgRes.edit = true
                    return nodeMsgRes
                }
            })
        }
        //if no choices, assume this node is gameover.
        if (!this.choices || this.choices.length === 0) {
            msgobj.messageOptions.embed.fields = [{
                name: "📖",//`📖 0 ${this.story.Currencyname ? this.story.Currencyname : "Points"}`,
                value: "Start Over?"
            },
            {
                name: "📚",
                value: "Select another story from the library"
            }]
            msgobj.reactions = [{
                emoji: "📖",
                execute: (reactionMessage) => {
                    let titleMsgRes = this.story.getMessageResolvable()
                    titleMsgRes.destination = reactionMessage.message
                    titleMsgRes.edit = true
                    return titleMsgRes
                }
            }, {
                emoji: "📚",
                execute: (reactionMessage, user) => {
                    let libMsgRes = user.client.CYOALibrary.getMessageResolvable()
                    libMsgRes.destination = reactionMessage.message
                    libMsgRes.edit = true
                    return libMsgRes
                }
            }]
        }
        return msgobj
    }

}