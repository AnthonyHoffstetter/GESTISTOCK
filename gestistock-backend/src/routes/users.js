const express = require('express');
const { getPool } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const dbPool = getPool();
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

module.exports = router;
