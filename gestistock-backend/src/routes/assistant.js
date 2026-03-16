const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getPool } = require('../db');

const router = express.Router();

const OLLAMA_URL = (process.env.OLLAMA_URL || 'http://localhost:11434').replace(/\/$/, '');
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:1b';
const OLLAMA_SYSTEM =
  process.env.OLLAMA_SYSTEM ||
  "Tu es l'assistant GESTISTOCK. Aide l'utilisateur a analyser le stock et reponds clairement en francais.";
const POLICY_SYSTEM =
  "Regles strictes: repond uniquement aux questions liees a la gestion des stocks dans GESTISTOCK. " +
  "Ne fournis pas d'informations hors perimetre, ne mentionne pas des donnees qui ne sont pas dans le contexte fourni, " +
  "ne divulgue pas de noms d'utilisateurs ou d'informations personnelles. " +
  "N'utilise jamais le mot JSON ou donnees techniques. " +
  "Si une demande est hors perimetre ou manque de donnees, dis-le clairement et demande une precision. " +
  "Toutes les requetes doivent etre traitees par l'IA a partir du contexte fourni.";
const DEFAULT_SUGGESTIONS = [
  'Produits en rupture de stock ?',
  'Valeur totale du stock ?',
  'Résumé des mouvements',
  'Produits à réapprovisionner ?'
];

function parseSuggestions() {
  const raw = process.env.ASSISTANT_SUGGESTIONS || '';
  const items = raw
    .split('|')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  return items.length > 0 ? items : DEFAULT_SUGGESTIONS;
}

const PRODUCT_CONTEXT_LIMIT = Number(process.env.ASSISTANT_PRODUCT_LIMIT || 200);

function normalizeQuestion(message) {
  return String(message || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function needsMovementsContext(q) {
  return q.includes('mouvement') || q.includes('mouvements') || q.includes('historique');
}

router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { message, history } = req.body || {};

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ ok: false, message: 'Message requis.' });
    }

    const messages = [];
    if (OLLAMA_SYSTEM) {
      messages.push({ role: 'system', content: OLLAMA_SYSTEM });
    }
    messages.push({ role: 'system', content: POLICY_SYSTEM });

    const dbPool = getPool();
    const question = normalizeQuestion(message);
    let stockContext = null;
    try {
      const [[productsCount]] = await dbPool.query(
        'SELECT COUNT(*) AS totalProduits FROM produit'
      );

      const [products] = await dbPool.query(
        `
        SELECT nom_produit, quantite_stock, stock_minimum, prix
        FROM produit
        ORDER BY nom_produit ASC
        LIMIT ?
        `,
        [PRODUCT_CONTEXT_LIMIT]
      );

      const [[stockValue]] = await dbPool.query(
        'SELECT COALESCE(SUM(prix * quantite_stock), 0) AS valeurStock FROM produit'
      );

      const [[outOfStockCount]] = await dbPool.query(
        'SELECT COUNT(*) AS totalRupture FROM produit WHERE quantite_stock <= 0'
      );

      const [[lowStockCount]] = await dbPool.query(
        'SELECT COUNT(*) AS totalStockFaible FROM produit WHERE quantite_stock <= stock_minimum'
      );

      let recentMovements = [];
      if (needsMovementsContext(question)) {
        const [rows] = await dbPool.query(`
          SELECT 
            m.type_mouvement,
            m.quantite,
            m.date_mouvement,
            p.nom_produit
          FROM mouvement_stock m
          INNER JOIN produit p ON p.id_produit = m.id_produit
          ORDER BY m.date_mouvement DESC
          LIMIT 10
        `);
        recentMovements = rows;
      }

      stockContext = {
        totalProduits: Number(productsCount.totalProduits || 0),
        produits: products,
        resume: {
          valeurStock: Number(stockValue.valeurStock || 0),
          totalRupture: Number(outOfStockCount.totalRupture || 0),
          totalStockFaible: Number(lowStockCount.totalStockFaible || 0)
        },
        mouvementsRecents: recentMovements
      };
    } catch (err) {
      console.error('Erreur collecte contexte stock :', err.message);
    }

    if (stockContext) {
      const movementsText =
        stockContext.mouvementsRecents && stockContext.mouvementsRecents.length > 0
          ? ". Mouvements recents: " +
            stockContext.mouvementsRecents
              .map((m) => `${m.nom_produit} ${m.type_mouvement} ${m.quantite}`)
              .join(' | ')
          : '';

      messages.push({
        role: 'system',
        content:
          "Contexte stock pour repondre de facon precise. " +
          "Important: pour les ruptures, utilise uniquement les stocks actuels des produits, pas les mouvements. " +
          "Total produits=" +
          stockContext.totalProduits +
          ", valeur stock=" +
          stockContext.resume.valeurStock +
          ", ruptures=" +
          stockContext.resume.totalRupture +
          ", stock faible=" +
          stockContext.resume.totalStockFaible +
          ". Liste des produits (limitee): " +
          stockContext.produits
            .map(
              (p) =>
                `${p.nom_produit} | stock=${p.quantite_stock} | min=${p.stock_minimum} | prix=${p.prix}`
            )
            .join(' ; ') +
          movementsText
      });
    }

    if (Array.isArray(history)) {
      const safeHistory = history
        .filter((item) => item && typeof item.content === 'string' && typeof item.role === 'string')
        .slice(-10);
      messages.push(...safeHistory);
    }

    messages.push({ role: 'user', content: message });

    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages,
        stream: false,
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      return res.status(502).json({
        ok: false,
        message: "Erreur lors de l'appel a Ollama.",
        details,
      });
    }

    const data = await response.json();
    const content = data?.message?.content || '';

    return res.json({ ok: true, message: content });
  } catch (err) {
    console.error('Erreur assistant :', err.message);
    return res.status(500).json({ ok: false, message: 'Erreur serveur.' });
  }
});

router.get('/suggestions', authenticateToken, (req, res) => {
  return res.json({ ok: true, suggestions: parseSuggestions() });
});

module.exports = router;
