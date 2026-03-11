const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

let dbPool;

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

  dbPool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 10,
  });
}

// Route de test
app.get('/', (req, res) => {
  res.json({ message: 'GESTISTOCK Backend en ligne', status: 'OK' });
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ ok: false, message: 'Token manquant.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ ok: false, message: 'Token invalide.' });
  }
}

// Authentification
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ ok: false, message: 'Email et mot de passe requis.' });
    }

    const [rows] = await dbPool.query(
      'SELECT id_utilisateur, nom_complet, email, role, statut, mot_de_passe FROM utilisateur WHERE email = ? LIMIT 1',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ ok: false, message: 'Identifiants invalides.' });
    }

    const user = rows[0];

    if (!user.statut) {
      return res.status(403).json({ ok: false, message: 'Compte desactive.' });
    }

    let isValid = false;

    if (typeof user.mot_de_passe === 'string' && user.mot_de_passe.startsWith('$2')) {
      isValid = await bcrypt.compare(password, user.mot_de_passe);
    } else {
      isValid = user.mot_de_passe === password;
    }

    if (!isValid) {
      return res.status(401).json({ ok: false, message: 'Identifiants invalides.' });
    }

    if (!user.mot_de_passe.startsWith('$2')) {
      const hashed = await bcrypt.hash(password, 10);
      await dbPool.query('UPDATE utilisateur SET mot_de_passe = ? WHERE id_utilisateur = ?', [
        hashed,
        user.id_utilisateur
      ]);
    }

    const token = jwt.sign(
      { id: user.id_utilisateur, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    return res.json({
      ok: true,
      token,
      user: {
        id_utilisateur: user.id_utilisateur,
        nom_complet: user.nom_complet,
        email: user.email,
        role: user.role,
        statut: user.statut,
      },
    });
  } catch (err) {
    console.error('Erreur login :', err.message);
    return res.status(500).json({ ok: false, message: 'Erreur serveur.' });
  }
});

// Exemple de route protegee
app.get('/me', authenticateToken, async (req, res) => {
  try {
    const [rows] = await dbPool.query(
      'SELECT id_utilisateur, nom_complet, email, role, statut FROM utilisateur WHERE id_utilisateur = ? LIMIT 1',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ ok: false, message: 'Utilisateur introuvable.' });
    }

    return res.json({ ok: true, user: rows[0] });
  } catch (err) {
    console.error('Erreur /me :', err.message);
    return res.status(500).json({ ok: false, message: 'Erreur serveur.' });
  }
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
