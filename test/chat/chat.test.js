const supertest = require('supertest')
const app = require('../../index.js')
const db = require('../../utils/db/index.js')
const api = supertest(app)

test('conversation messages are returned as json', async () => {
  await api
    .get('/chat/conversation/2/messages')
    .expect(200)
    .expect('Content-Type', /application\/json/)
})

// afterAll(async () => {
//   await db.promisePoolEnd()
// })