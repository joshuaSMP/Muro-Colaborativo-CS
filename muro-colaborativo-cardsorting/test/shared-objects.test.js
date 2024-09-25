/* eslint-disable max-lines */
/* eslint-disable camelcase */
const { describe, expect, test, beforeAll, afterAll } = require('@jest/globals')
const { v1: uuidv1 } = require('uuid')
const request = require('supertest')
const app = require('../app/app')

const {
  createSharedObject,
  deleteSharedObject,
  createActivity,
  deleteActivity,
  getRandomActivityPin,
} = require('./test-utilities')

// eslint-disable-next-line max-lines-per-function
describe('GET /api/shared-objects/', () => {
  /**
   * test user data
   */
  const activity = {
    name: 'SharedObject Activity 1',
    pin: getRandomActivityPin(),
    id: '',
  }

  const sharedObject = {
    percentageX: 0,
    percentageY: 0,
    room: 1,
    publicId: 'sharedobjectid1',
  }

  /**
   * Creates an activity in database
   */
  beforeAll(async () => {
    const activityId = await createActivity(activity.name, activity.pin)
    activity.id = activityId
    sharedObject.activityId = activityId
    const { id, publicId } = await createSharedObject(
      sharedObject.percentageX,
      sharedObject.percentageY,
      sharedObject.room,
      sharedObject.publicId,
      sharedObject.activityId
    )
    sharedObject.id = id
    sharedObject.publicId = publicId
  })

  /**
   * Deletes the user created within the tests
   */
  afterAll(async () => {
    await deleteSharedObject(sharedObject.room, sharedObject.publicId)
    await deleteActivity(activity.pin)
  })

  /**
   * Creates a user with correct parameters
   */
  // eslint-disable-next-line max-len
  test('GET /api/shared-objects/ -> happy path', async () => {
    const response = await request(app).get(
      `/api/shared-objects/?activity_id=${activity.id}`
    )

    expect(response.statusCode).toBe(200)
    expect(response.body.data.length).toEqual(1)
    expect(response.body.data[0].public_id).toEqual(sharedObject.publicId)
  })

  /**
   * Creates a user with partial parameters
   */
  // eslint-disable-next-line max-len
  test('GET /api/shared-objects/ -> non existing activity', async () => {
    const response = await request(app).get(
      `/api/shared-objects/?activity_id=${uuidv1()}`
    )

    expect(response.statusCode).toBe(404)
    expect(response.body.msg).toEqual('Actividad no encontrada')
  })

  /**
   * Creates a user with incorrect parameter names
   */
  // eslint-disable-next-line max-len
  test('GET /api/shared-objects/ -> invalid parameters', async () => {
    const response = await request(app).get(
      '/api/shared-objects/?activity_id=invalid-param'
    )

    expect(response.statusCode).toBe(400)
    expect(response.body.msg).toEqual('Id inválido')
  })
})

// eslint-disable-next-line max-lines-per-function
describe('POST /api/shared-objects/', () => {
  /**
   * test user data
   */
  const activity = {
    name: 'SharedObject Activity 2',
    pin: getRandomActivityPin(),
    id: '',
  }

  const sharedObject = {
    kindOfObjectReceived: 'text',
    percentageX: 0,
    percentageY: 0,
    room: 1,
    cursor: 1,
    publicId: 'sharedobjectid2',
  }

  /**
   * Creates an activity in database
   */
  beforeAll(async () => {
    const activityId = createActivity(activity.name, activity.pin)
    activity.id = activityId
    sharedObject.activity_id = activityId
  })

  /**
   * Deletes the user created within the tests
   */
  afterAll(async () => {
    await deleteSharedObject(sharedObject.room, sharedObject.publicId)
    await deleteActivity(activity.pin)
  })

  /**
   * Creates a user with correct parameters
   */
  // eslint-disable-next-line max-len
  test('POST /api/shared-objects/ -> happy path', async () => {
    const response = await request(app)
      .post('/api/shared-objects/')
      .send(sharedObject)

    expect(response.statusCode).toBe(201)
    expect(response.body.msg).toEqual('Objeto creado exitosamente')
    expect(response.body.data.publicId).toEqual(sharedObject.publicId)
  })

  /**
   * Creates a user with partial parameters
   */
  // eslint-disable-next-line max-len
  test('POST /api/shared-objects/ -> partial body', async () => {
    const response = await request(app)
      .post('/api/shared-objects/')
      .send({ publicId: sharedObject.publicId })

    expect(response.statusCode).toBe(400)
    expect(response.body.msg).toEqual(
      'Parámetros faltantes: percentageX, percentageY, room, activityId'
    )
  })

  /**
   * Creates a user with incorrect parameter names
   */
  // eslint-disable-next-line max-len
  test('POST /api/shared-objects/ -> invalid parameters', async () => {
    const response = await request(app)
      .post('/api/shared-objects/')
      .send({ foo: 'bar' })

    expect(response.statusCode).toBe(400)
    expect(response.body.msg).toEqual(
      'Parámetros incorrectos. Datos faltantes: percentageX, percentageY, ' +
        'room, publicId, activityId'
    )
  })
})

