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
          // database/seeds/courses.seed.js
          // Simple seed script for a test course using the updated LMS schema

          const pgp = require('pg-promise')();
          const postgresConfig = require('../../config/postgres.config');
          const env = process.env.NODE_ENV || 'development';
          const db = pgp(postgresConfig[env]);

          async function seedCourses() {
            const client = await db.connect();
            try {
              await client.none('BEGIN');

              // 1️⃣ Create the course
              const courseRes = await client.one(
                `INSERT INTO courses (title, description, tenant_id, instructor_ids, prerequisites, enrollment_limit, completion_certificate)
                 VALUES ($1, $2, NULL, NULL, NULL, NULL, false)
                 RETURNING id;`,
                ['Test Course', 'A demo course for testing the LMS.']
              );
              const courseId = courseRes.id;

              // 2️⃣ Add two modules
              const moduleRes1 = await client.one(
                `INSERT INTO course_modules (course_id, title, position, unlock_rule, is_optional)
                 VALUES ($1, $2, $3, NULL, false)
                 RETURNING id;`,
                [courseId, 'Module 1: Basics', 1]
              );
              const moduleRes2 = await client.one(
                `INSERT INTO course_modules (course_id, title, position, unlock_rule, is_optional)
                 VALUES ($1, $2, $3, NULL, false)
                 RETURNING id;`,
                [courseId, 'Module 2: Advanced', 2]
              );

              // 3️⃣ Create a quiz set for the first module
              const quizSetRes = await client.one(
                `INSERT INTO quiz_sets (module_id, time_limit_minutes, attempts_allowed, passing_score)
                 VALUES ($1, 10, 3, 70)
                 RETURNING id;`,
                [moduleRes1.id]
              );

              // 4️⃣ Add two questions to that quiz set
              await client.none(
                `INSERT INTO quiz_questions (quiz_set_id, question_type, question, options, correct_answers)
                 VALUES ($1, $2, $3, $4, $5),
                        ($1, $6, $7, $8, $9);`,
                [
                  quizSetRes.id,
                  'single',
                  'What is the command to install a package globally?',
                  JSON.stringify(['npm install <pkg>', 'npm i <pkg>', 'npm install -g <pkg>', 'npm i -g <pkg>']),
                  JSON.stringify(['npm install -g <pkg>', 'npm i -g <pkg>']),
                  'multiple',
                  'Which of the following are Node.js core modules?',
                  JSON.stringify(['fs', 'http', 'express', 'path']),
                  JSON.stringify(['fs', 'http', 'path'])
                ]
              );

              // 5️⃣ (Optional) Add a second quiz set for the second module
              const quizSetRes2 = await client.one(
                `INSERT INTO quiz_sets (module_id, time_limit_minutes, attempts_allowed, passing_score)
                 VALUES ($1, 15, 2, 80)
                 RETURNING id;`,
                [moduleRes2.id]
              );

              await client.none(
                `INSERT INTO quiz_questions (quiz_set_id, question_type, question, options, correct_answers)
                 VALUES ($1, $2, $3, $4, $5);`,
                [
                  quizSetRes2.id,
                  'single',
                  'Which event is emitted when a server starts listening?',
                  JSON.stringify(['listening', 'connection', 'request', 'error']),
                  JSON.stringify(['listening'])
                ]
              );

              await client.none('COMMIT');
              console.log('Test course seeded successfully.');
            } catch (err) {
              await client.none('ROLLBACK');
              console.error('Error seeding test course:', err);
            } finally {
              client.done();
            }
          }

          seedCourses().catch(err => console.error(err));
