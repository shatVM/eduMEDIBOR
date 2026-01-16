module.exports = {
  development: {
    host: 'localhost',
    port: 5432,   
    database: 'edumedibor_dev',
    user: 'postgres',
    password: 'admin',
    max: 20, // connection pool
    idleTimeoutMillis: 30000
  },
  
  production: {
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    database: process.env.PG_DATABASE,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    ssl: {
      rejectUnauthorized: false
    }
  }
};