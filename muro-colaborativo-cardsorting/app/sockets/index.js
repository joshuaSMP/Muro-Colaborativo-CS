const userSockets = require('./user.sockets')

module.exports = function (io) {
  userSockets(io)
}
