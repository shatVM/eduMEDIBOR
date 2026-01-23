const request = require('supertest');
const app = require('../../server'); // Express app
const db = require('../../database/adapters/postgres.adapter');
const admin = require('firebase-admin');

// Mock firebase-admin
jest.mock('firebase-admin', () => ({
  auth: () => ({
    verifyIdToken: jest.fn().mockResolvedValue({
      email: 'firebase_user@example.com',
      name: 'Firebase User',
      picture: 'http://example.com/photo.jpg',
    }),
  }),
  initializeApp: jest.fn(),
}));

describe('Users API Integration', () => {
  beforeAll(async () => {
    await db.connect();
  });

  afterAll(async () => {
    // Clean up the users table after all tests
    const dbInstance = db.getInstance();
    await dbInstance.none('DELETE FROM users WHERE email LIKE $1 OR email = $2', ['test_user_%@example.com', 'firebase_user@example.com']);
    await db.disconnect();
  });

  const uniqueEmail = `test_user_${Date.now()}@example.com`;
  const password = 'Password123';
  let token;

  it('should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({ email: uniqueEmail, password: password, full_name: 'Test User' });
      
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('email', uniqueEmail);
  });

  it('should not register a user with an existing email', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({ email: uniqueEmail, password: password, full_name: 'Test User' });

    expect(res.statusCode).toBe(400);
  });

  it('should login the newly registered user', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({ email: uniqueEmail, password: password });
      
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('email', uniqueEmail);
    token = res.body.token; // Save token for the next test
  });

  it('should not login with incorrect password', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({ email: uniqueEmail, password: 'WrongPassword' });
      
    expect(res.statusCode).toBe(401);
  });

  it('should get the current user profile with a valid token', async () => {
    const res = await request(app)
      .get('/api/users/me')
      .set('Cookie', `token=${token}`); // Send token in a cookie
      
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('email', uniqueEmail);
  });

  it('should not get user profile without a token', async () => {
    const res = await request(app)
      .get('/api/users/me');
      
    expect(res.statusCode).toBe(401);
  });

  it('should handle firebase login and create a new user', async () => {
    const res = await request(app)
      .post('/api/users/firebase-login')
      .send({ idToken: 'test_firebase_token' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.headers['set-cookie']).toBeDefined();

    // Verify the user was created in the database
    const dbInstance = db.getInstance();
    const user = await dbInstance.oneOrNone('SELECT * FROM users WHERE email = $1', 'firebase_user@example.com');
    expect(user).not.toBeNull();
    expect(user.full_name).toBe('Firebase User');
  });
});
