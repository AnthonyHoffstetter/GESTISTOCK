const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ ok: false, message: 'Token manquant.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ ok: false, message: 'Token invalide.' });
  }
}

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    const role = req?.user?.role;

    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({ ok: false, message: 'Accès refusé.' });
    }

    return next();
  };
}

module.exports = { authenticateToken, authorizeRoles };
