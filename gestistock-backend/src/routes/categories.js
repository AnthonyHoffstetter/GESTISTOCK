const express = require('express');
const { getPool } = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const dbPool = getPool();
    const [rows] = await dbPool.query(`
      SELECT id_categorie, nom_categorie
      FROM categorie
      ORDER BY nom_categorie ASC
    `);

    return res.json({
      ok: true,
      categories: rows
    });
  } catch (err) {
    console.error('Erreur GET /categories :', err.message);
    return res.status(500).json({
      ok: false,
      message: 'Erreur serveur lors du chargement des catégories.'
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const { nom_categorie } = req.body || {};

    if (!nom_categorie || !nom_categorie.trim()) {
      return res.status(400).json({
        ok: false,
        message: 'Le nom de la catégorie est requis.'
      });
    }

    const dbPool = getPool();
    const nom = nom_categorie.trim();

    const [existing] = await dbPool.query(
      'SELECT id_categorie FROM categorie WHERE nom_categorie = ? LIMIT 1',
      [nom]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        ok: false,
        message: 'Cette catégorie existe déjà.'
      });
    }

    const [result] = await dbPool.query(
      'INSERT INTO categorie (nom_categorie) VALUES (?)',
      [nom]
    );

    return res.status(201).json({
      ok: true,
      message: 'Catégorie ajoutée avec succès.',
      category: {
        id_categorie: result.insertId,
        nom_categorie: nom
      }
    });
  } catch (err) {
    console.error('Erreur POST /categories :', err.message);
    return res.status(500).json({
      ok: false,
      message: 'Erreur serveur lors de l’ajout de la catégorie.'
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const dbPool = getPool();

    const [used] = await dbPool.query(
      'SELECT id_produit FROM produit WHERE id_categorie = ? LIMIT 1',
      [id]
    );

    if (used.length > 0) {
      return res.status(409).json({
        ok: false,
        message: 'Impossible de supprimer cette catégorie car elle est liée à des produits.'
      });
    }

    const [result] = await dbPool.query(
      'DELETE FROM categorie WHERE id_categorie = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Catégorie introuvable.'
      });
    }

    return res.json({
      ok: true,
      message: 'Catégorie supprimée avec succès.'
    });
  } catch (err) {
    console.error('Erreur DELETE /categories/:id :', err.message);
    return res.status(500).json({
      ok: false,
      message: 'Erreur serveur lors de la suppression.'
    });
  }
});

module.exports = router;