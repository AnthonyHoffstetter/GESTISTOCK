const express = require('express');
const { getPool } = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const dbPool = getPool();

    const [rows] = await dbPool.query(`
      SELECT
        p.id_produit,
        p.reference,
        p.nom_produit,
        p.description,
        p.prix,
        p.quantite_stock,
        p.stock_minimum,
        p.id_categorie,
        c.nom_categorie
      FROM produit p
      INNER JOIN categorie c ON c.id_categorie = p.id_categorie
      ORDER BY p.id_produit DESC
    `);

    return res.json({
      ok: true,
      products: rows
    });
  } catch (err) {
    console.error('Erreur GET /products :', err.message);
    return res.status(500).json({
      ok: false,
      message: 'Erreur serveur lors du chargement des produits.'
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      reference,
      nom_produit,
      description,
      prix,
      quantite_stock,
      stock_minimum,
      id_categorie
    } = req.body || {};

    if (!reference || !nom_produit || prix === undefined || quantite_stock === undefined || stock_minimum === undefined || !id_categorie) {
      return res.status(400).json({
        ok: false,
        message: 'Tous les champs obligatoires doivent être remplis.'
      });
    }

    const dbPool = getPool();

    const [existing] = await dbPool.query(
      'SELECT id_produit FROM produit WHERE reference = ? LIMIT 1',
      [reference.trim()]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        ok: false,
        message: 'Cette référence existe déjà.'
      });
    }

    const [category] = await dbPool.query(
      'SELECT id_categorie FROM categorie WHERE id_categorie = ? LIMIT 1',
      [id_categorie]
    );

    if (category.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Catégorie introuvable.'
      });
    }

    const [result] = await dbPool.query(
      `
      INSERT INTO produit
      (reference, nom_produit, description, prix, quantite_stock, stock_minimum, id_categorie)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        reference.trim(),
        nom_produit.trim(),
        description?.trim() || null,
        Number(prix),
        Number(quantite_stock),
        Number(stock_minimum),
        Number(id_categorie)
      ]
    );

    return res.status(201).json({
      ok: true,
      message: 'Produit ajouté avec succès.',
      productId: result.insertId
    });
  } catch (err) {
    console.error('Erreur POST /products :', err.message);
    return res.status(500).json({
      ok: false,
      message: 'Erreur serveur lors de l’ajout du produit.'
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const dbPool = getPool();

    const [usedInMovement] = await dbPool.query(
      'SELECT id_mouvement FROM mouvement_stock WHERE id_produit = ? LIMIT 1',
      [id]
    );

    if (usedInMovement.length > 0) {
      return res.status(409).json({
        ok: false,
        message: 'Impossible de supprimer ce produit car il est lié à des mouvements.'
      });
    }

    const [usedInLines] = await dbPool.query(
      'SELECT id_ligne_bon FROM ligne_bon WHERE id_produit = ? LIMIT 1',
      [id]
    );

    if (usedInLines.length > 0) {
      return res.status(409).json({
        ok: false,
        message: 'Impossible de supprimer ce produit car il est lié à des bons.'
      });
    }

    const [result] = await dbPool.query(
      'DELETE FROM produit WHERE id_produit = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Produit introuvable.'
      });
    }

    return res.json({
      ok: true,
      message: 'Produit supprimé avec succès.'
    });
  } catch (err) {
    console.error('Erreur DELETE /products/:id :', err.message);
    return res.status(500).json({
      ok: false,
      message: 'Erreur serveur lors de la suppression du produit.'
    });
  }
});

module.exports = router;