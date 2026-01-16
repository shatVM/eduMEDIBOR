// server.js
const express = require('express');
const hbs = require('hbs');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = 3000;

// Налаштування Handlebars
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
hbs.registerPartials(path.join(__dirname, 'views/partials'));

// Middleware
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Шлях до JSON бази даних
const DB_PATH = path.join(__dirname, 'database');

// Допоміжні функції для роботи з JSON БД
async function readDB(filename) {
  try {
    const data = await fs.readFile(path.join(DB_PATH, filename), 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return filename.includes('courses') ? [] : {};
  }
}

async function writeDB(filename, data) {
  await fs.writeFile(
    path.join(DB_PATH, filename),
    JSON.stringify(data, null, 2)
  );
}

// Handlebars helpers
hbs.registerHelper('eq', (a, b) => a === b);
hbs.registerHelper('inc', (value) => parseInt(value) + 1);

// Маршрути

// Головна сторінка
app.get('/', async (req, res) => {
  const courses = await readDB('courses.json');
  const stats = await readDB('stats.json');
  
  res.render('index', {
    title: 'Навчальні курси для медиків',
    courses: courses.slice(0, 4),
    stats: stats || {
      satisfaction: 98,
      graduates: 10000,
      experience: 15
    }
  });
});

// Список всіх курсів
app.get('/courses', async (req, res) => {
  const courses = await readDB('courses.json');
  res.render('courses', {
    title: 'Всі курси',
    courses
  });
});

// Детальна інформація про курс
app.get('/course/:id', async (req, res) => {
  const courses = await readDB('courses.json');
  const course = courses.find(c => c.id === req.params.id);
  
  if (!course) {
    return res.status(404).render('404', { title: 'Курс не знайдено' });
  }
  
  res.render('course-detail', {
    title: course.title,
    course
  });
});

// Початок проходження курсу
app.get('/course/:id/learn', async (req, res) => {
  const courses = await readDB('courses.json');
  const course = courses.find(c => c.id === req.params.id);
  
  if (!course) {
    return res.status(404).render('404', { title: 'Курс не знайдено' });
  }
  
  res.render('learn', {
    title: `Навчання: ${course.title}`,
    course,
    currentLesson: 0
  });
});

// API для отримання уроку
app.get('/api/course/:courseId/lesson/:lessonIndex', async (req, res) => {
  const courses = await readDB('courses.json');
  const course = courses.find(c => c.id === req.params.courseId);
  
  if (!course || !course.lessons[req.params.lessonIndex]) {
    return res.status(404).json({ error: 'Урок не знайдено' });
  }
  
  res.json(course.lessons[req.params.lessonIndex]);
});

// Збереження прогресу
app.post('/api/progress', async (req, res) => {
  const { userId, courseId, lessonIndex, completed } = req.body;
  const progress = await readDB('progress.json');
  
  if (!progress[userId]) {
    progress[userId] = {};
  }
  
  if (!progress[userId][courseId]) {
    progress[userId][courseId] = {
      completedLessons: [],
      lastAccessed: new Date().toISOString()
    };
  }
  
  if (completed && !progress[userId][courseId].completedLessons.includes(lessonIndex)) {
    progress[userId][courseId].completedLessons.push(parseInt(lessonIndex));
  }
  
  progress[userId][courseId].lastAccessed = new Date().toISOString();
  
  await writeDB('progress.json', progress);
  res.json({ success: true, progress: progress[userId][courseId] });
});

// Отримання прогресу користувача
app.get('/api/progress/:userId/:courseId', async (req, res) => {
  const progress = await readDB('progress.json');
  const userProgress = progress[req.params.userId]?.[req.params.courseId] || {
    completedLessons: [],
    lastAccessed: null
  };
  
  res.json(userProgress);
});

// Форма заявки
app.post('/api/enrollment', async (req, res) => {
  const { name, phone, email, courseId } = req.body;
  const enrollments = await readDB('enrollments.json');
  
  const newEnrollment = {
    id: Date.now().toString(),
    name,
    phone,
    email,
    courseId,
    date: new Date().toISOString(),
    status: 'pending'
  };
  
  enrollments.push(newEnrollment);
  await writeDB('enrollments.json', enrollments);
  
  res.json({ success: true, message: 'Заявку успішно відправлено!' });
});

// Сторінка про нас
app.get('/about', (req, res) => {
  res.render('about', { title: 'Про нас' });
});

// Сертифікація
app.get('/certification', async (req, res) => {
  try {
    const certificateDir = path.join(__dirname, 'public/images/certificate_sample');
    const files = await fs.readdir(certificateDir);
    const certificates = files.map(file => `/images/certificate_sample/${file}`);
    res.render('certification', {
      title: 'Сертифікація',
      certificates
    });
  } catch (error) {
    console.error('Error reading certificates:', error);
    res.render('certification', {
      title: 'Сертифікація',
      certificates: []
    });
  }
});

// 404
app.use((req, res) => {
  res.status(404).render('404', { title: 'Сторінку не знайдено' });
});

// Ініціалізація бази даних та перевірка зображень
async function initialize() {
  await initializeDatabase();
  await checkCourseImages();
}

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущено на http://localhost:${PORT}`);
  initialize();
});

