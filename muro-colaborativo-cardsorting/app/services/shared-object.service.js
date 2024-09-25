/* eslint-disable camelcase */
const pool = require('../config/database')

const {Select, Update} = require('../util/queryBuilder')

module.exports = {
  // eslint-disable-next-line max-params
  create: async (
    room,
    percentageX,
    percentageY,
    type,
    cursor,
    text,
    activityId,
    owners,
    imagePath
  ) => {
    // validar parametros
    const client = await pool.connect()
    try {
      const result = await client.query(
        'INSERT INTO public.shared_object(room, percentage_x, percentage_y, '+
        'type, cursor, text, activity_id, owners, image_path) '+
        'VALUES ( $1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
        [
          room,
          percentageX,
          percentageY,
          type,
          cursor,
          text,
          activityId,
          `{${owners}}`,
          imagePath,
        ]
      )
      return result.rows[0]
    } catch(err) {
      const result = await client.query(
        'SELECT * FROM public.shared_object '+
        'WHERE room = $1 AND cursor = $2 AND (text = $3 OR '+
        'image_path = $4)',
        [room, cursor, text, imagePath]
      )
      return result.rows[0]
    } finally {
      client.release()
    }
  },

  findSharedObjects: async (params) => {
    const client = await pool.connect()
    const result = await client.query(
      new Select(['*'])
        .from('public.shared_object')
        .whereEquals({...params, is_deleted: false})
        .build()
    )
    client.release()
    return result.rows
  },

  updateSharedObject: async (id, params) => {
    const client = await pool.connect()
    const result = await client.query(
      new Update('public.shared_object')
        .set(params)
        .whereEquals({id})
        .returning(['*'])
        .build()
    )
    client.release()
    if (result.rowCount === 0)
      throw new Error('No se modificó el estado del objeto')
    return result.rows[0]
  },

  delete: (id) => {
    return new Promise((resolve, reject) => {
      pool.connect((err, client, done) => {
        if (err) {
          reject(err)
          return
        }
        // build query
        const text =
          'UPDATE public.shared_object SET is_deleted = $1 ' +
          'WHERE public_id = $2 RETURNING *'
        const params = [true, id]
        client.query(text, params, function (err, result) {
          done()
          if (err) {
            reject(err)
            return
          }
          if (result.rowCount === 0)
            reject('No se modificó el estado del shared_object')
          else resolve(result.rows[0])
        })
      })
    })
  },
}