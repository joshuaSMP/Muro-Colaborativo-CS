/* eslint-disable max-lines */
/* eslint-disable camelcase */
const { describe, expect, test, beforeAll, afterAll } = require('@jest/globals')
const { v1: uuidv1 } = require('uuid')
const request = require('supertest')
const app = require('../app/app')

const {
  createActivity,
  deleteActivity,
  deleteSubject,
  createUser,
  deleteUser,
  getRandomActivityPin,
} = require('./test-utilities')

const owner = {
  email: 'jandoe@gmail.com',
  name: 'Jan Doe',
  pw: 'JanDoe123$',
}

beforeAll(async () => {
  const ownerId = await createUser(owner.email, owner.name, owner.pw)
  owner.id = ownerId
})

afterAll(async () => deleteUser(owner.name, owner.email))

// eslint-disable-next-line max-lines-per-function
describe('GET /api/activities/:id', () => {
  /**
   * test user data
   */
  const activity = {
    name: 'Activity 1',
    pin: getRandomActivityPin(),
    id: '',
    ownerId: owner.id,
  }

  /**
   * Creates an activity in database
   */
  beforeAll(() =>
    createActivity(activity.name, activity.pin, activity.ownerId).then((id) => {
      activity.id = id
    })
  )

  /**
   * Deletes the user created within the tests
   */
  afterAll(() => deleteActivity(activity.pin))

  /**
   * Creates a user with correct parameters
   */
  test('GET /api/activities/:id -> happy path (id)', async () => {
    const response = await request(app).get(`/api/activities/${activity.id}`)

    expect(response.statusCode).toBe(200)
    expect(response.body.data.id).toEqual(activity.id)
    expect(response.body.data.pin).toEqual(Number(activity.pin))
    expect(response.body.data.name).toEqual(activity.name)
  })

  /**
   * Creates a user with correct parameters
   */
  test('GET /api/activities/:id -> happy path (pin)', async () => {
    const response = await request(app).get(`/api/activities/${activity.pin}`)

    expect(response.statusCode).toBe(200)
    expect(response.body.data.id).toEqual(activity.id)
    expect(response.body.data.pin).toEqual(Number(activity.pin))
    expect(response.body.data.name).toEqual(activity.name)
  })

  /**
   * Creates a user with partial parameters
   */
  test('GET /api/activities/:id -> non existing activity', async () => {
    const response = await request(app).get(`/api/activities/${uuidv1()}`)

    expect(response.statusCode).toBe(404)
    expect(response.body.msg).toEqual('Actividad no encontrada')
  })

  /**
   * Creates a user with incorrect parameter names
   */
  test('GET /api/activities/:id -> invalid parameters', async () => {
    const response = await request(app).get('/api/activities/invalid-param')

    expect(response.statusCode).toBe(404)
  })
})

// eslint-disable-next-line max-lines-per-function
describe('GET /api/activities/', () => {
  /**
   * test user data
   */
  const activity = {
    name: 'Activity 3',
    pin: getRandomActivityPin(),
    id: '',
    ownerId: owner.id,
  }

  /**
   * Creates an activity in database
   */
  beforeAll(() =>
    createActivity(activity.name, activity.pin, activity.ownerId).then((id) => {
      activity.id = id
    })
  )

  /**
   * Deletes the user created within the tests
   */
  afterAll(() => deleteActivity(activity.pin))

  /**
   * Creates a user with correct parameters
   */
  test('GET /api/activities/ -> happy path', async () => {
    const response = await request(app).get(
      `/api/activities/?owner_id=${activity.owner_id}`
    )

    expect(response.statusCode).toBe(200)
    expect(response.body.data.length).toEqual(1)
  })

  /**
   * Creates a user with partial parameters
   */
  // eslint-disable-next-line max-len
  test('GET /api/activities/ -> non existing activity', async () => {
    const response = await request(app).get(
      `/api/activities/?owner_id=${uuidv1()}`
    )

    expect(response.statusCode).toBe(200)
    expect(response.body.data.length).toEqual(0)
  })

  /**
   * Creates a user with incorrect parameter names
   */
  test('GET /api/activities/ -> invalid parameters', async () => {
    const response = await request(app).get(
      '/api/activities/?invalid-param=foo'
    )

    expect(response.statusCode).toBe(400)
    expect(response.body.msg).toEqual(
      'Parámetros inválidos. Se esperaba user_id'
    )
  })
})

