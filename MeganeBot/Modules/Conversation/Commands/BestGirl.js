const { Command } = require("../../../../MeganeClient")
module.exports = class BestGirl extends Command {
    constructor(client) {
        super(client, {
            name: "bestgirl?",
        })
    }
    async execute() {
        return "The best girl is undoubtly Mirai Kuriyama!"
    }
}