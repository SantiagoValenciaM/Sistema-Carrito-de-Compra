const mysql = require('mysql2');

const pool = mysql.createPool({
  connectionLimit: 10, // Puedes ajustar según tus necesidades
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
});

module.exports = pool;
