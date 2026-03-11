# GESTISTOCK Backend

## Prérequis
- Node.js installé (https://nodejs.org)
- MySQL démarré

## Installation et lancement

```bash
# 1. Installer les dépendances
npm install

# 2. Lancer le serveur
node server.js
```

Le serveur démarre sur **http://localhost:3000**  
La base de données `gestistock_db` est créée automatiquement au démarrage.

## Configuration
Les paramètres de connexion sont dans le fichier `.env` :
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=gestistock_db
PORT=3000
```
