const dbManager = require('../database/manager');
const postgresAdapter = require('../database/adapters/postgres.adapter');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const syncService = require('./sync.service');

class UserService {
  constructor() {
    this.User = dbManager.get('users');
  }

  async getUserByEmail(email) {
    const res = await postgresAdapter.getInstance().query('SELECT * FROM users WHERE email = $1', [email]);
    return res.rows[0] || null;
  }

  async createFromFirebase(decoded) {
    const { email, name, picture, uid } = decoded;
    const res = await postgresAdapter.getInstance().query(
      `INSERT INTO users (email, full_name, photo_url, firebase_uid, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
      [email, name, picture, uid]
    );
    return res.rows[0];
  }

  async updateFromFirebase(id, decoded) {
    const { name, picture } = decoded;
    await postgresAdapter.getInstance().query(
      `UPDATE users SET full_name = $1, photo_url = $2 WHERE id = $3`,
      [name, picture, id]
    );
  }

  async create(userData, options = {}) {
    const { email, password, full_name } = userData;
    const { before, after } = options;

    // Validate input
    if (!email || !password || !full_name) {
      throw new Error('Email, password, and full name are required.');
    }

    // Check if user already exists
    const existingUser = await this.getUserByEmail(email);
    if (existingUser) {
      throw new Error('User with this email already exists.');
    }

    if (before) {
      await before(userData);
    }

    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Split full_name into first_name and last_name
    const nameParts = full_name.split(' ');
    const first_name = nameParts[0];
    const last_name = nameParts.slice(1).join(' ');

    try {
      // Create user in database
      const res = await postgresAdapter.getInstance().query(
        `INSERT INTO users (email, first_name, last_name, password_hash) 
         VALUES ($1, $2, $3, $4) 
         RETURNING user_id, email, first_name, last_name, role, registration_date`,
        [email, first_name, last_name, password_hash]
      );

      const dbUser = res.rows[0];
      const newUser = {
        id: dbUser.user_id,
        email: dbUser.email,
        full_name: `${dbUser.first_name} ${dbUser.last_name}`,
        role: dbUser.role,
        created_at: dbUser.registration_date
      };


      if (after) {
        await after(newUser);
      }

      // Sync to firebase if available
      try {
        await syncService.syncOnCreate('users', newUser);
      } catch (err) {
        // Continue even if sync fails
        console.warn('Firebase sync failed during creation:', err.message);
      }

      return newUser;
    } catch (error) {
      throw new Error('Error creating user: ' + error.message);
    }
  }

  async login(credentials) {
    const { email, password } = credentials;
    const user = await this.User.findByEmail(email);

    if (!user) {
      throw new Error('Invalid email or password.');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new Error('Invalid email or password.');
    }
    
    // Don't include password hash in the token or response
    const payload = { id: user.user_id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    const userResponse = { ...user };
    delete userResponse.password_hash;

    return { token, user: userResponse };
  }
  
  async getUserById(id, opts = {}) {
    // Основні дані
    const userRes = await postgresAdapter.getInstance().query('SELECT * FROM users WHERE id = $1', [id]);
    if (!userRes.rows[0]) return null;
    const user = userRes.rows[0];

    // Прогрес
    if (opts.withProgress) {
      const progressRes = await postgresAdapter.getInstance().query(
        `SELECT c.title as course_title, p.percent FROM progress p JOIN courses c ON p.course_id = c.id WHERE p.user_id = $1`,
        [id]
      );
      user.progress = progressRes.rows;
    }
    // Сертифікати
    if (opts.withCertificates) {
      const certRes = await postgresAdapter.getInstance().query(
        `SELECT c.title, s.date FROM stats s JOIN courses c ON s.course_id = c.id WHERE s.user_id = $1 AND s.certificate_url IS NOT NULL`,
        [id]
      );
      user.certificates = certRes.rows;
    }
    return user;
  }

  async deleteUser(id) {
    if (!id) {
      throw new Error('User ID is required for deletion.');
    }
    await postgresAdapter.getInstance().query('DELETE FROM users WHERE id = $1', [id]);
  }

  async updateUserProfile(id, data) {
    const fields = [];
    const values = [];
    let idx = 1;
    for (const key in data) {
      fields.push(`${key} = $${idx}`);
      values.push(data[key]);
      idx++;
    }
    if (!fields.length) return;
    values.push(id);
    await postgresAdapter.getInstance().query(`UPDATE users SET ${fields.join(', ')} WHERE id = $${idx}`, values);
  }
}

module.exports = new UserService();