// Перевірка наявності зображень курсів
async function checkCourseImages() {
  const courses = await readDB('courses.json');
  for (const course of courses) {
    if (course.image) {
      const imagePath = path.join(__dirname, 'public', course.image);
      try {
        await fs.access(imagePath);
      } catch (error) {
        console.log(`Зображення не знайдено для курсу "${course.title}". Створення плейсхолдера...`);
        await generateImagePlaceholder(imagePath, course.title);
      }
    }
  }
}

// Генерація плейсхолдера зображення
async function generateImagePlaceholder(imagePath, text) {
  const shortText = text.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '');
  const svgContent = `<svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
  <rect width="600" height="400" fill="#cccccc"/>
  <text x="50%" y="50%" font-family="Arial" font-size="60" fill="white" text-anchor="middle" dy=".3em">${shortText}</text>
</svg>`;
  try {
    await fs.writeFile(imagePath, svgContent);
    console.log(`Плейсхолдер створено: ${imagePath}`);
  } catch (error) {
    console.error(`Помилка створення плейсхолдера: ${error}`);
  }
}

// Ініціалізація бази даних
async function initializeDatabase() {
  try {
    await fs.mkdir(DB_PATH, { recursive: true });
    
    // Створення courses.json
    const coursesExist = await fs.access(path.join(DB_PATH, 'courses.json'))
      .then(() => true)
      .catch(() => false);
    
    if (!coursesExist) {
      const initialCourses = [
        {
          id: 'bls',
          title: 'BLS (Basic Life Support)',
          description: 'Базова серцево-легенева реанімація',
          duration: '8 годин',
          price: '2500 грн',
          image: '/images/bls.svg',
          category: 'emergency',
          lessons: [
            {
              title: 'Вступ до BLS',
              content: 'Основи базової серцево-легеневої реанімації',
              videoUrl: '',
              duration: '30 хв',
              quiz: [
                {
                  question: 'Яка частота компресій грудної клітки при СЛР?',
                  options: ['80-100/хв', '100-120/хв', '120-140/хв', '60-80/хв'],
                  correct: 1
                }
              ]
            },
            {
              title: 'Техніка компресій',
              content: 'Правильна техніка виконання компресій грудної клітки',
              videoUrl: '',
              duration: '45 хв',
              quiz: []
            }
          ]
        },
        {
          id: 'acls',
          title: 'ACLS (Advanced Cardiac Life Support)',
          description: 'Розширена серцево-легенева реанімація',
          duration: '16 годин',
          price: '4500 грн',
          image: '/images/acls.svg',
          category: 'emergency',
          lessons: [
            {
              title: 'Алгоритми ACLS',
              content: 'Основні алгоритми невідкладної допомоги',
              videoUrl: '',
              duration: '60 хв',
              quiz: []
            }
          ]
        },
        {
          id: 'pediatric-care',
          title: 'Невідкладна педіатрична допомога',
          description: 'Особливості надання невідкладної допомоги дітям',
          duration: '12 годин',
          price: '3500 грн',
          image: '/images/pediatric.svg',
          category: 'pediatrics',
          lessons: [
            {
              title: 'Педіатрична оцінка',
              content: 'Швидка оцінка стану дитини',
              videoUrl: '',
              duration: '40 хв',
              quiz: []
            }
          ]
        },
        {
          id: 'traumatology',
          title: 'Травматологія',
          description: 'Надання допомоги при травмах',
          duration: '10 годин',
          price: '3000 грн',
          image: '/images/trauma.svg',
          category: 'trauma',
          lessons: [
            {
              title: 'Оцінка травм',
              content: 'Первинна та вторинна оцінка травмованого пацієнта',
              videoUrl: '',
              duration: '50 хв',
              quiz: []
            }
          ]
        }
      ];
      
      await writeDB('courses.json', initialCourses);
    }
    
    // Створення stats.json
    const statsExist = await fs.access(path.join(DB_PATH, 'stats.json'))
      .then(() => true)
      .catch(() => false);
    
    if (!statsExist) {
      await writeDB('stats.json', {
        satisfaction: 98,
        graduates: 10000,
        experience: 15
      });
    }
    
    // Створення порожніх файлів
    const emptyFiles = ['progress.json', 'enrollments.json'];
    for (const file of emptyFiles) {
      const exists = await fs.access(path.join(DB_PATH, file))
        .then(() => true)
        .catch(() => false);
      
      if (!exists) {
        await writeDB(file, file.includes('progress') ? {} : []);
      }
    }
    
    console.log('База даних ініціалізована успішно');
  } catch (error) {
    console.error('Помилка ініціалізації бази даних:', error);
  }
}