// eslint-disable-next-line max-lines-per-function
describe('PUT /api/shared-objects/:id/', () => {
  /**
   * test user data
   */
  const activity = {
    name: 'SharedObject Activity 3',
    pin: getRandomActivityPin(),
    id: '',
  }

  const sharedObject = {
    percentageX: 0,
    percentageY: 0,
    room: 1,
    publicId: 'sharedobjectid3',
  }

  /**
   * Creates an activity in database
   */
  beforeAll(async () => {
    const activityId = await createActivity(activity.name, activity.pin)
    activity.id = activityId
    sharedObject.activityId = activityId
    const { id, publicId } = await createSharedObject(
      sharedObject.percentageX,
      sharedObject.percentageY,
      sharedObject.room,
      sharedObject.publicId,
      sharedObject.activityId
    )
    sharedObject.id = id
    sharedObject.publicId = publicId
  })

  /**
   * Deletes the user created within the tests
   */
  afterAll(async () => {
    await deleteSharedObject(sharedObject.room, sharedObject.publicId)
    await deleteActivity(activity.pin)
  })

  /**
   * Creates a user with correct parameters
   */
  // eslint-disable-next-line max-len
  test('PUT /api/shared-objects/:id/ -> happy path', async () => {
    const response = await request(app)
      .put(`/api/shared-objects/${sharedObject.id}/`)
      .send({ percentage_x: 1, percentage_y: 1 })

    expect(response.body.msg).toEqual('Objeto actualizado exitosamente')
    expect(response.body.data.percentage_x).toEqual(1)
    expect(response.body.data.percentage_y).toEqual(1)
    expect(response.statusCode).toBe(200)
  })

  /**
   * Creates a user with partial parameters
   */
  // eslint-disable-next-line max-len
  test('PUT /api/shared-objects/:id/ -> non existing object', async () => {
    const response = await request(app)
      .put(`/api/shared-objects/${uuidv1()}/`)
      .send({ percentageX: 1, percentageY: 1 })

    expect(response.statusCode).toBe(404)
    expect(response.body.msg).toEqual('Objecto no encontrado')
  })

  /**
   * Creates a user with incorrect parameter names
   */
  // eslint-disable-next-line max-len
  test('PUT /api/shared-objects/:id/ -> invalid parameters', async () => {
    const response = await request(app)
      .put(`/api/shared-objects/${sharedObject.id}/`)
      .send({ percentage_x: 1, percentage_y: 1 })

    expect(response.statusCode).toBe(400)
    expect(response.body.msg).toEqual(
      'Coordenadas ingresadas deben ser numéricas'
    )
  })
})

// eslint-disable-next-line max-lines-per-function
describe('DELETE /api/shared-objects/:id/', () => {
  /**
   * test user data
   */
  const activity = {
    name: 'SharedObject Activity 4',
    pin: getRandomActivityPin(),
    id: '',
  }

  const sharedObject = {
    percentageX: 0,
    percentageY: 0,
    room: 1,
    publicId: 'sharedobjectid4',
  }

  /**
   * Creates an activity in database
   */
  beforeAll(async () => {
    const activityId = await createActivity(activity.name, activity.pin)
    activity.id = activityId
    sharedObject.activityId = activityId
    const { id, publicId } = await createSharedObject(
      sharedObject.percentageX,
      sharedObject.percentageY,
      sharedObject.room,
      sharedObject.publicId,
      sharedObject.activityId
    )
    sharedObject.id = id
    sharedObject.publicId = publicId
  })

  /**
   * Deletes the user created within the tests
   */
  afterAll(async () => {
    await deleteSharedObject(sharedObject.room, sharedObject.publicId)
    await deleteActivity(activity.pin)
  })

  /**
   * Creates a user with correct parameters
   */
  // eslint-disable-next-line max-len
  test('DELETE /api/shared-objects/:id/ -> happy path', async () => {
    const response = await request(app).delete(
      `/api/shared-objects/${sharedObject.id}/`
    )
    expect(response.body.msg).toBeUndefined()
    expect(response.body.data?.id).toBe(sharedObject.id)
    expect(response.statusCode).toBe(200)
  })

  /**
   * Creates a user with partial parameters
   */
  // eslint-disable-next-line max-len
  test('DELETE /api/shared-objects/:id/ -> non existing object', async () => {
    const response = await request(app).delete(
      `/api/shared-objects/${uuidv1()}/`
    )

    expect(response.body.msg).toEqual('Objecto no encontrado')
    expect(response.statusCode).toBe(404)
  })

  /**
   * Creates a user with incorrect parameter names
   */
  // eslint-disable-next-line max-len
  test('DELETE /api/shared-objects/:id/ -> invalid parameters', async () => {
    const response = await request(app).delete(
      '/api/shared-objects/invalid-parameter/'
    )

    expect(response.statusCode).toBe(400)
    expect(response.body.msg).toEqual('Id inválido')
  })
})
