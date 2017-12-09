const CommandModule = require('../../CommandModule');
module.exports = class TestModule extends CommandModule{
    constructor(client){
        super(client, {
            name: "Test Module",
            description: "A module for some test commands. Should be owner only.",
            ownerOnly: true
        });
        this.addCommandsIn(require('path').join(__dirname, "Commands"));
    }
}