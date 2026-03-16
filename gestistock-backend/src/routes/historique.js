const express = require('express');
const { getPool } = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const dbPool = getPool();
    const { type, search } = req.query;

    let sql = `
      SELECT
        m.id_mouvement,
        m.type_mouvement,
        m.quantite,
        m.date_mouvement,
        m.motif,
        p.reference,
        p.nom_produit,
        u.nom_complet
      FROM mouvement_stock m
      INNER JOIN produit p ON p.id_produit = m.id_produit
      INNER JOIN utilisateur u ON u.id_utilisateur = m.id_utilisateur
      WHERE 1 = 1
    `;

    const params = [];

    if (type && type !== 'ALL') {
      sql += ` AND m.type_mouvement = ? `;
      params.push(type);
    }

    if (search && search.trim()) {
      sql += ` AND (p.nom_produit LIKE ? OR p.reference LIKE ? OR u.nom_complet LIKE ?) `;
      const keyword = `%${search.trim()}%`;
      params.push(keyword, keyword, keyword);
    }

    sql += ` ORDER BY m.date_mouvement DESC `;

    const [rows] = await dbPool.query(sql, params);

    return res.json({
      ok: true,
      historiques: rows
    });
  } catch (err) {
    console.error('Erreur GET /historique :', err.message);
    return res.status(500).json({
      ok: false,
      message: 'Erreur serveur lors du chargement de l’historique.'
    });
  }
});

module.exports = router;