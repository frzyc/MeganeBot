const Type = require('./Type');
module.exports = class Integer extends Type{
    constructor(client){
        super(client, 'integer');
    }
    validate(value, msg, arg) {
		const int = Number.parseInt(value);
		return !Number.isNaN(int) &&
			(arg.min === null || typeof arg.min === 'undefined' || int >= arg.min) &&
			(arg.max === null || typeof arg.max === 'undefined' || int <= arg.max);
	}

	parse(value) {
		return Number.parseInt(value);
	}
}