const bcrypt = require('bcryptjs')
const pool = require('../config/database')

module.exports = {
  create: function (email, name, pw) {
    return new Promise((resolve, reject) => {
      // validar parametros
      pool.connect((err, client, done) => {
        if (err) {
          reject(err)
          return
        }
        if (!email) {
          reject({name: 'CorreoInvalido', message: 'El correo no puede ser vacío.'})
          return
        }
        if (!name) {
          reject({name: 'NombreInvalido', message: 'El nombre no puede ser vacío.'})
          return
        }
        if (!pw) {
          reject({name: 'ContrasenaInvalida', message: 'La contraseña no puede ser vacía.'})
          return
        }
        const salt = bcrypt.genSaltSync(10)
        const hash = bcrypt.hashSync(pw, salt)
        const text =
          'INSERT INTO public."user"(email, name, pw) ' +
          'VALUES ($1, $2, $3) RETURNING id;'
        const params = [email, name, hash]
        client.query(text, params, function (err, result) {
          done()
          if (err) reject(err)
          else resolve(result.rows[0])
        })
      })
    })
  },

  login: function (email, pw) {
    return new Promise((resolve, reject) => {
      pool.connect((err, client, done) => {
        if (err) {
          reject(err)
          return
        }
        // build query
        const text = 'SELECT * FROM public."user" WHERE email = $1'
        const params = [email]
        client.query(text, params, function (err, result) {
          done()
          if (err) {
            reject(err)
            return
          }
          if (result.rows[0]) {
            // compare passwords
            if (bcrypt.compareSync(pw, result.rows[0].pw))
              resolve(result.rows[0])
            else reject('Usuario o Contraseña Incorrectos')
          } else {
            reject('Usuario no registrado')
          }
        })
      })
    })
  },

  requestPasswordReset: function (email) {
    return new Promise((resolve, reject) => {
      pool.connect((err, client, done) => {
        if (err) {
          reject(err)
          return
        }
        // build query
        const text = 'SELECT requestPasswordReset($1) AS request_id'
        const params = [email]
        client.query(text, params, function (err, result) {
          done()
          if (err) reject(err)
          else result.rows[0]
            ? resolve(result.rows[0])
            : reject('Usuario no registrado')
        })
      })
    })
  },

  resetPassword: function (requestId, pw) {
    return new Promise((resolve, reject) => {
      pool.connect((err, client, done) => {
        if (err) {
          reject(err)
          return
        }
        // build query
        const text =
          'UPDATE public.user SET pw = $1 \
					WHERE pw_reset_request_id = $2'
        const salt = bcrypt.genSaltSync(10)
        const hash = bcrypt.hashSync(pw, salt)
        const params = [hash, requestId]
        client.query(text, params, function (err, result) {
          done()
          if (err) reject(err)
          else if (result.rowCount === 0)
            reject('No se modificó la contraseña')
          else resolve(true)
        })
      })
    })
  },
}
