/* eslint-disable camelcase */
const { describe, expect, test, beforeAll, afterAll } = require('@jest/globals')
const request = require('supertest')
const app = require('../app/app')

const { createUser, deleteUser } = require('./test-utilities')

// eslint-disable-next-line max-lines-per-function
describe('POST /api/users/', () => {
  /**
   * test user data
   */
  const user = {
    email: 'johndoe@gmail.com',
    name: 'John Doe',
    pw: 'JohnDoe123$',
  }

  /**
   * Deletes the user created within the tests
   */
  afterAll(() => deleteUser(user.name, user.email))

  /**
   * Creates a user with correct parameters
   */
  test('POST /api/users/ -> happy path', async () => {
    const response = await request(app).post('/api/users/').send(user)

    expect(response.body.msg).toEqual('Usuario creado exitosamente')
    expect(response.statusCode).toBe(201)
  })

  /**
   * Creates a user with partial parameters
   */
  test('POST /api/users/ -> partial body', async () => {
    const response = await request(app).post('/api/users/').send({
      email: user.email,
    })

    expect(response.body.msg).toEqual('Parámetros faltantes: name, pw')
    expect(response.statusCode).toBe(400)
  })

  /**
   * Creates a user with incorrect parameter names
   */
  test('POST /api/users/ -> invalid body', async () => {
    const response = await request(app).post('/api/users/').send({
      foo: 'bar',
    })

    expect(response.statusCode).toBe(400)
    expect(response.body).toEqual(
      expect.objectContaining({
        msg: 'Parámetros incorrectos. Datos esperados: email, name, pw',
      })
    )
  })
})

// eslint-disable-next-line max-lines-per-function
describe('POST /api/users/login/', () => {
  /**
   * test user
   */
  const user = {
    email: 'janedoe@gmail.com',
    name: 'Jane Doe',
    pw: 'JaneDoe123$',
  }

  /**
   * Creates the test user in database
   */
  beforeAll(() => createUser(user.email, user.name, user.pw))

  /**
   * Deletes test user from database
   */
  afterAll(() => deleteUser(user.name, user.email))

  /**
   * Login with correct credentials
   */
  test('POST /api/users/login/ -> happy path', async () => {
    const response = await request(app).post('/api/users/login/').send({
      email: user.email,
      pw: user.pw,
    })

    expect(response.statusCode).toBe(200)
    expect(response.body.msg).toEqual('access granted')
  })

  /**
   * Login with incorrect credentials
   */
  test('POST /api/users/login/ -> user not found', async () => {
    const response = await request(app)
      .post('/api/users/login/')
      .send({
        email: 'j' + user.email,
        pw: user.pw,
      })

    expect(response.statusCode).toBe(400)
    expect(response.body.msg).toEqual('Usuario o Contraseña Incorrectos')
  })

  /**
   * Login with incorrect parameter names
   */
  test('POST /api/users/login/ -> invalid body', async () => {
    const response = await request(app).post('/api/users/login/').send({
      foo: 'bar',
    })

    expect(response.statusCode).toBe(400)
    expect(response.body.msg).toEqual(
      'Parámetros incorrectos. Datos esperados: email, pw'
    )
  })
})

// eslint-disable-next-line max-lines-per-function
describe('POST /api/users/recover/', () => {
  /**
   * test user
   */
  const user = {
    email: 'jindoe@gmail.com',
    name: 'Jin Doe',
    pw: 'JinDoe123$',
  }

  /**
   * Creates test user in database
   */
  beforeAll(() => createUser(user.email, user.name, user.pw))

  /**
   * Deletes test user from database
   */
  afterAll(() => deleteUser(user.name, user.email))

  /**
   * Request password reset for test user
   */
  test('POST /api/users/recover/ -> happy path', async () => {
    const response = await request(app)
      .post('/api/users/recover/')
      .send({
        email: user.email,
      })

    expect(response.statusCode).toBe(200)
    expect(response.body.msg).toEqual('user found, email sent')
  })

  /**
   * Request password reset for an unexisting user
   */
  test('POST /api/users/recover/ -> user not found', async () => {
    const response = await request(app)
      .post('/api/users/recover/')
      .send({
        email: 'j' + user.email,
        pw: user.pw,
      })

    expect(response.statusCode).toBe(404)
    expect(response.body.msg).toEqual('Correo no registrado')
  })

  /**
   * Request password reset with invalid parameter names
   */
  test('POST /api/users/recover/ -> invalid body', async () => {
    const response = await request(app)
      .post('/api/users/recover/')
      .send({
        foo: 'bar',
      })

    expect(response.statusCode).toBe(400)
    expect(response.body.msg).toEqual(
      'Parámetros incorrectos. Datos esperados: email'
    )
  })
})
