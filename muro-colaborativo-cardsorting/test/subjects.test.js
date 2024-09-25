/* eslint-disable max-lines */
/* eslint-disable camelcase */
const { describe, expect, test, beforeAll, afterAll } = require('@jest/globals')
const { v1: uuidv1 } = require('uuid')
const request = require('supertest')
const app = require('../app/app')

const {
  createSubject,
  deleteSubject,
} = require('./test-utilities')

/*
  - [(POST) /api/subjects/](#post-apisubjects)
  */

// eslint-disable-next-line max-lines-per-function
describe('GET /api/subjects/:id', () => {
  /**
   * test user data
   */
  const subject = {
    name: 'Subject get 1',
  }

  /**
   * Creates an activity in database
   */
  beforeAll(async () => {
    const subjectId = await createSubject(subject.name)
    subject.id = subjectId
  })

  /**
   * Deletes the user created within the tests
   */
  afterAll(() => deleteSubject(subject.name))

  /**
   * Creates a user with correct parameters
   */
  // eslint-disable-next-line max-len
  test('GET /api/subjects/:id -> happy path', async () => {
    const response = await request(app).get(`/api/subjects/${subject.id}`)

    expect(response.body.data.id).toEqual(subject.id)
    expect(response.body.data.name).toEqual(subject.name)
    expect(response.statusCode).toBe(200)
  })

  /**
   * Creates a user with partial parameters
   */
  // eslint-disable-next-line max-len
  test('GET /api/subjects/:id -> non existing subject', async () => {
    const response = await request(app).get(`/api/subjects/${uuidv1()}`)

    expect(response.body.msg).toEqual('Materia no encontrada')
    expect(response.statusCode).toBe(404)
  })

  /**
   * Creates a user with incorrect parameter names
   */
  // eslint-disable-next-line max-len
  test('GET /api/subjects/:id -> invalid parameters', async () => {
    const response = await request(app).get('/api/subjects/invalid-param')

    expect(response.statusCode).toBe(400)
    expect(response.body.msg).toEqual('Id inválido')
  })
})

// eslint-disable-next-line max-lines-per-function
describe('GET /api/subjects/', () => {
  /**
   * test user data
   */
  const subject = {
    name: 'Subject get 2',
  }

  /**
   * Creates an activity in database
   */
  beforeAll(async () => {
    const subjectId = await createSubject(subject.name)
    subject.id = subjectId
  })

  /**
   * Deletes the user created within the tests
   */
  afterAll(() => deleteSubject(subject.name))

  /**
   * Creates a user with correct parameters
   */
  // eslint-disable-next-line max-len
  test('GET /api/subjects/ -> happy path', async () => {
    const response = await request(app).get('/api/subjects/')

    expect(response.body.msg).toBeUndefined()
    expect(response.body.data?.length).toBeGreaterThan(1)
    expect(response.statusCode).toBe(200)
  })
})
