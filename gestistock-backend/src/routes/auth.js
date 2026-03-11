const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getPool } = require('../db');

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ ok: false, message: 'Email et mot de passe requis.' });
    }

    const dbPool = getPool();
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

    const isValid = await bcrypt.compare(password, user.mot_de_passe);

    if (!isValid) {
      return res.status(401).json({ ok: false, message: 'Identifiants invalides.' });
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

module.exports = router;
