const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getPool } = require('../db');

const router = express.Router();

const OLLAMA_URL = (process.env.OLLAMA_URL || 'http://localhost:11434').replace(/\/$/, '');
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:1b';

const DEFAULT_SUGGESTIONS = [
  'Quels produits sont en rupture de stock ?',
  'Quels produits sont en stock faible ?',
  'Quelle est la valeur totale du stock ?',
  'Montre-moi les mouvements récents'
];

function parseSuggestions() {
  const raw = process.env.ASSISTANT_SUGGESTIONS || '';
  const items = raw
    .split('|')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  return items.length > 0 ? items : DEFAULT_SUGGESTIONS;
}

function normalizeQuestion(message) {
  return String(message || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function detectIntent(message) {
  const q = normalizeQuestion(message);

  if (
    q.includes('rupture') ||
    q.includes('rupture de stock') ||
    q.includes('en rupture') ||
    q.includes('stock nul') ||
    q.includes('stock zero')
  ) {
    return 'rupture_stock';
  }

  if (
    q.includes('stock faible') ||
    q.includes('faible stock') ||
    q.includes('bientot en rupture') ||
    q.includes('reappro') ||
    q.includes('reapprovisionner')
  ) {
    return 'stock_faible';
  }

  if (
    q.includes('valeur du stock') ||
    q.includes('valeur totale') ||
    q.includes('combien vaut le stock') ||
    q.includes('cout total du stock')
  ) {
    return 'valeur_stock';
  }

  if (
    q.includes('mouvement') ||
    q.includes('mouvements') ||
    q.includes('historique')
  ) {
    return 'mouvements_recents';
  }

  if (
    q.includes('dashboard') ||
    q.includes('resume') ||
    q.includes('résumé') ||
    q.includes('situation du stock') ||
    q.includes('etat du stock') ||
    q.includes('état du stock')
  ) {
    return 'resume_general';
  }

  if (
    q.includes('comment') ||
    q.includes('ou cliquer') ||
    q.includes('où cliquer') ||
    q.includes('comment faire') ||
    q.includes('ajouter un produit') ||
    q.includes('ajouter un fournisseur') ||
    q.includes('creer un utilisateur') ||
    q.includes('créer un utilisateur') ||
    q.includes('faire une entree') ||
    q.includes('faire une entrée') ||
    q.includes('faire une sortie')
  ) {
    return 'aide_utilisation';
  }

  if (
    q.includes('combien') ||
    q.includes('quantite') ||
    q.includes('quantité') ||
    q.includes('stock de') ||
    q.includes('en stock') ||
    q.includes('disponible')
  ) {
    return 'produit_stock';
  }

  return 'general';
}

function extractProductSearchTerm(message) {
  const q = normalizeQuestion(message);

  const patterns = [
    /combien de (.+?) y a t il en stock/,
    /combien de (.+?) en stock/,
    /stock de (.+)/,
    /quantite de (.+)/,
    /quantite du produit (.+)/,
    /combien reste t il de (.+)/,
    /(.+?) est il en stock/,
    /(.+?) est il disponible/,
    /produit (.+)/
  ];

  for (const pattern of patterns) {
    const match = q.match(pattern);
    if (match && match[1]) {
      return match[1]
        .replace(/\b(le|la|les|du|de|des|un|une)\b/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
  }

  const cleaned = q
    .replace(/\b(combien|quantite|stock|produit|en|de|du|des|le|la|les|disponible|est|il|y|a|t)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned;
}

function buildFallbackResponse(intent, data) {
  switch (intent) {
    case 'rupture_stock': {
      const rows = data?.rows || [];
      if (!rows.length) {
        return "Aucun produit n'est actuellement en rupture de stock.";
      }

      const list = rows
        .map((item) => `- ${item.nom_produit} (stock: ${item.quantite_stock})`)
        .join('\n');

      return `Voici les produits actuellement en rupture de stock :\n${list}`;
    }

    case 'stock_faible': {
      const rows = data?.rows || [];
      if (!rows.length) {
        return "Aucun produit n'est actuellement en stock faible.";
      }

      const list = rows
        .map(
          (item) =>
            `- ${item.nom_produit} (stock: ${item.quantite_stock}, minimum: ${item.stock_minimum})`
        )
        .join('\n');

      return `Voici les produits à surveiller ou à réapprovisionner :\n${list}`;
    }

    case 'valeur_stock': {
      const value = Number(data?.valeurStock || 0);
      return `La valeur totale estimée du stock est de ${value.toFixed(2)}.`;
    }

    case 'mouvements_recents': {
      const rows = data?.rows || [];
      if (!rows.length) {
        return "Aucun mouvement de stock récent n'a été trouvé.";
      }

      const list = rows
        .map(
          (item) =>
            `- ${item.nom_produit} | ${item.type_mouvement} | quantité: ${item.quantite} | date: ${new Date(item.date_mouvement).toLocaleString('fr-FR')}`
        )
        .join('\n');

      return `Voici les mouvements récents :\n${list}`;
    }

    case 'resume_general': {
      return (
        `Résumé actuel du stock :\n` +
        `- Nombre total de produits : ${data.totalProduits}\n` +
        `- Valeur totale du stock : ${Number(data.valeurStock || 0).toFixed(2)}\n` +
        `- Produits en rupture : ${data.totalRupture}\n` +
        `- Produits en stock faible : ${data.totalStockFaible}`
      );
    }

    case 'aide_utilisation': {
      if (data?.aide) {
        return data.aide;
      }

      return (
        "Je peux vous guider dans GESTISTOCK. " +
        "Par exemple, dites-moi : 'comment ajouter un produit', 'comment ajouter un fournisseur' " +
        "ou 'comment enregistrer une entrée de stock'."
      );
    }

    case 'produit_stock': {
      const rows = data?.rows || [];

      if (!rows.length) {
        return "Je n'ai trouvé aucun produit correspondant dans le stock.";
      }

      if (rows.length === 1) {
        const item = rows[0];
        return `Le produit ${item.nom_produit} a actuellement ${item.quantite_stock} unité(s) en stock.`;
      }

      const list = rows
        .map((item) => `- ${item.nom_produit} : ${item.quantite_stock} unité(s)`)
        .join('\n');

      return `J'ai trouvé plusieurs produits correspondants :\n${list}`;
    }

    default:
      return (
        "Je peux vous aider sur les sujets liés à GESTISTOCK : stock, ruptures, réapprovisionnement, " +
        "mouvements, valeur du stock et utilisation de l'application."
      );
  }
}

async function callOllama(userQuestion, intent, data) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const systemPrompt =
      "Tu es l'assistant GESTISTOCK. " +
      "Réponds uniquement en français. " +
      "Tu dois toujours rédiger la réponse finale comme une vraie IA professionnelle. " +
      "Utilise uniquement les données métier fournies. " +
      "N'invente jamais aucune information. " +
      "Tu ne dois jamais contredire les données fournies. " +
      "Si une donnée manque, dis-le clairement. " +
      "Sois concise, claire, naturelle et utile. " +
      "Quand c'est pertinent, ajoute une courte recommandation métier. " +
      "Ne parle ni de JSON, ni d'API, ni de technique interne.";

    const userPrompt =
      `Question utilisateur : ${userQuestion}\n\n` +
      `Type de demande : ${intent}\n\n` +
      `Données métier validées :\n${JSON.stringify(data, null, 2)}\n\n` +
      `Consigne finale : rédige une réponse naturelle, professionnelle, fiable et courte à partir de ces seules données.`;

    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: false,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      })
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`Ollama error: ${details}`);
    }

    const result = await response.json();
    return result?.message?.content?.trim() || '';
  } finally {
    clearTimeout(timeout);
  }
}

