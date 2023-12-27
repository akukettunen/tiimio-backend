const supertest = require('supertest')
const app = require('../../index.js')
const { promisePoolEnd } = require('../../utils/db/index.js')
const api = supertest(app)
require("dotenv").config();

beforeAll(() => {

})

describe('Chat tests', () => {
  test('cannot access messages in a conversation not a part of', async () => {
    await api
      .get('/chat/conversation/2/messages')
      .set('Authorization', `bearer ${global.authToken}`)
      .expect(403)
      // .expect('Content-Type', /application\/json/)
  })
})


afterAll(async () => {
  await promisePoolEnd()
})