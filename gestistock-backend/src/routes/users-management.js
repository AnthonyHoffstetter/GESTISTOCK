const express = require('express');
const bcrypt = require('bcryptjs');
const { getPool } = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken, authorizeRoles('Admin'));

router.get('/', async (req, res) => {
  try {
    const dbPool = getPool();

    const [rows] = await dbPool.query(`
      SELECT
        id_utilisateur,
        nom_complet,
        email,
        role,
        statut
      FROM utilisateur
      ORDER BY id_utilisateur DESC
    `);

    return res.json({
      ok: true,
      utilisateurs: rows
    });
  } catch (err) {
    console.error('Erreur GET /utilisateurs :', err.message);
    return res.status(500).json({
      ok: false,
      message: 'Erreur serveur lors du chargement des utilisateurs.'
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      nom_complet,
      email,
      mot_de_passe,
      role,
      statut
    } = req.body || {};

    if (!nom_complet || !email || !mot_de_passe || !role) {
      return res.status(400).json({
        ok: false,
        message: 'Tous les champs obligatoires doivent être remplis.'
      });
    }

    if (!['Admin', 'Mag'].includes(role)) {
      return res.status(400).json({
        ok: false,
        message: 'Rôle invalide.'
      });
    }

    const dbPool = getPool();

    const [existing] = await dbPool.query(
      'SELECT id_utilisateur FROM utilisateur WHERE email = ? LIMIT 1',
      [email.trim()]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        ok: false,
        message: 'Cet email existe déjà.'
      });
    }

    const hashedPassword = await bcrypt.hash(mot_de_passe.trim(), 10);

    const [result] = await dbPool.query(
      `
      INSERT INTO utilisateur (nom_complet, email, mot_de_passe, role, statut)
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        nom_complet.trim(),
        email.trim(),
        hashedPassword,
        role,
        statut === false ? false : true
      ]
    );

    return res.status(201).json({
      ok: true,
      message: 'Utilisateur ajouté avec succès.',
      utilisateur: {
        id_utilisateur: result.insertId,
        nom_complet: nom_complet.trim(),
        email: email.trim(),
        role,
        statut: statut === false ? false : true
      }
    });
  } catch (err) {
    console.error('Erreur POST /utilisateurs :', err.message);
    return res.status(500).json({
      ok: false,
      message: 'Erreur serveur lors de l’ajout de l’utilisateur.'
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const dbPool = getPool();

    const [result] = await dbPool.query(
      'DELETE FROM utilisateur WHERE id_utilisateur = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Utilisateur introuvable.'
      });
    }

    return res.json({
      ok: true,
      message: 'Utilisateur supprimé avec succès.'
    });
  } catch (err) {
    console.error('Erreur DELETE /utilisateurs/:id :', err.message);
    return res.status(500).json({
      ok: false,
      message: 'Erreur serveur lors de la suppression.'
    });
  }
});

router.put('/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body || {};

    if (!role || !['Admin', 'Mag'].includes(role)) {
      return res.status(400).json({
        ok: false,
        message: 'Rôle invalide.'
      });
    }

    const dbPool = getPool();

    const [result] = await dbPool.query(
      'UPDATE utilisateur SET role = ? WHERE id_utilisateur = ?',
      [role, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Utilisateur introuvable.'
      });
    }

    return res.json({
      ok: true,
      message: 'Rôle mis à jour avec succès.'
    });
  } catch (err) {
    console.error('Erreur PUT /utilisateurs/:id/role :', err.message);
    return res.status(500).json({
      ok: false,
      message: 'Erreur serveur lors de la mise à jour du rôle.'
    });
  }
});

router.put('/:id/statut', async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body || {};

    const dbPool = getPool();

    const [result] = await dbPool.query(
      'UPDATE utilisateur SET statut = ? WHERE id_utilisateur = ?',
      [statut ? true : false, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Utilisateur introuvable.'
      });
    }

    return res.json({
      ok: true,
      message: 'Statut mis à jour avec succès.'
    });
  } catch (err) {
    console.error('Erreur PUT /utilisateurs/:id/statut :', err.message);
    return res.status(500).json({
      ok: false,
      message: 'Erreur serveur lors de la mise à jour du statut.'
    });
  }
});

router.get('/debug-users', async (req, res) => {
  try {
    const dbPool = getPool();

    const [rows] = await dbPool.query(`
      SELECT id_utilisateur, nom_complet, email, role, statut, mot_de_passe
      FROM utilisateur
      ORDER BY id_utilisateur DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur debug' });
  }
});
module.exports = router;
