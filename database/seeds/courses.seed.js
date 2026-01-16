// database/seeds/courses.seed.js
const db = require('../adapters/postgres.adapter');

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
          order: 1,
          quiz: [
            {
              question: 'Яка частота компресій грудної клітки при СЛР?',
              options: ['80-100/хв', '100-120/хв', '120-140/хв', '60-80/хв'],
              correct_answer: 1
            }
          ]
        },
        {
          title: 'Техніка компресій',
          content: 'Правильна техніка виконання компресій грудної клітки',
          videoUrl: '',
          duration: '45 хв',
          order: 2,
          quiz: []
        }
      ]
    },
    // ... (add other courses here in the same format)
];

async function seedCourses() {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        
        for (const courseData of initialCourses) {
            const courseRes = await client.query(
                `INSERT INTO courses (title, description, duration, price, category, image) 
                 VALUES ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT (id) DO NOTHING
                 RETURNING id;`,
                [courseData.title, courseData.description, courseData.duration, courseData.price, courseData.category, courseData.image]
            );
            const courseId = courseRes.rows[0].id;

            for (const lessonData of courseData.lessons) {
                const lessonRes = await client.query(
                    `INSERT INTO lessons (course_id, title, content, "order", duration, video_url)
                     VALUES ($1, $2, $3, $4, $5, $6)
                     RETURNING id;`,
                    [courseId, lessonData.title, lessonData.content, lessonData.order, lessonData.duration, lessonData.videoUrl]
                );
                const lessonId = lessonRes.rows[0].id;

                for (const quizData of lessonData.quiz) {
                    await client.query(
                        `INSERT INTO quizzes (lesson_id, question, options, correct_answer)
                         VALUES ($1, $2, $3, $4);`,
                        [lessonId, quizData.question, JSON.stringify(quizData.options), quizData.correct_answer]
                    );
                }
            }
        }

        await client.query('COMMIT');
        console.log('Courses, lessons, and quizzes seeded successfully.');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Error seeding courses:', e);
    } finally {
        client.release();
    }
}

seedCourses().catch(console.error);
