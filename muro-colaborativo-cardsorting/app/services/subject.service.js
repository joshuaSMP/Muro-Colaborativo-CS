const pool = require('../config/database')

module.exports = {
  create: function (name) {
    return new Promise((resolve, reject) => {
      // validar parametros
      pool.connect((err, client, done) => {
        if (err) {
          reject(err)
          return
        }
        const text =
          'INSERT INTO public."subject" (name) VALUES ($1) RETURNING *;'
        const params = [name]
        client.query(text, params, function (err, result) {
          done()
          if (err) reject(err)
          else resolve(result.rows[0])
        })
      })
    })
  },

  list: () => {
    return new Promise((resolve, reject) => {
      pool.connect((err, client, done) => {
        if (err) {
          reject(err)
        }
        // build query
        const text = 'SELECT * FROM public."subject"'
        client.query(text, function (err, result) {
          done()
          if (err) reject(err)
          else resolve(result.rows)
        })
      })
    })
  },

  find: (id) => {
    return new Promise((resolve, reject) => {
      pool.connect((err, client, done) => {
        if (err) {
          reject(err)
          return
        }
        // build query
        const text = 'SELECT * FROM public."subject" WHERE id = $1'
        const params = [id]
        client.query(text, params, function (err, result) {
          done()
          if (err) reject(err)
          else resolve(result.rows[0])
        })
      })
    })
  },

  findSubjectByName: (name) => {
    return new Promise((resolve, reject) => {
      pool.connect((err, client, done) => {
        if (err) {
          reject(err)
          return
        }
        // build query
        const text = 'SELECT * FROM public."subject" WHERE name = $1'
        const params = [name]
        client.query(text, params, function (err, result) {
          done()
          if (err) reject(err)
          else resolve(result.rows[0])
        })
      })
    })
  },
}
