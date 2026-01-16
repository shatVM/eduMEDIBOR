const request = require('supertest');
const app = require('../../server');

describe('Courses API Integration', () =>> {
  it('should get list of courses', async () => {
    const res = await request(app).get('/api/courses');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