async function getBusinessData(intent, message) {
  const pool = getPool();
  const normalizedMessage = normalizeQuestion(message);

  switch (intent) {
    case 'rupture_stock': {
      const [rows] = await pool.query(
        `
        SELECT nom_produit, quantite_stock
        FROM produit
        WHERE quantite_stock <= 0
        ORDER BY nom_produit ASC
        LIMIT 20
        `
      );

      return { rows };
    }

    case 'stock_faible': {
      const [rows] = await pool.query(
        `
        SELECT nom_produit, quantite_stock, stock_minimum
        FROM produit
        WHERE quantite_stock > 0
          AND quantite_stock <= stock_minimum
        ORDER BY (stock_minimum - quantite_stock) DESC, nom_produit ASC
        LIMIT 20
        `
      );

      return { rows };
    }

    case 'valeur_stock': {
      const [[row]] = await pool.query(
        `
        SELECT COALESCE(SUM(prix * quantite_stock), 0) AS valeurStock
        FROM produit
        `
      );

      return {
        valeurStock: Number(row?.valeurStock || 0)
      };
    }

    case 'mouvements_recents': {
      const [rows] = await pool.query(
        `
        SELECT
          m.type_mouvement,
          m.quantite,
          m.date_mouvement,
          p.nom_produit
        FROM mouvement_stock m
        INNER JOIN produit p ON p.id_produit = m.id_produit
        ORDER BY m.date_mouvement DESC
        LIMIT 10
        `
      );

      return { rows };
    }

    case 'resume_general': {
      const [[productsCount]] = await pool.query(
        `
        SELECT COUNT(*) AS totalProduits
        FROM produit
        `
      );

      const [[stockValue]] = await pool.query(
        `
        SELECT COALESCE(SUM(prix * quantite_stock), 0) AS valeurStock
        FROM produit
        `
      );

      const [[outOfStockCount]] = await pool.query(
        `
        SELECT COUNT(*) AS totalRupture
        FROM produit
        WHERE quantite_stock <= 0
        `
      );

      const [[lowStockCount]] = await pool.query(
        `
        SELECT COUNT(*) AS totalStockFaible
        FROM produit
        WHERE quantite_stock > 0
          AND quantite_stock <= stock_minimum
        `
      );

      return {
        totalProduits: Number(productsCount?.totalProduits || 0),
        valeurStock: Number(stockValue?.valeurStock || 0),
        totalRupture: Number(outOfStockCount?.totalRupture || 0),
        totalStockFaible: Number(lowStockCount?.totalStockFaible || 0)
      };
    }

    case 'aide_utilisation': {
      if (normalizedMessage.includes('fournisseur')) {
        return {
          aide:
            "Pour ajouter un fournisseur, allez dans le menu Fournisseurs, puis cliquez sur le bouton d'ajout. Remplissez le formulaire et validez."
        };
      }

      if (normalizedMessage.includes('produit')) {
        return {
          aide:
            "Pour ajouter un produit, allez dans Produits, cliquez sur le bouton d'ajout, renseignez les informations du produit puis enregistrez."
        };
      }

      if (normalizedMessage.includes('entree')) {
        return {
          aide:
            "Pour enregistrer une entrée de stock, ouvrez le module Entrées de stock, ajoutez les lignes nécessaires puis validez l'opération."
        };
      }

      if (normalizedMessage.includes('sortie')) {
        return {
          aide:
            "Pour enregistrer une sortie de stock, ouvrez le module Sorties de stock, sélectionnez les produits concernés, puis validez la sortie."
        };
      }

      if (normalizedMessage.includes('utilisateur')) {
        return {
          aide:
            "Pour gérer les utilisateurs, allez dans le module Utilisateurs. Vous pourrez créer, modifier, activer ou désactiver un compte selon vos droits."
        };
      }

      return {
        aide:
          "Je peux vous guider dans GESTISTOCK pour les produits, fournisseurs, utilisateurs, entrées et sorties de stock."
      };
    }

    case 'produit_stock': {
      const searchTerm = extractProductSearchTerm(message);

      if (!searchTerm) {
        return { rows: [] };
      }

      const [exactRows] = await pool.query(
        `
        SELECT nom_produit, quantite_stock, stock_minimum, prix
        FROM produit
        WHERE LOWER(nom_produit) = ?
        LIMIT 5
        `,
        [searchTerm]
      );

      if (exactRows.length > 0) {
        return { rows: exactRows };
      }

      const [rows] = await pool.query(
        `
        SELECT nom_produit, quantite_stock, stock_minimum, prix
        FROM produit
        WHERE LOWER(nom_produit) LIKE ?
        ORDER BY nom_produit ASC
        LIMIT 5
        `,
        [`%${searchTerm}%`]
      );

      return { rows };
    }

    case 'general':
    default: {
      const [rows] = await pool.query(
        `
        SELECT nom_produit, quantite_stock, stock_minimum, prix
        FROM produit
        ORDER BY nom_produit ASC
        LIMIT 5
        `
      );

      return {
        info:
          "Question générale sur GESTISTOCK. Répondre seulement si cela concerne le stock, les produits, les mouvements, le réapprovisionnement ou l'utilisation de l'application.",
        exemples: rows
      };
    }
  }
}

