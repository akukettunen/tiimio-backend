const request = require('supertest');
const app = require('../index.js')

// Global variable to store the token
global.authToken = '';

describe('Create users', () => {
    beforeAll(async () => {
        // Database initialization logic here

        // Sign-in logic to get the token
        const response = await request(app)
            .post('/auth/signin')
            .send({ email: 'user@testing.com', password: 'password', password_again: 'password', lang: 'en', full_name: 'Aku Kettunen' })
            .expect(200)

        global.authToken = response.body.token; // Save the token globally

        const response2 = await request(app)
            .post('/auth/signin')
            .send({ email: 'user2@testing.com', password: 'password', password_again: 'password', lang: 'fi', full_name: 'Aku Lettunen' })
            .expect(200)

        global.authToken2 = response2.body.token; // Save the token globally
    });

    it('should sign in and get token', () => {
        expect(global.authToken).not.toBe('');
        expect(global.authToken2).not.toBe('');
    });

    // Other root level tests
});

describe('Create and join teams', () => {
  it('should create team', async () => {
    const resp = await request(app)
      .post('/team')
      .set('Authorization', `bearer ${global.authToken}`)
      .send({ team_name: "Test team 1", sport_id: 'baseball', plan_id: 11, dont_create_stripe: true })
      .expect(200)

      global.authToken = resp.body.token; // Save the token globally
      global.team1Id = resp.body.team_id; // Save the token globally
    })
  })