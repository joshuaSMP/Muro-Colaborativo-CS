/**
 * Returns a random integer between min (inclusive) and max (inclusive)
 * Using Math.round() will give you a non-uniform distribution!
 */

module.exports = {
  createPin: () => {
    const min = 10000
    const max = 99999
    return Math.floor(Math.random() * (max - min + 1)) + min
  },
}
