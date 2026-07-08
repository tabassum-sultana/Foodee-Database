const mysql = require("mysql2/promise");
require("dotenv").config();

const dbName = process.env.DB_NAME || "foodee_db";
const baseConfig = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true
};

const pool = mysql.createPool({
  ...baseConfig,
  database: dbName
});

async function ensureDatabase() {
  const connection = await mysql.createConnection(baseConfig);
  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
  } finally {
    await connection.end();
  }
}

pool.ensureDatabase = ensureDatabase;
pool.dbName = dbName;

module.exports = pool;
