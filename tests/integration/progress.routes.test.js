const request = require('supertest');
const app = require('../../server');
const admin = require('firebase-admin');
const pg_db = require('../../database/adapters/postgres.adapter');

// Mock the entire firebase-admin library
jest.mock('firebase-admin', () => {
  const mockDatabase = {
    ref: jest.fn().mockReturnThis(),
    once: jest.fn(),
    update: jest.fn().mockResolvedValue(null),
  };
  return {
    initializeApp: jest.fn(),
    auth: () => ({}),
    database: () => mockDatabase,
  };
});

describe('Progress API Integration', () => {
  let token;
  let userId;
  const courseId = 'test_course_1';

  beforeAll(async () => {
    // Connect to postgres to create a user for authentication
    await pg_db.connect();
    const dbInstance = pg_db.getInstance();
    
    const uniqueEmail = `progress_user_${Date.now()}@example.com`;
    const password = 'Password123';

    // Register user
    const userRes = await request(app)
      .post('/api/users/register')
      .send({ email: uniqueEmail, password, full_name: 'Progress User' });
    
    userId = userRes.body.id;

    // Login to get token
    const loginRes = await request(app)
      .post('/api/users/login')
      .send({ email: uniqueEmail, password });
      
    token = loginRes.body.token;
  });

  afterAll(async () => {
    // Clean up the user from postgres
    const dbInstance = pg_db.getInstance();
    await dbInstance.none('DELETE FROM users WHERE id = $1', [userId]);
    await pg_db.disconnect();
  });

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/progress/:courseId', () => {
    it('should return user progress for a course', async () => {
      const mockProgress = {
        lesson1: { completed: true },
        lesson2: { completed: false },
      };
      
      // Setup the mock for firebase
      const db = admin.database();
      db.once.mockResolvedValue({
        val: () => mockProgress,
      });

      const res = await request(app)
        .get(`/api/progress/${courseId}`)
        .set('Cookie', `token=${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(mockProgress);
      expect(db.ref).toHaveBeenCalledWith(`progress/${userId}/${courseId}`);
    });

    it('should return an empty object if no progress exists', async () => {
      const db = admin.database();
      db.once.mockResolvedValue({
        val: () => null, // No progress found
      });

      const res = await request(app)
        .get(`/api/progress/${courseId}`)
        .set('Cookie', `token=${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({});
    });
  });

  describe('POST /api/progress/update', () => {
    it('should update user progress and return success', async () => {
      const progressUpdate = {
        courseId: courseId,
        lessonId: 'lesson3',
        completed: true,
      };

      const db = admin.database();

      const res = await request(app)
        .post('/api/progress/update')
        .set('Cookie', `token=${token}`)
        .send(progressUpdate);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Progress updated');

      // Verify firebase update was called
      const expectedPath = `progress/${userId}/${courseId}/lesson3`;
      const expectedUpdate = { completed: true };
      expect(db.ref).toHaveBeenCalledWith(expectedPath);
      expect(db.update).toHaveBeenCalledWith(expectedUpdate);
    });

    it('should return 401 if user is not authenticated', async () => {
        const res = await request(app)
            .post('/api/progress/update')
            .send({ courseId, lessonId: 'lesson4', completed: true });

        expect(res.statusCode).toBe(401);
    });
  });
});
