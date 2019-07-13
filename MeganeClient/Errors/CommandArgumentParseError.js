module.exports = class CommandArgumentParseError extends Error {
  constructor(message) {
    super(message)
    this.name = "CommandArgumentParseError"
  }
}