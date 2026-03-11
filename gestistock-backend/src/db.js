const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

let pool;

async function initDB() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
  console.log(`Base de donnees "${process.env.DB_NAME}" prete`);
  await connection.end();

  const schemaPath = path.join(__dirname, '..', '..', 'database', 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  const dbConnection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
  });

  const [rows] = await dbConnection.query(
    'SELECT 1 FROM information_schema.tables WHERE table_schema = ? AND table_name = ? LIMIT 1',
    [process.env.DB_NAME, 'utilisateur']
  );

  if (rows.length === 0) {
    const withoutComments = schemaSql.replace(/^\s*--.*$/gm, '');
    const statements = withoutComments
      .split(';')
      .map((statement) => statement.trim())
      .filter((statement) => statement.length > 0);

    for (const statement of statements) {
      await dbConnection.query(statement);
    }

    console.log('Schema SQL applique.');
  } else {
    console.log('Schema deja present, aucune modification appliquee.');
  }

  await dbConnection.end();

  pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 10,
  });
}

function getPool() {
  if (!pool) {
    throw new Error('DB pool not initialized. Call initDB() first.');
  }
  return pool;
}

module.exports = { initDB, getPool };
