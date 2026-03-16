const express = require('express');
const { getPool } = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const dbPool = getPool();

    const [rows] = await dbPool.query(`
      SELECT id_fournisseur, nom_complet, email, telephone, adresse, notes
      FROM fournisseur
      ORDER BY id_fournisseur DESC
    `);

    return res.json({
      ok: true,
      fournisseurs: rows
    });
  } catch (err) {
    console.error('Erreur GET /fournisseurs :', err.message);
    return res.status(500).json({
      ok: false,
      message: 'Erreur serveur lors du chargement des fournisseurs.'
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const { nom_complet, email, telephone, adresse, notes } = req.body || {};

    if (!nom_complet || !nom_complet.trim()) {
      return res.status(400).json({
        ok: false,
        message: 'Le nom du fournisseur est obligatoire.'
      });
    }

    const dbPool = getPool();

    const [result] = await dbPool.query(
      `
      INSERT INTO fournisseur (nom_complet, email, telephone, adresse, notes)
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        nom_complet.trim(),
        email?.trim() || null,
        telephone?.trim() || null,
        adresse?.trim() || null,
        notes?.trim() || null
      ]
    );

    return res.status(201).json({
      ok: true,
      message: 'Fournisseur ajouté avec succès.',
      fournisseur: {
        id_fournisseur: result.insertId,
        nom_complet: nom_complet.trim(),
        email: email?.trim() || null,
        telephone: telephone?.trim() || null,
        adresse: adresse?.trim() || null,
        notes: notes?.trim() || null
      }
    });
  } catch (err) {
    console.error('Erreur POST /fournisseurs :', err.message);
    return res.status(500).json({
      ok: false,
      message: 'Erreur serveur lors de l’ajout du fournisseur.'
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const dbPool = getPool();

    const [used] = await dbPool.query(
      'SELECT id_bon FROM bon WHERE id_fournisseur = ? LIMIT 1',
      [id]
    );

    if (used.length > 0) {
      return res.status(409).json({
        ok: false,
        message: 'Impossible de supprimer ce fournisseur car il est lié à des bons.'
      });
    }

    const [result] = await dbPool.query(
      'DELETE FROM fournisseur WHERE id_fournisseur = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Fournisseur introuvable.'
      });
    }

    return res.json({
      ok: true,
      message: 'Fournisseur supprimé avec succès.'
    });
  } catch (err) {
    console.error('Erreur DELETE /fournisseurs/:id :', err.message);
    return res.status(500).json({
      ok: false,
      message: 'Erreur serveur lors de la suppression du fournisseur.'
    });
  }
});

module.exports = router;