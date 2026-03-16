const express = require('express');
const { getPool } = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const dbPool = getPool();

    const [rows] = await dbPool.query(`
      SELECT
        b.id_bon,
        b.reference,
        b.date_bon,
        b.statut,
        b.total,
        u.nom_complet,
        COUNT(l.id_ligne_bon) AS lignes,
        COALESCE(b.total, SUM(l.quantite * l.prix_unitaire), 0) AS total_calcule
      FROM bon b
      LEFT JOIN utilisateur u ON u.id_utilisateur = b.id_utilisateur
      LEFT JOIN ligne_bon l ON l.id_bon = b.id_bon
      WHERE b.type_bon = 'IN'
      GROUP BY b.id_bon, b.reference, b.date_bon, b.statut, b.total, u.nom_complet
      ORDER BY b.date_bon DESC
    `);

    return res.json({
      ok: true,
      entries: rows.map((row) => ({
        id_bon: row.id_bon,
        reference: row.reference,
        date_bon: row.date_bon,
        statut: row.statut,
        nom_complet: row.nom_complet,
        lignes: Number(row.lignes || 0),
        total: Number(row.total ?? row.total_calcule ?? 0)
      }))
    });
  } catch (err) {
    console.error('Erreur GET /stock-in :', err.message);
    return res.status(500).json({
      ok: false,
      message: 'Erreur serveur lors du chargement des entrées.'
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const dbPool = getPool();

    const [[bon]] = await dbPool.query(
      `
      SELECT
        b.id_bon,
        b.reference,
        b.date_bon,
        b.statut,
        b.total,
        u.nom_complet
      FROM bon b
      LEFT JOIN utilisateur u ON u.id_utilisateur = b.id_utilisateur
      WHERE b.id_bon = ? AND b.type_bon = 'IN'
      LIMIT 1
      `,
      [id]
    );

    if (!bon) {
      return res.status(404).json({
        ok: false,
        message: 'Bon introuvable.'
      });
    }

    const [lines] = await dbPool.query(
      `
      SELECT
        l.id_ligne_bon,
        l.quantite,
        l.prix_unitaire,
        (l.quantite * l.prix_unitaire) AS total_ligne,
        p.reference,
        p.nom_produit
      FROM ligne_bon l
      INNER JOIN produit p ON p.id_produit = l.id_produit
      WHERE l.id_bon = ?
      ORDER BY l.id_ligne_bon ASC
      `,
      [id]
    );

    const totalFromLines = lines.reduce((sum, line) => sum + Number(line.total_ligne || 0), 0);

    return res.json({
      ok: true,
      bon: {
        id_bon: bon.id_bon,
        reference: bon.reference,
        date_bon: bon.date_bon,
        statut: bon.statut,
        nom_complet: bon.nom_complet,
        total: Number(bon.total ?? totalFromLines ?? 0)
      },
      lines: lines.map((line) => ({
        id_ligne_bon: line.id_ligne_bon,
        reference: line.reference,
        nom_produit: line.nom_produit,
        quantite: Number(line.quantite || 0),
        prix_unitaire: Number(line.prix_unitaire || 0),
        total_ligne: Number(line.total_ligne || 0)
      }))
    });
  } catch (err) {
    console.error('Erreur GET /stock-in/:id :', err.message);
    return res.status(500).json({
      ok: false,
      message: 'Erreur serveur lors du chargement du bon.'
    });
  }
});

