const Type = require("./Type")
module.exports = class User extends Type {
    constructor(client) {
        super(client, "user")
    }
    static regex = /^(?:<@!?)?([0-9]+)>?$/ 
    async validate(value) {
        let matches = value.match(this.regex)
        if (matches) {
            try {
                return { value: await this.client.fetchUser(matches[1]) }
            } catch (err) {
                return { error: err }
            }
        } else
            return { error: "Not a valid user." }
    }

    async parse(value) {
        return value
    }
}