// eslint-disable-next-line max-lines-per-function
describe('POST /api/activities/', () => {
  /**
   * test user data
   */
  const activity = {
    name: 'Activity post 1',
    pin: getRandomActivityPin(),
    subject: 'subject post 1',
  }

  /**
   * Deletes the user created within the tests
   */
  afterAll(async () => {
    await deleteActivity(activity.pin)
    await deleteSubject(activity.subject)
  })

  /**
   * Creates a user with correct parameters
   */
  test('POST /api/activities/ -> happy path', async () => {
    const response = await request(app)
      .post('/api/activities/')
      .send({ ...activity, owner_id: owner.id })

    expect(response.statusCode).toBe(201)
    expect(response.body.data.pin).toEqual(Number(activity.pin))
    expect(response.body.data.name).toEqual(activity.name)
    expect(response.body.data.owner_id).toEqual(owner.id)
  })

  /**
   * Creates a user with partial parameters
   */
  // eslint-disable-next-line max-len
  test('POST /api/activities/ -> partial body', async () => {
    const response = await request(app)
      .post('/api/activities/')
      .send({ name: activity.name })

    expect(response.statusCode).toBe(400)
    expect(response.body).toEqual(
      expect.objectContaining({
        msg: 'Parámetros faltantes: pin',
      })
    )
  })

  /**
   * Creates a user with incorrect parameter names
   */
  test('POST /api/activities/ -> invalid parameters', async () => {
    const response = await request(app)
      .post('/api/activities/')
      .send({ foo: 'bar' })

    expect(response.statusCode).toBe(400)
    expect(response.body).toEqual(
      expect.objectContaining({
        msg: 'Parámetros incorrectos. Datos esperados: name, pin',
      })
    )
  })
})

// eslint-disable-next-line max-lines-per-function
describe('PATCH /api/activities/:activity_id/', () => {
  /**
   * test user data
   */
  const activity = {
    name: 'Activity post 2',
    pin: getRandomActivityPin(),
    ownerId: owner.id,
  }

  /**
   * Deletes the user created within the tests
   */
  beforeAll(() =>
    createActivity(activity.name, activity.pin, activity.ownerId).then((id) => {
      activity.id = id
    })
  )

  /**
   * Deletes the user created within the tests
   */
  afterAll(() => deleteActivity(activity.pin))

  /**
   * Creates a user with correct parameters
   */
  test('PATCH /api/activities/:activity_id -> happy path', async () => {
    const response = await request(app)
      .patch(`/api/activities/${activity.id}/`)
      .send({
        is_active: false,
        is_paused: false,
        background_image: 'https://www.google.com',
        name: 'FOO',
      })

    expect(response.statusCode).toBe(200)
    expect(response.body.data?.is_active).toEqual(false)
    expect(response.body.data?.is_paused).toEqual(false)
    expect(response.body.data?.background_image).toEqual(
      'https://www.google.com'
    )
    expect(response.body.data?.name).toEqual('FOO')
  })

  /**
   * Creates a user with partial parameters
   */
  // eslint-disable-next-line max-len
  test('POST /api/activities/:activity_id/ -> non existing activity', async () => {
    const response = await request(app)
      .patch(`/api/activities/${uuidv1()}/`)
      .send({ name: 'FOO' })

    expect(response.statusCode).toBe(404)
    expect(response.body.msg).toEqual('Actividad no encontrada')
  })

  /**
   * Creates a user with incorrect parameter names
   */
  test('POST /api/activities/:activity_id/ -> invalid parameters', async () => {
    const response = await request(app)
      .patch('/api/activities/invalid-parameter/')
      .send({ name: 'FOO' })

    expect(response.statusCode).toBe(400)
    expect(response.body.msg).toEqual('Id inválido')
  })
})

// eslint-disable-next-line max-lines-per-function, max-len
describe('DELETE /api/activities/:id', () => {
  /**
   * test user data
   */
  const activity = {
    name: 'Activity put 3',
    pin: getRandomActivityPin(),
  }

  /**
   * Deletes the user created within the tests
   */
  beforeAll(() =>
    createActivity(activity.name, activity.pin).then((id) => (activity.id = id))
  )

  /**
   * Creates a user with correct parameters
   */
  // eslint-disable-next-line max-len
  test('DELETE /api/activities/:id -> happy path', async () => {
    const response = await request(app).delete(`/api/activities/${activity.id}`)

    expect(response.statusCode).toBe(200)
    expect(response.body.msg).toEqual('Actividad eliminada exitosamente')
  })

  /**
   * Creates a user with partial parameters
   */
  // eslint-disable-next-line max-len
  test('DELETE /api/activities/:id -> non existing activity', async () => {
    const response = await request(app).delete(`/api/activities/${uuidv1()}`)

    expect(response.statusCode).toBe(404)
    expect(response.body.msg).toEqual('Actividad no encontrada')
  })

  /**
   * Creates a user with incorrect parameter names
   */
  // eslint-disable-next-line max-len
  test('DELETE /api/activities/:id -> invalid parameters', async () => {
    const response = await request(app).delete(
      '/api/activities/invalid-parameter'
    )

    expect(response.statusCode).toBe(400)
    expect(response.body.msg).toEqual('Id inválido')
  })
})
