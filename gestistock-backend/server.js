require('dotenv').config();

const app = require('./src/app');
const { initDB } = require('./src/db');

const PORT = process.env.PORT || 3000;

initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Serveur demarre sur http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Erreur de connexion MySQL :', err.message);
    console.error('Verifie que MySQL est bien demarre sur ton PC');
    process.exit(1);
  });