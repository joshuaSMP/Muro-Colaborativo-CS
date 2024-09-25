//node_modules
const validator = require('validator')

module.exports = {
  /*
   * Returns true if and only if the given PIN is valid.
   * Note that this does not guarantiess its existance in DB
   */
  validatePin: (pin) => {
    return !pin || validator.isInt(pin)
  }, //validatePin
} //validator module