router.post('/', async (req, res) => {
  const dbPool = getPool();
  const connection = await dbPool.getConnection();

  try {
    const { id_utilisateur, lines } = req.body || {};

    if (!Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({
        ok: false,
        message: 'Lignes de produits requises.'
      });
    }

    const cleanStatut = 'Valide';

    await connection.beginTransaction();

    const [[lastBon]] = await connection.query(
      `
      SELECT reference
      FROM bon
      WHERE reference LIKE 'ENT-%'
      ORDER BY id_bon DESC
      LIMIT 1
      `
    );

    const nextNumber = lastBon?.reference
      ? Number(String(lastBon.reference).replace('ENT-', '')) + 1
      : 1;
    const cleanReference = `ENT-${String(nextNumber).padStart(3, '0')}`;

    let userId = Number(id_utilisateur);
    if (!userId) {
      const [[user]] = await connection.query(
        'SELECT id_utilisateur FROM utilisateur WHERE statut = TRUE ORDER BY id_utilisateur ASC LIMIT 1'
      );
      if (!user) {
        await connection.rollback();
        return res.status(400).json({
          ok: false,
          message: 'Aucun utilisateur actif disponible.'
        });
      }
      userId = user.id_utilisateur;
    }

    const normalizedLines = lines
      .map((line) => ({
        id_produit: Number(line.id_produit),
        quantite: Number(line.quantite)
      }))
      .filter((line) => Number.isFinite(line.id_produit) && line.id_produit > 0);

    if (normalizedLines.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        ok: false,
        message: 'Aucune ligne de produit valide.'
      });
    }

    for (const line of normalizedLines) {
      if (!Number.isFinite(line.quantite) || line.quantite <= 0) {
        await connection.rollback();
        return res.status(400).json({
          ok: false,
          message: 'Quantite invalide.'
        });
      }
    }

    let total = 0;

    const [bonResult] = await connection.query(
      `
      INSERT INTO bon (reference, date_bon, type_bon, statut, total, id_utilisateur)
      VALUES (?, NOW(), 'IN', ?, ?, ?)
      `,
      [cleanReference, cleanStatut, total, userId]
    );

    const bonId = bonResult.insertId;

    for (const line of normalizedLines) {
      const [productRows] = await connection.query(
        'SELECT id_produit, prix FROM produit WHERE id_produit = ? LIMIT 1',
        [line.id_produit]
      );

      if (productRows.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          ok: false,
          message: 'Produit introuvable.'
        });
      }

      const unitPrice = Number(productRows[0].prix || 0);
      total += line.quantite * unitPrice;

      await connection.query(
        `
        INSERT INTO ligne_bon (quantite, prix_unitaire, id_bon, id_produit)
        VALUES (?, ?, ?, ?)
        `,
        [line.quantite, unitPrice, bonId, line.id_produit]
      );

      await connection.query(
        'UPDATE produit SET quantite_stock = quantite_stock + ? WHERE id_produit = ?',
        [line.quantite, line.id_produit]
      );

      await connection.query(
        `
        INSERT INTO mouvement_stock (type_mouvement, quantite, date_mouvement, motif, id_produit, id_utilisateur)
        VALUES ('IN', ?, NOW(), ?, ?, ?)
        `,
        [line.quantite, `Entree bon ${cleanReference}`, line.id_produit, userId]
      );
    }

    await connection.query('UPDATE bon SET total = ? WHERE id_bon = ?', [total, bonId]);

    await connection.commit();

    return res.status(201).json({
      ok: true,
      message: 'Bon d entree enregistre.',
      id_bon: bonId,
      reference: cleanReference
    });
  } catch (err) {
    await connection.rollback();
    console.error('Erreur POST /stock-in :', err.message);
    return res.status(500).json({
      ok: false,
      message: 'Erreur serveur lors de la creation du bon.'
    });
  } finally {
    connection.release();
  }
});

router.post('/:id/cancel', async (req, res) => {
  const dbPool = getPool();
  const connection = await dbPool.getConnection();

  try {
    const { id } = req.params;

    await connection.beginTransaction();

    const [[bon]] = await connection.query(
      `
      SELECT id_bon, reference, statut, id_utilisateur
      FROM bon
      WHERE id_bon = ? AND type_bon = 'IN'
      LIMIT 1
      `,
      [id]
    );

    if (!bon) {
      await connection.rollback();
      return res.status(404).json({ ok: false, message: 'Bon introuvable.' });
    }

    if (bon.statut === 'Annule') {
      await connection.rollback();
      return res.status(409).json({ ok: false, message: 'Ce bon est deja annule.' });
    }

    const [lines] = await connection.query(
      `
      SELECT id_produit, quantite
      FROM ligne_bon
      WHERE id_bon = ?
      `,
      [bon.id_bon]
    );

    for (const line of lines) {
      const [[product]] = await connection.query(
        'SELECT quantite_stock FROM produit WHERE id_produit = ? LIMIT 1',
        [line.id_produit]
      );

      if (!product || Number(product.quantite_stock) < Number(line.quantite)) {
        await connection.rollback();
        return res.status(409).json({
          ok: false,
          message: 'Annulation impossible: stock insuffisant.'
        });
      }
    }

    await connection.query('UPDATE bon SET statut = ? WHERE id_bon = ?', ['Annule', bon.id_bon]);

    for (const line of lines) {
      await connection.query(
        'UPDATE produit SET quantite_stock = quantite_stock - ? WHERE id_produit = ?',
        [line.quantite, line.id_produit]
      );

      await connection.query(
        `
        INSERT INTO mouvement_stock (type_mouvement, quantite, date_mouvement, motif, id_produit, id_utilisateur)
        VALUES ('OUT', ?, NOW(), ?, ?, ?)
        `,
        [line.quantite, `Annulation bon ${bon.reference}`, line.id_produit, bon.id_utilisateur]
      );
    }

    await connection.commit();

    return res.json({ ok: true, message: 'Bon annule avec succes.' });
  } catch (err) {
    await connection.rollback();
    console.error('Erreur POST /stock-in/:id/cancel :', err.message);
    return res.status(500).json({
      ok: false,
      message: 'Erreur serveur lors de l annulation du bon.'
    });
  } finally {
    connection.release();
  }
});

module.exports = router;
