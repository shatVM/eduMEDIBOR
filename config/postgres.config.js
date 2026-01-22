module.exports = {
  development: {
    host: 'localhost',
    port: 5432,
    database: 'edumedibor_dev',
    user: 'postgres',
    password: 'admin',
    max: 20,
    idleTimeoutMillis: 30000,
    ssl: false
  },

  production: {
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  }
};