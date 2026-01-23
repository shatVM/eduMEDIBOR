const request = require('supertest');
const app = require('../../server');
const jwt = require('jsonwebtoken');

describe('Auth Protected Route Integration', () => {
  const secret = process.env.JWT_SECRET || 'testsecret';
  const userPayload = { id: 1, email: 'test@example.com', role: 'student' };
  let token;

  beforeAll(() => {
    // In a real scenario, the secret should be handled more securely
    if (!process.env.JWT_SECRET) {
      process.env.JWT_SECRET = secret;
    }
    token = jwt.sign(userPayload, secret, { expiresIn: '1h' });
  });

  it('should return 401 Unauthorized when no token is provided', async () => {
    const res = await request(app).get('/protected');
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Access denied. No token provided.');
  });

  it('should return 400 Bad Request for an invalid token', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer invalidtoken');
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Invalid token.');
  });

  it('should return 200 OK when a valid token is provided in the Authorization header', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
  });
});
