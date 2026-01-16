const dbManager = require('../database/manager');
const db = require('../config/database.config');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const syncService = require('./sync.service');

class UserService {
  constructor() {
    this.User = dbManager.get('users');
  }

  async getUserByEmail(email) {
    const res = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    return res.rows[0] || null;
  }

  async createFromFirebase(decoded) {
    const { email, name, picture, uid } = decoded;
    const res = await db.query(
      `INSERT INTO users (email, full_name, photo_url, firebase_uid, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
      [email, name, picture, uid]
    );
    return res.rows[0];
  }

  async updateFromFirebase(id, decoded) {
    const { name, picture } = decoded;
    await db.query(
      `UPDATE users SET full_name = $1, photo_url = $2 WHERE id = $3`,
      [name, picture, id]
    );
  }

  async register(userData) {
    const existingUser = await this.User.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists.');
    }

    const newUser = await this.User.create(userData);
    
    // Sync to firebase
    await syncService.syncOnCreate('users', newUser);
    
    return newUser;
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
    const userRes = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    if (!userRes.rows[0]) return null;
    const user = userRes.rows[0];

    // Курси
    if (opts.withCourses) {
      const coursesRes = await db.query(
        `SELECT c.title, e.status FROM enrollments e JOIN courses c ON e.course_id = c.id WHERE e.user_id = $1`,
        [id]
      );
      user.courses = coursesRes.rows;
    }
    // Прогрес
    if (opts.withProgress) {
      const progressRes = await db.query(
        `SELECT c.title as course_title, p.percent FROM progress p JOIN courses c ON p.course_id = c.id WHERE p.user_id = $1`,
        [id]
      );
      user.progress = progressRes.rows;
    }
    // Сертифікати
    if (opts.withCertificates) {
      const certRes = await db.query(
        `SELECT c.title, s.date FROM stats s JOIN courses c ON s.course_id = c.id WHERE s.user_id = $1 AND s.certificate_url IS NOT NULL`,
        [id]
      );
      user.certificates = certRes.rows;
    }
    return user;
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
    await db.query(`UPDATE users SET ${fields.join(', ')} WHERE id = $${idx}`, values);
  }
}

module.exports = new UserService();
