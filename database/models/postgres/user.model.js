// database/models/postgres/user.model.js
const postgresAdapter = require('../../adapters/postgres.adapter');
const bcrypt = require('bcrypt');

class UserModel {
  // Adjusted to match SQL schema (users table with id, tenant_id, email, password_hash, avatar_url, etc.)
  async findById(userId) {
    const db = postgresAdapter.getInstance();
    return db.oneOrNone(
      `SELECT id, tenant_id, email, password_hash, avatar_url, two_factor_enabled, two_factor_secret,
              suspension_reason, deleted_at, created_at
       FROM users WHERE id = $1`,
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
      tenant_id = null,
      avatar_url = null,
      two_factor_enabled = false,
      two_factor_secret = null,
      suspension_reason = null
    } = user;
    const password_hash = await bcrypt.hash(password, 10);
    const newUser = await db.one(
      `INSERT INTO users (email, password_hash, tenant_id, avatar_url, two_factor_enabled, two_factor_secret, suspension_reason)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING id, email, avatar_url, created_at`,
      [email, password_hash, tenant_id, avatar_url, two_factor_enabled, two_factor_secret, suspension_reason]
    );
    return newUser;
  }
}

module.exports = new UserModel();
