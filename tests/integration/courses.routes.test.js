// tests/integration/courses.routes.test.js
const express = require('express');
const request = require('supertest');
const coursesRouter = require('../../routes/courses.routes');
const courseService = require('../../services/course.service');

// Mock the course service
jest.mock('../../services/course.service');

const app = express();
app.use('/api/courses', coursesRouter);

describe('Courses Routes', () => {

    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();
    });

    describe('GET /api/courses', () => {
        it('should return all courses', async () => {
            const mockCourses = [
                { id: 'bls', title: 'BLS' },
                { id: 'acls', title: 'ACLS' }
            ];
            courseService.getAllCourses.mockResolvedValue(mockCourses);

            const res = await request(app).get('/api/courses');

            expect(res.statusCode).toBe(200);
            expect(res.body).toEqual(mockCourses);
            expect(courseService.getAllCourses).toHaveBeenCalledTimes(1);
        });

        it('should handle errors', async () => {
            courseService.getAllCourses.mockRejectedValue(new Error('Database Error'));

            const res = await request(app).get('/api/courses');

            expect(res.statusCode).toBe(500);
            expect(res.body.message).toBe('Database Error');
        });
    });

    describe('GET /api/courses/:id', () => {
        it('should return a single course by id', async () => {
            const mockCourse = { id: 'bls', title: 'BLS' };
            courseService.getCourseById.mockResolvedValue(mockCourse);

            const res = await request(app).get('/api/courses/bls');

            expect(res.statusCode).toBe(200);
            expect(res.body).toEqual(mockCourse);
            expect(courseService.getCourseById).toHaveBeenCalledWith('bls');
        });

        it('should return 404 if course not found', async () => {
            courseService.getCourseById.mockResolvedValue(null);

            const res = await request(app).get('/api/courses/not-found');

            expect(res.statusCode).toBe(404);
            expect(res.body.message).toBe('Course not found');
        });

        it('should handle errors', async () => {
            courseService.getCourseById.mockRejectedValue(new Error('Database Error'));

            const res = await request(app).get('/api/courses/bls');

            expect(res.statusCode).toBe(500);
            expect(res.body.message).toBe('Database Error');
        });
    });
});
