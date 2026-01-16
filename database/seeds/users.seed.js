// database/seeds/users.seed.js
const db = require('../adapters/postgres.adapter');
const bcrypt = require('bcrypt');

async function seedUsers() {
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        const password_hash = await bcrypt.hash('password123', 10);
        
        await client.query(`
            INSERT INTO users (email, password_hash, name, role) 
            VALUES ('student@example.com', $1, 'Test Student', 'student')
            ON CONFLICT (email) DO NOTHING;
        `, [password_hash]);

        await client.query('COMMIT');
        console.log('Users seeded successfully.');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Error seeding users:', e);
    } finally {
        client.release();
    }
}

// Run the seeder
seedUsers().catch(console.error);
