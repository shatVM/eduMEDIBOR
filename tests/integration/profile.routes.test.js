// tests/integration/profile.routes.test.js
const express = require('express');
const request = require('supertest');
const profileRouter = require('../../routes/profile.routes');
const userService = require('../../services/user.service');
const authMiddleware = require('../../middleware/auth.middleware');
const path = require('path');
const hbs = require('hbs');
const fs = require('fs');

// Mock services and middleware
jest.mock('../../services/user.service');
jest.mock('../../middleware/auth.middleware');

const app = express();

// Middleware to parse request bodies
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Setup view engine for testing
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, '../../views'));
hbs.registerPartials(path.join(__dirname, '../../views/partials'));

// A mock user for testing
const mockUser = {
    id: '1',
    name: 'Test User',
    email: 'test@test.com',
    courses: [{ title: 'Test Course', status: 'in-progress' }],
    progress: [{ course_title: 'Test Course', percent: 50 }],
    certificates: [{ title: 'Test Certificate', date: '2023-01-01' }]
};

// Apply a mocked ensureAuth middleware
authMiddleware.ensureAuth.mockImplementation((req, res, next) => {
    req.user = mockUser;
    next();
});

app.use('/profile', profileRouter);

describe('Profile Routes', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /profile', () => {
        it('should render the profile page with all user data', async () => {
            userService.getUserById.mockResolvedValue(mockUser);

            const res = await request(app).get('/profile');

            expect(res.statusCode).toBe(200);
            expect(res.text).toContain(mockUser.name);
            expect(res.text).toContain('Курси');
            expect(res.text).toContain('Прогрес');
            expect(res.text).toContain('Сертифікати');
            expect(userService.getUserById).toHaveBeenCalledWith(mockUser.id, {
                withCourses: true,
                withProgress: true,
                withCertificates: true
            });
        });

        it('should render 500 if user not found', async () => {
            userService.getUserById.mockRejectedValue(new Error('User not found'));
            
            const res = await request(app).get('/profile');

            expect(res.statusCode).toBe(500);
            expect(res.text).toContain('Не вдалося завантажити профіль.');
        });
    });

    describe('POST /profile/edit', () => {
        it('should update user profile without a photo and redirect', async () => {
            const updates = {
                full_name: 'Updated Name',
                phone: '1234567890',
            };
            userService.updateUserProfile.mockResolvedValue({ ...mockUser, ...updates });

            const res = await request(app)
                .post('/profile/edit')
                .send(updates);

            expect(res.statusCode).toBe(302); // Redirect status
            expect(res.headers.location).toBe('/profile');
            expect(userService.updateUserProfile).toHaveBeenCalledWith(mockUser.id, expect.objectContaining(updates));
        });

        it('should update user profile with a photo and redirect', async () => {
            const updates = { full_name: 'Updated Name' };
            const filePath = path.join(__dirname, 'test-avatar.png');
            // Create a dummy file for upload
            fs.writeFileSync(filePath, 'test'); 
            
            userService.updateUserProfile.mockResolvedValue({});

            const res = await request(app)
                .post('/profile/edit')
                .field('full_name', updates.full_name)
                .attach('photo', filePath);

            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe('/profile');
            expect(userService.updateUserProfile).toHaveBeenCalledWith(mockUser.id, expect.objectContaining({
                full_name: updates.full_name,
                photo_url: expect.stringContaining('/images/profiles/1.png')
            }));

            // Clean up dummy file
            fs.unlinkSync(filePath);
        });
        
        it('should handle errors during profile update', async () => {
            const updates = { full_name: 'New Name' };
            userService.updateUserProfile.mockRejectedValue(new Error('Update failed'));

            const res = await request(app)
                .post('/profile/edit')
                .send(updates);

            expect(res.statusCode).toBe(500);
            expect(res.text).toContain('Не вдалося зберегти зміни.');
        });
    });
});
