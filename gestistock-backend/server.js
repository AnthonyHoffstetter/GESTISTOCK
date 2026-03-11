const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Connexion MySQL et création de la BDD si elle n'existe pas
async function initDB() {
  // Connexion sans spécifier la BDD pour pouvoir la créer
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
  console.log(`✅ Base de données "${process.env.DB_NAME}" prête`);
  await connection.end();
}

// Route de test
app.get('/', (req, res) => {
  res.json({ message: 'GESTISTOCK Backend en ligne', status: 'OK' });
});

// Démarrage
const PORT = process.env.PORT || 3000;

initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Serveur démarré sur http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Erreur de connexion MySQL :', err.message);
    console.error('Vérifie que MySQL est bien démarré sur ton PC');
    process.exit(1);
  });
