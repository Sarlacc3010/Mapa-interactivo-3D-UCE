const { Pool } = require('pg');

const pool = new Pool({
  user: 'admin_sql',
  host: 'localhost',
  database: 'uce_main_db',
  password: 'password_sql',
  port: 5432,
});

module.exports = pool;