/**
 * A helper class that extends the functionality of the {@link external:Guild} class.
 */
class GuildExtension {
    /**
     * get the command prefix for this guild.
     * @returns {string}
     */
    get prefix() {
        return this.prefixForCommands;
    }

    /**
     * sets the command prefix for this guild.
     * @param {string} newPrefix
     */
    set prefix(newPrefix) {
        this.prefixForCommands = newPrefix;
        this.client.emit("CommandPrefixChange", this, this.prefixForCommands);
    }

    /**
     * a Helper function that copies the functions here into the {@link external:Guild}'s prototype.
     * @private
     * @param {external:Guild} baseClass 
     */
    static doExtension(baseClass) {
        for (const prop of [
            'prefix'
        ]) Object.defineProperty(baseClass.prototype, prop, Object.getOwnPropertyDescriptor(this.prototype, prop));
    }

}
module.exports = GuildExtension;