router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body || {};

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        ok: false,
        message: 'Message requis.'
      });
    }

    const intent = detectIntent(message);
    const data = await getBusinessData(intent, message);

    if (
      intent === 'produit_stock' ||
      intent === 'rupture_stock' ||
      intent === 'stock_faible' ||
      intent === 'valeur_stock' ||
      intent === 'mouvements_recents' ||
      intent === 'resume_general'
    ) {
      const fallbackMessage = buildFallbackResponse(intent, data);

      return res.json({
        ok: true,
        message: fallbackMessage,
        intent
      });
    }

    try {
      const llmMessage = await callOllama(message, intent, data);

      if (llmMessage) {
        return res.json({
          ok: true,
          message: llmMessage,
          intent
        });
      }
    } catch (llmError) {
      console.error('Ollama indisponible ou erreur LLM :', llmError.message);
    }

    const fallbackMessage = buildFallbackResponse(intent, data);

    return res.json({
      ok: true,
      message: fallbackMessage,
      intent
    });
  } catch (err) {
    console.error('Erreur assistant :', err.message);
    return res.status(500).json({
      ok: false,
      message: 'Erreur serveur.'
    });
  }
});

router.get('/suggestions', authenticateToken, (req, res) => {
  return res.json({
    ok: true,
    suggestions: parseSuggestions()
  });
});

router.get('/health', authenticateToken, async (req, res) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);

    const response = await fetch(`${OLLAMA_URL}/api/tags`, {
      method: 'GET',
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return res.json({ ok: false });
    }

    return res.json({ ok: true });
  } catch (err) {
    return res.json({ ok: false });
  }
});

module.exports = router;