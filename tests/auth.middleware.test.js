const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const { ensureAuth } = require('../middleware/auth.middleware');

const app = express();
app.use(express.json());

// Тестовий роут для авторизації
app.get('/protected', ensureAuth, (req, res) => {
  res.json({ user: req.user });
});

describe('Auth Middleware', () => {
  const secret = 'testsecret';
  const userPayload = { id: 1, email: 'test@example.com', role: 'student' };
  let token;

  beforeAll(() => {
    process.env.JWT_SECRET = secret;
    token = jwt.sign(userPayload, secret, { expiresIn: '1h' });
  });

  it('should deny access without token', async () => {
    const res = await request(app).get('/protected');
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/no token/i);
  });

  it('should deny access with invalid token', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer invalidtoken');
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/invalid token/i);
  });

  it('should allow access with valid token', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.user).toMatchObject(userPayload);
  });
});
