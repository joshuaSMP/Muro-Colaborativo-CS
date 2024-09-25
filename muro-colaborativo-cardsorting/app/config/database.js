const pg = require('pg')

const config = {
  user: process.env.DB_USER, // name of the user account
  password: process.env.DB_PASSWORD, //,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  max: 10, // max number of clients in the pool
  idleTimeoutMillis: 1000,
}
const pool = new pg.Pool(config)

module.exports = pool
