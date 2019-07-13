module.exports = {
    "parser": "babel-eslint",
    "env": {
        "node": true,
        "es6": true,
        "mocha": true
    },
    "extends": "eslint:recommended",
    "globals": {
        "Atomics": "readonly",
        "SharedArrayBuffer": "readonly"
    },
    "parserOptions": {
        "ecmaVersion": 2018
    },
    "rules": {
        "indent": [
            "error",
            2
        ],
        "linebreak-style": [
            "warn",
            "unix"
        ],
    }
}
