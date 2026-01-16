// database/models/postgres/user.model.js
const postgresAdapter = require('../../adapters/postgres.adapter');
const bcrypt = require('bcrypt');

class UserModel {
  async findById(userId) {
    const db = postgresAdapter.getInstance();
    return db.oneOrNone(
      `SELECT user_id, email, first_name, last_name, date_of_birth, gender, phone_number,
              profile_picture_url, bio, locale, role, is_active, email_verified,
              registration_date, last_login, last_password_change, failed_login_attempts,
              custom_attributes, created_by, updated_at
       FROM users WHERE user_id = $1`,
      [userId]
    );
  }

  async findByEmail(email) {
    const db = postgresAdapter.getInstance();
    return db.oneOrNone('SELECT * FROM users WHERE email = $1', [email]);
  }

  async create(user) {
    const db = postgresAdapter.getInstance();
    const {
      email,
      password,
      first_name,
      last_name,
      date_of_birth = null,
      gender = null,
      phone_number = null,
      profile_picture_url = null,
      bio = null,
      locale = 'uk',
      role = 'student',
      is_active = true,
      email_verified = false,
      custom_attributes = null,
      created_by = null
    } = user;
    const password_hash = await bcrypt.hash(password, 10);
    const newUser = await db.one(
      `INSERT INTO users (email, password_hash, first_name, last_name, date_of_birth, gender,
                         phone_number, profile_picture_url, bio, locale, role, is_active,
                         email_verified, custom_attributes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING user_id, email, first_name, last_name, role, created_at, updated_at`,
      [
        email,
        password_hash,
        first_name,
        last_name,
        date_of_birth,
        gender,
        phone_number,
        profile_picture_url,
        bio,
        locale,
        role,
        is_active,
        email_verified,
        custom_attributes,
        created_by
      ]
    );
    return newUser;
  }
}

module.exports = new UserModel();
