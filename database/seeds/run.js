// database/seeds/run.js
const db = require('../adapters/postgres.adapter');
const bcrypt = require('bcrypt');
const seedData = require('./index');

async function seed() {
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // Seed Users
        console.log('Seeding users...');
        const userPromises = seedData.users.map(async (user) => {
            const password_hash = await bcrypt.hash(user.password, 10);
            return client.query(`
                INSERT INTO users (email, password_hash, name, role)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (email) DO NOTHING;
            `, [user.email, password_hash, user.name, user.role]);
        });
        await Promise.all(userPromises);
        console.log('Users seeded successfully.');

        // Seed Courses
        console.log('Seeding courses...');
        const coursePromises = seedData.courses.map(course => {
            return client.query(`
                INSERT INTO courses (id, title, description, duration, price, image, category)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (id) DO NOTHING;
            `, [course.id, course.title, course.description, course.duration, course.price, course.image, course.category]);
        });
        await Promise.all(coursePromises);
        console.log('Courses seeded successfully.');

        // Seed Modules
        console.log('Seeding modules...');
        const modulePromises = seedData.modules.map(module => {
            return client.query(`
                INSERT INTO course_modules (id, course_id, title, position)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (id) DO NOTHING;
            `, [module.id, module.course_id, module.title, module.position]);
        });
        await Promise.all(modulePromises);
        console.log('Modules seeded successfully.');

        // Seed Lessons
        console.log('Seeding lessons...');
        const lessonPromises = seedData.lessons.map(lesson => {
            return client.query(`
                INSERT INTO lessons (id, module_id, title, type, content)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (id) DO NOTHING;
            `, [lesson.id, lesson.module_id, lesson.title, lesson.type, lesson.content]);
        });
        await Promise.all(lessonPromises);
        console.log('Lessons seeded successfully.');
        
        // Seed Enrollments
        console.log('Seeding enrollments...');
        const enrollmentPromises = seedData.enrollments.map(enrollment => {
            return client.query(`
                INSERT INTO enrollments (user_id, course_id, enrollment_date, status)
                VALUES ((SELECT id FROM users WHERE email = $1), $2, $3, $4)
                ON CONFLICT (user_id, course_id) DO NOTHING;
            `, [enrollment.user_email, enrollment.course_id, enrollment.enrollment_date, enrollment.status]);
        });
        await Promise.all(enrollmentPromises);
        console.log('Enrollments seeded successfully.');

        await client.query('COMMIT');
        console.log('All data seeded successfully!');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Error seeding data:', e);
    } finally {
        client.release();
        // pgp.end(); // This will close all connections in the pool
    }
}

seed().catch(console.error);
