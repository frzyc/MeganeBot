module.exports = (base, extension) => {
  for (const prop of Object.getOwnPropertyNames(extension.prototype)) {
    if (prop === "constructor") continue
    // console.log("Adding Extension to base.prototype: " + prop)
    Object.defineProperty(base.prototype, prop, Object.getOwnPropertyDescriptor(extension.prototype, prop))
  }
  for (const prop of Object.keys(extension)) {
    // console.log("Adding Extension to base: " + prop)
    Object.defineProperty(base, prop, Object.getOwnPropertyDescriptor(extension, prop))
  }
}
