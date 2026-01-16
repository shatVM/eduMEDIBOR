// database/adapters/postgres.adapter.js
const pgp = require('pg-promise')();
const BaseAdapter = require('./base.adapter');
const postgresConfig = require('../../config/postgres.config');

class PostgresAdapter extends BaseAdapter {
  constructor() {
    const env = process.env.NODE_ENV || 'development';
    super(postgresConfig[env]);
    this.db = null;
  }

  async connect() {
    if (!this.db) {
      this.db = pgp(this.config);
      await this.db.connect()
        .then(obj => {
          console.log('PostgreSQL connected successfully');
          obj.done();
        })
        .catch(error => {
          console.error('Error connecting to PostgreSQL:', error.message);
        });
    }
    return this.db;
  }

  async disconnect() {
    if (this.db) {
      await pgp.end();
      this.db = null;
      console.log('PostgreSQL disconnected successfully');
    }
  }

  getInstance() {
    if (!this.db) {
      throw new Error("PostgreSQL adapter is not connected. Call connect() first.");
    }
    return this.db;
  }
}

module.exports = new PostgresAdapter();
