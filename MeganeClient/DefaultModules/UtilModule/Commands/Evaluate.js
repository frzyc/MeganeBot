const { Command } = require("../../../")

module.exports = class Eval extends Command {
    constructor(client) {
        super(client, {
            name: "Evaluate",
            commands: ["eval", "evaluate"],
            examples: ["eval 1+1"],
            usage: "Evaluate a piece of code",
            description: "Evaluate a piece of code, like as if using the eval() function.",
            ownerOnly: true,
            args: [
                {
                    label: "evalstring",
                    type: "string",
                    description: "The string to evaluate"
                }
            ]
        })
    }
    execute(message, args) {
        let code = args["evalstring"]
        try {
            let evaled = eval(code)
            if (typeof evaled !== "string")
                evaled = require("util").inspect(evaled)
            return "```xl\n" + clean(evaled) + "\n```"
        } catch (err) {
            return `Failed to eval.\`\`\`${err.toString()}\`\`\``
        }
        //helper functions
        //This function prevents the use of actual mentions within the return line by adding a zero-width character between the @ and the first character of the mention - blocking the mention from happening.
        function clean(text) {
            if (typeof (text) === "string")
                return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203))
            else
                return text
        }
    }
}
