const bcrypt = require('bcryptjs')

exports.cryptPassword = function (password, callback) {
  bcrypt.genSalt(10, function (err, salt) {
    if (err) {
      callback(err)
      return
    }

    bcrypt.hash(password, salt, function (err, hash) {
      return callback(err, hash)
    })
  })
}

exports.comparePassword = function (plainPass, hashword, callback) {
  bcrypt.compare(plainPass, hashword, function (err, isPasswordMatch) {
    return err ? callback(err) : callback(null, isPasswordMatch)
  })
}
