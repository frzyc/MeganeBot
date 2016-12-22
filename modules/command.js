var command = function (cmdnames) {
    this.name = cmdnames;
}
command.prototype.getUseage = function () {
    if (!this.usage) return `This command does not have a usage description.`
    else {
        //console.log(`number of usages: ${this.usage.length}`);
        let usagetxt = `Usage of [${this.name.join(', ')}]: `;

        for (let value of this.usage)
            usagetxt += `\n**${config.prefix}${this.name[0]} ${value}`;
        return usagetxt;
    }
}
module.exports = command;