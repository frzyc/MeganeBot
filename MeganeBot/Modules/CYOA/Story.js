const StoryNode = require("./StoryNode")
/**
 * This class holds the story. This is basically a array of story nodes, each can lead to several choices of the story.
 */
module.exports = class Story {
    /**
     * Options that sets the format and property of the a command.
     * @typedef {Object} StoryObject
     * @property {String} title - The Title of the story.
     * @property {AuthorObject} author - The name of the author of the story.
     * @property {String} [version] - The version number of the story, good for reloading new stories.
     * @property {String} [currencyname] - A currency name that replaces "points".
     * @property {String} [description] - A short description of the story.
     * @property {StoryNode[]} nodes - An array of nodes for the story.
     */

    /**
     * Options that sets the author of this story.
     * @typedef {Object} AuthorObject
     * @property {String} name - The name of the author.
     * @property {String} [url] - A url for the author.
     * @property {string} [icon_url] - A url for a icon to display for the author.
     */
    constructor(storyobj) {
        let storyErrorMsg = "Story parsing Error: "
        if (!storyobj || typeof storyobj !== "object") throw new TypeError(storyErrorMsg + "Story must be an object.")
        if (!storyobj.title || typeof storyobj.title !== "string") throw new TypeError(storyErrorMsg + "String must have a valid string as title.")
        //todo check nodes for length and every element being an obj

        Object.assign(this, storyobj)

        this.nodes = new Map()
        this.beginning = null
        let hasBeginning = false
        for (let nodeobj of storyobj.nodes) {
            let node = new StoryNode(this, nodeobj)
            if (!this.beginning) this.beginning = node
            this.nodes.set(node.id, node)
            if (node.beginning) {
                if (!hasBeginning) {
                    hasBeginning = true
                    this.beginning = node
                } else {
                    throw new Error(storyErrorMsg + "Story must have only a single beginning node.")
                }
            }
        }
        //traverse and validate nodes
        let checknode = (storynode) => {
            if (storynode.traversed) return
            storynode.traversed = true
            if (storynode.choices && storynode.choices.length > 0) {
                for (let choice of storynode.choices) {
                    let choiceNode = this.nodes.get(choice.id)
                    if (choiceNode instanceof StoryNode) {
                        choice.node = choiceNode
                        checknode(choiceNode)
                    } else
                        throw new Error(storyErrorMsg + `the story node "${node.id}" has an invalid choice to "${choiceNode}".`)
                }
            }
        }
        checknode(this.beginning)
        for (let node of this.nodes.values()) {
            if (!node.traversed) {
                throw new Error(storyErrorMsg + `the story node "${node.id}" cannot be traversed to.`)
            }
            delete node.traversed
        }

    }
    getNode(id) {
        return this.nodes.get(id)
    }
    getMessageResolvable() {
        return {
            reply: true,
            messageOptions: {
                embed: {
                    title: `${this.title} ${this.version ? ("Ver:" + this.version) : ""}`,
                    author: this.author,
                    description: this.description
                }
            },
            reactions: [
                {
                    emoji: "📖",
                    execute: (reactionMessage, user) => {
                        let beginningMsgRes = this.beginning.getMessageResolvable()
                        beginningMsgRes.destination = reactionMessage.message
                        beginningMsgRes.edit = true
                        return beginningMsgRes
                    }
                }
            ]
        }

    }
}