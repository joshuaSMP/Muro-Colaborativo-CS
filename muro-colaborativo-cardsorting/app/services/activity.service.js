/* eslint-disable max-lines */
const validations = require('../util/validations')
const validator = require('validator')
const pool = require('../config/database')
const pinUtil = require('../util/pin')
const {Select, Update} = require('../util/queryBuilder')

//subject service
const subjectsvc = require('../services/subject.service')

//Manejamos el tipo de insert a realizar
// eslint-disable-next-line max-params
async function insertActivity(ownerId, pin, backgroundImage, name, subjectId) {
  // si  la actividad tiene owner id, poner activa como falso
  const client = await pool.connect()
  let text = '',
    params = []
  if (ownerId) {
    text =
      'INSERT INTO public.activity(owner_id, pin, ' +
      'background_image, name, is_active, subject_id) VALUES ' +
      '($1, $2, $3, $4, $5, $6) RETURNING *;'
    params = [ownerId, pin, backgroundImage, name, true, subjectId]
  } else {
    text =
      'INSERT INTO public.activity(pin, background_image) ' +
      'VALUES ($1, $2) RETURNING id, pin;'
    params = [pin, backgroundImage]
  } //si ya hay un propietario de la actividad
  const result = await client.query(text, params)
  client.release()
  return result.rows[0]
}

module.exports = {
  // eslint-disable-next-line max-params
  create: async (
    ownerId,
    backgroundImage,
    name,
    userPin,
    subject,
    hasName
  ) => {
    // validar parametros
    // crear pin
    const pin = userPin ? userPin : pinUtil.createPin()
    let subjectId = null
    //Verificamos si existe materia
    if (hasName) {
      //Verificamos si ya está registrada la materia
      const subjectName = (subject || '').trim().toLowerCase()
      const subjectFound = await subjectsvc.findSubjectByName(subjectName)
      if (subjectFound) {
        subjectId = subjectFound.id
      } else {
        const newSubject = await subjectsvc.create(subjectName)
        subjectId = newSubject.id
      }
    }
    insertActivity(ownerId, pin, backgroundImage, name, subjectId)
  },

  findByPin: (pin, includeUsers = false) => {
    return new Promise((resolve, reject) => {
      if (!pin) {
        reject('el parametro pin debe estar definido')
        return
      }
      // validate parameters
      if (!validations.validatePin(pin)) {
        reject('El pin debe ser un número')
        return
      }
      pool.connect((err, client, done) => {
        if (err) {
          reject(err)
          return
        }
        // build query
        const text = includeUsers
          ? 'SELECT activity.is_active, ' +
            'activity.id AS a_id, activity.is_paused, activity.name, ' +
            'activity.background_image, users.username, users.cursor, ' +
            'users.id AS u_id FROM public.activity AS activity ' +
            'LEFT OUTER JOIN public.activity_user AS users ON ' +
            'activity.pin = users.pin WHERE activity.pin = $1'
          : 'SELECT * FROM public.activity WHERE pin = $1'
        const params = [pin]
        client.query(text, params, function (err, result) {
          done()
          if (err) return reject(err)
          return resolve(includeUsers ? result.rows : result.rows[0])
        })
      })
    })
  },

  findActivity: async (id) => {
    const client = await pool.connect()
    const result = await client.query(
      new Select(['*'])
        .from('public.activity')
        .whereEquals(validator.isUUID(id) ? {id: id} : {pin: id})
        .build()
    )
    client.release()
    return result.rows[0]
  },

  findActivities: async (params) => {
    const client = await pool.connect()
    const result = await client.query(
      new Select(['*']).from('public.activity').whereEquals(params).build()
    )
    client.release()
    return result.rows
  },

  findByUserId: (userId) => {
    return new Promise((resolve, reject) => {
      pool.connect((err, client, done) => {
        if (err) {
          reject(err)
          return
        }
        // build query
        const text = 'SELECT * FROM public.activity WHERE owner_id = $1'
        const params = [userId]
        client.query(text, params, function (err, result) {
          done()
          if (err) reject(err)
          else resolve(result.rows)
        })
      })
    })
  },

  // eslint-disable-next-line max-params
  setUsersDataAndAvailableSeats: (
    pin,
    username,
    lastLogin = null,
    lastLogout = null
  ) => {
    return new Promise((resolve, reject) => {
      pool.connect((err, client, done) => {
        if (err) {
          reject(err)
          return
        }
        // build query
        let text, params
        if (username) {
          text =
            'INSERT INTO public.activity_user(pin, username, ' +
            'last_login, last_logout) VALUES($1, $2, $3, $4) ' +
            'ON CONFLICT (pin, username) DO UPDATE SET last_login = $3, ' +
            'last_logout = $4 RETURNING cursor, id'
          params = [pin, username, lastLogin, lastLogout]
        } else {
          text =
            'UPDATE public.activity_user SET last_login = $1, ' +
            'last_logout = $2 WHERE pin = $3 RETURNING cursor, id'
          params = [lastLogin, lastLogout, pin]
        }
        client.query(text, params, function (err, result) {
          done()
          if (err) {
            reject(err)
            return
          }
          if (result.rowCount === 0)
            reject('No se modificó el estado de la actividad')
          else resolve(result.rows[0])
        })
      })
    })
  },

  assignSeat: (username, pin) => {
    // validate params
    return new Promise(function (resolve, reject) {
      module.exports
        .setUsersDataAndAvailableSeats(pin, username, new Date())
        .then(function (cursor) {
          return {
            pin: pin,
            cursor: cursor.cursor,
            userId: cursor.id,
          }
        })
        .then(function (data) {
          resolve(data)
        })
        .catch((err) => {
          reject(err)
        })
    })
  },

  logOutUser: (username, pin) => {
    return new Promise(function (resolve, reject) {
      return module.exports
        .setUsersDataAndAvailableSeats(pin, username, null, new Date())
        .then(function (data) {
          resolve(data)
        })
        .catch((err) => {
          reject(err)
        })
    })
  },

  updateActivity: async (id, params) => {
    const client = await pool.connect()
    const result = await client.query(
      new Update('public.activity')
        .set(params)
        .whereEquals({id})
        .returning(['*'])
        .build()
    )
    client.release()
    if (result.rowCount === 0) {
      throw new Error('No se modificó el estado de la actividad')
    }
    return result.rows[0]
  },

  logOutAllUsers: (id) => {
    return new Promise(function (resolve, reject) {
      //reset available_seats
      return module.exports
        .setUsersDataAndAvailableSeats(id, null, null, new Date())
        .then(() => {
          resolve(true)
        })
        .catch((err) => {
          reject(err)
        })
    })
  },

  updateIsDeleted: (id, status) => {
    return new Promise((resolve, reject) => {
      pool.connect((err, client, done) => {
        if (err) {
          reject(err)
          return
        }
        // build query
        const text =
          'UPDATE public.activity SET is_deleted = $1 WHERE id = $2 ' +
          'RETURNING *'
        const params = [status, id]
        client.query(text, params, function (err, result) {
          done()
          if (err) {
            reject(err)
            return
          }
          if (result.rowCount === 0)
            reject('No se modificó el estado de la actividad')
          else resolve(result.rows[0])
        })
      })
    })
  },
}
