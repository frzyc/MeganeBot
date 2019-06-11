const Type = require("./Type")
module.exports = class User extends Type {
    constructor(client) {
        super(client, "user")
    }
    async validate(value, msg, arg) {
        let matches = value.match(/^(?:<@!?)?([0-9]+)>?$/)
        if (matches) {
            try {
                return await this.client.fetchUser(matches[1])
            } catch (err) {
                return false
            }
        }
    }

    async parse(value, msg, arg) {
        let matches = value.match(/^(?:<@!?)?([0-9]+)>?$/)
        if (matches)
            return await this.client.fetchUser(matches[1])
    }
}