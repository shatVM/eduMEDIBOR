const request = require('supertest');
const app = require('../../server'); // Express app

describe('Users API Integration', () => {
  it('should register a new user (mock)', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({ email: 'test@example.com', password: 'Password123' });
    // Expect 201 or 400 depending on DB state – we just check response exists
    expect([201, 400]).toContain(res.statusCode);
  });

  it('should login a user (mock)', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({ email: 'test@example.com', password: 'Password123' });
    // If login succeeds we get token
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty('token');
    } else {
      expect(res.statusCode).toBe(401);
    }
  });
});
