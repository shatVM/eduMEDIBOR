// tests/integration/docs.routes.test.js
const express = require('express');
const request = require('supertest');
const docsRouter = require('../../routes/docs.routes');
const path = require('path');
const hbs = require('hbs');

const app = express();

// Setup view engine for testing
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, '../../views'));
hbs.registerPartials(path.join(__dirname, '../../views/partials'));

app.use('/', docsRouter);

describe('Documentation Routes', () => {
    it('should render the API documentation page', async () => {
        const res = await request(app).get('/');
        expect(res.statusCode).toEqual(200);
        expect(res.text).toContain('API Документація'); // Check for a title or specific text in the view
    });
});
