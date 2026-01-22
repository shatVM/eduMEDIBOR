// server.js
require('dotenv').config();
const express = require('express');
const hbs = require('hbs');
const path = require('path');
const fs = require('fs');
const dbManager = require('./database/manager');

const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3001;

// JWT auth from cookie (має бути після app створення)
app.use((req, res, next) => {
  const token = req.cookies?.token;
  if (token) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      req.user = null;
    }
  }
  next();
});
const cookieParser = require('cookie-parser');

// Import routes
const courseRoutes = require('./routes/courses.routes');
const userRoutes = require('./routes/users.routes');
const progressRoutes =require('./routes/progress.routes');

// Import services for view rendering
const courseService = require('./services/course.service'); 
const profileRouter = require('./routes/profile.routes');



// Setup Handlebars
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
hbs.registerPartials(path.join(__dirname, 'views/partials'));

// Register partials explicitly
hbs.registerPartial('login-modal', hbs.handlebars.compile(require('fs').readFileSync(path.join(__dirname, 'views/partials/login-modal.hbs'), 'utf8')));
hbs.registerPartial('register-modal', hbs.handlebars.compile(require('fs').readFileSync(path.join(__dirname, 'views/partials/register-modal.hbs'), 'utf8')));

// Handlebars helpers
hbs.registerHelper('eq', (a, b) => a === b);
hbs.registerHelper('inc', (value) => parseInt(value) + 1);
hbs.registerHelper('json', (context) => JSON.stringify(context));

// Middleware
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Додаємо user у шаблони, якщо авторизований
app.use((req, res, next) => {
  if (req.user) {
    res.locals.user = req.user;
  } else {
    res.locals.user = null;
  }
  next();
});

// API Routes
app.use('/api/courses', courseRoutes);
app.use('/api/users', userRoutes);
app.use('/api/progress', progressRoutes);

// Profile route
app.use('/profile', profileRouter);


// View Routes
app.get('/', async (req, res) => {
  // This will be updated to use a proper service
  const courses = await courseService.getAllCourses(); 
  res.render('index', {
    title: 'Навчальні курси для медиків',
    courses: courses.slice(0, 4),
    stats: { // This will be moved to a service or config
      satisfaction: 98,
      graduates: 10000,
      experience: 15
    }
  });
});

app.get('/courses', async (req, res) => {
  const courses = await courseService.getAllCourses();
  res.render('courses', {
    title: 'Всі курси',
    courses
  });
});

app.get('/course/:id', async (req, res) => {
    const course = await courseService.getCourseWithDetails(req.params.id);
    if (!course) {
        return res.status(404).render('404', { title: 'Курс не знайдено' });
    }
    res.render('course-detail', {
        title: course.title,
        course
    });
});

app.get('/course/:id/learn', async (req, res) => {
    const course = await courseService.getCourseById(req.params.id);
    if (!course) {
        return res.status(404).render('404', { title: 'Курс не знайдено' });
    }
    res.render('learn', {
        title: `Навчання: ${course.title}`,
        course,
    });
});

app.get('/about', (req, res) => {
  res.render('about', { title: 'Про нас' });
});

app.get('/certification', (req, res) => {
    // Read sample certificate images from public/images/certificate_sample
  try {
    const certDir = path.join(__dirname, 'public', 'images', 'certificate_sample');
    let files = [];
    try {
      files = fs.readdirSync(certDir);
    } catch (e) {
      files = [];
    }
    // Filter common image extensions and map to public URLs
    const images = files
      .filter(f => /\.(jpe?g|png|gif|webp|svg)$/i.test(f))
      .map(f => `/images/certificate_sample/${encodeURIComponent(f)}`);

    res.render('certification', { title: 'Сертифікація', certificates: images });
  } catch (err) {
    console.error('Failed to load certificate samples', err);
    res.render('certification', { title: 'Сертифікація', certificates: [] });
  }
});

app.get('/login', (req, res) => {
    res.render('login', { title: 'Вхід' }); // We need to create login.hbs
});




// 404 Handler
app.use((req, res) => {
  res.status(404).render('404', { title: 'Сторінку не знайдено' });
});

// Export app for testing
module.exports = app;

// Start server only when run directly
if (require.main === module) {
  (async () => {
    try {
      await dbManager.connect();
      app.listen(PORT, () => {
        console.log(`Сервер запущено на http://localhost:${PORT}`);
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  })();
}