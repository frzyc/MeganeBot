module.exports = class GuildExtension {
    get prefix() {
        return this.prefixForCommands;
    }
    set prefix(newPrefix) {
        this.prefixForCommands = newPrefix;
        this.client.emit("guildPrefixChange", this, this.prefixForCommands);
    }
    static doExtension(baseClass) {
        for (const prop of [
            'prefix'
        ]) Object.defineProperty(baseClass.prototype, prop, Object.getOwnPropertyDescriptor(this.prototype, prop));
    }

}