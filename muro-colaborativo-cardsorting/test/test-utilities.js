const pool = require('../app/config/database')
const bcrypt = require('bcryptjs')

const getRandomActivityPin = () =>
  String(Math.floor(Math.random() * 1000000000))

/**
 * Deletes a user from database
 * @param {*} name user name
 * @param {*} email user email
 */
const deleteUser = async (name, email) => {
  const client = await pool.connect()
  try {
    await client.query(
      'DELETE FROM public.user WHERE name = $1 AND email = $2;',
      [name, email]
    )
  } catch (err) {
    console.log(err.stack)
  } finally {
    client.release()
  }
}

const createUser = async (email, name, pw) => {
  const client = await pool.connect()
  try {
    const salt = bcrypt.genSaltSync(10)
    const hash = bcrypt.hashSync(pw, salt)
    const result = await client.query(
      'INSERT INTO public."user"(email, name, pw) ' +
        'VALUES ($1, $2, $3) RETURNING id;',
      [email, name, hash]
    )
    return result.rows[0].id
  } catch (err) {
    console.log(err.stack)
  } finally {
    client.release()
  }
  return null
}

// eslint-disable-next-line max-params
const createActivity = async (name, pin, userId = null, subjectId = null) => {
  const client = await pool.connect()
  try {
    const result = await client.query(
      'INSERT INTO public.activity (name, pin, owner_id, subject_id)' +
        ' VALUES ($1, $2, $3, $4) RETURNING id;',
      [name, pin, userId, subjectId]
    )
    return result.rows[0].id
  } catch (err) {
    console.log(err.stack)
  } finally {
    client.release()
  }
  return null
}

const deleteActivity = async (pin) => {
  const client = await pool.connect()
  try {
    await client.query('DELETE FROM public.activity WHERE pin = $1;', [pin])
  } catch (err) {
    console.log(err.stack)
  } finally {
    client.release()
  }
}

const createSubject = async (name) => {
  const client = await pool.connect()
  try {
    const result = await client.query(
      'INSERT INTO public.subject (name) VALUES ($1) RETURNING id;',
      [name]
    )
    return result.rows[0].id
  } catch (err) {
    console.log(err.stack)
  } finally {
    client.release()
  }
  return null
}

const deleteSubject = async (name) => {
  const client = await pool.connect()
  try {
    await client.query('DELETE FROM public.subject WHERE name = $1;', [name])
  } catch (err) {
    console.log(err.stack)
  } finally {
    client.release()
  }
}

const createSharedObject = async (
  percentageX,
  percentageY,
  room,
  publicId,
  activityId
  // eslint-disable-next-line max-params
) => {
  const client = await pool.connect()
  try {
    const result = await client.query(
      'INSERT INTO public.shared_object ' +
        '(percentage_x, percentage_y, type, room, public_id, activity_id) ' +
        'VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, public_id;',
      [percentageX, percentageY, 'text', room, publicId, activityId]
    )
    return { id: result.rows[0].id, publicId: result.rows[0].public_id }
  } catch (err) {
    console.log(err.stack)
  } finally {
    client.release()
  }
  return null
}

const deleteSharedObject = async (room, publicId) => {
  const client = await pool.connect()
  try {
    await client.query(
      'DELETE FROM public.shared_object WHERE room = $1 and public_id = $2;',
      [room, publicId]
    )
  } catch (err) {
    console.log(err.stack)
  } finally {
    client.release()
  }
}

module.exports = {
  getRandomActivityPin,
  createUser,
  deleteUser,
  createActivity,
  deleteActivity,
  createSubject,
  deleteSubject,
  createSharedObject,
  deleteSharedObject,
}
