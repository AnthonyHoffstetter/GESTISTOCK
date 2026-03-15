const express = require('express');
const { getPool } = require('../db');


const router = express.Router();

router.get('/stats',  async (req, res) => {
  try {
    const dbPool = getPool();

    const [[productsCount]] = await dbPool.query(
      'SELECT COUNT(*) AS totalProduits FROM produit'
    );

    const [[lowStockCount]] = await dbPool.query(
      'SELECT COUNT(*) AS totalStockFaible FROM produit WHERE quantite_stock <= stock_minimum'
    );

    const [[stockValue]] = await dbPool.query(
      'SELECT COALESCE(SUM(prix * quantite_stock), 0) AS valeurStock FROM produit'
    );

    const [[monthlyMovements]] = await dbPool.query(`
      SELECT COUNT(*) AS totalMouvementsMois
      FROM mouvement_stock
      WHERE MONTH(date_mouvement) = MONTH(CURRENT_DATE())
        AND YEAR(date_mouvement) = YEAR(CURRENT_DATE())
    `);

    const [recentMovements] = await dbPool.query(`
      SELECT 
        m.id_mouvement,
        m.type_mouvement,
        m.quantite,
        m.date_mouvement,
        p.nom_produit,
        u.nom_complet
      FROM mouvement_stock m
      INNER JOIN produit p ON p.id_produit = m.id_produit
      INNER JOIN utilisateur u ON u.id_utilisateur = m.id_utilisateur
      ORDER BY m.date_mouvement DESC
      LIMIT 5
    `);

    const [lowStockProducts] = await dbPool.query(`
      SELECT 
        id_produit,
        nom_produit,
        quantite_stock,
        stock_minimum
      FROM produit
      WHERE quantite_stock <= stock_minimum
      ORDER BY quantite_stock ASC
      LIMIT 5
    `);

    const [categoryDistribution] = await dbPool.query(`
      SELECT 
        c.nom_categorie,
        COUNT(p.id_produit) AS total
      FROM categorie c
      LEFT JOIN produit p ON p.id_categorie = c.id_categorie
      GROUP BY c.id_categorie, c.nom_categorie
      ORDER BY total DESC
    `);

    return res.json({
      ok: true,
      stats: {
        totalProduits: productsCount.totalProduits,
        totalStockFaible: lowStockCount.totalStockFaible,
        valeurStock: Number(stockValue.valeurStock || 0),
        totalMouvementsMois: monthlyMovements.totalMouvementsMois
      },
      recentMovements,
      lowStockProducts,
      categoryDistribution
    });
  } catch (err) {
    console.error('Erreur dashboard/stats :', err.message);
    return res.status(500).json({
      ok: false,
      message: 'Erreur serveur dashboard.'
    });
  }
});

module.exports = router;