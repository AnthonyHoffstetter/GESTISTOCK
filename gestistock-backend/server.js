const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Connexion MySQL et creation de la BDD si elle n'existe pas
async function initDB() {
  // Connexion sans specifier la BDD pour pouvoir la creer
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
  console.log(`Base de donnees "${process.env.DB_NAME}" prete`);
  await connection.end();

  const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
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
}

// Route de test
app.get('/', (req, res) => {
  res.json({ message: 'GESTISTOCK Backend en ligne', status: 'OK' });
});

// Demarrage
const PORT = process.env.PORT || 3000;

initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Serveur demarre sur http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Erreur de connexion MySQL :', err.message);
    console.error('Verifie que MySQL est bien demarre sur ton PC');
    process.exit(1);
  });
