const request = require('supertest');
const app = require('../../server');
const { ensureAuth } = require('../middleware/auth.middleware'); // not used directly, just placeholder

describe('Auth Middleware Unit', () => {
  const jwt = require('jsonwebtoken');
  const secret = 'testsecret';
  const payload = { id: 1, email: 'test@example.com' };
  let token;

  beforeAll(() => {
    process.env.JWT_SECRET = secret;
    token = jwt.sign(payload, secret, { expiresIn: '1h' });
  });

  it('denies access without token', async () => {
    const res = await request(app).get('/protected'); // need a protected route in server for test
    expect(res.statusCode).toBe(401);
  });
});
