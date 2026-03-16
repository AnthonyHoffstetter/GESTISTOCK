# 📦 GESTISTOCK — Système de Gestion de Stock Intelligent

**GESTISTOCK** est une solution logicielle Full-Stack conçue pour la gestion et l'optimisation des inventaires dans le secteur de la construction. L'application permet le suivi en temps réel des produits, des fournisseurs et des mouvements de stock, tout en intégrant un module d'analyse prédictive via IA.

---

## 🛠️ Architecture Technique

| Composant | Technologie | Version |
| :--- | :--- | :--- |
| **Frontend** | Angular (Teal Design System) | 17+ |
| **Backend** | Node.js / Express | 20+ LTS |
| **Base de données** | MySQL | 8.0 |
| **Sécurité** | JWT | — |

---

## 📂 Structure du Projet

```text
GESTISTOCK/
├── gestistock-backend/      # API REST Node.js/Express (Port 3000)
├── gestistock-frontend/     # Interface Utilisateur Angular (Port 4200)
├── .gitignore               # Configuration globale des exclusions Git
└── README.md                # Documentation principale du projet
```

---

## 🏁 Guide de Lancement Rapide

### 1. Prérequis

Assurez-vous d'avoir installé :

- **MySQL** (via WAMP, XAMPP ou installation directe)
- **Node.js** (version LTS recommandée) — [https://nodejs.org](https://nodejs.org)
- **Ollama** (pour le module IA)

---

### 2. Configuration de la Base de Données

1. Lancez votre serveur MySQL.
2. La base de données `gestistock_db` est **créée automatiquement** au démarrage du backend, aucune manipulation manuelle n'est nécessaire.

---

### 3. Lancement du Backend (API)

1. Ouvrez un terminal dans le dossier `gestistock-backend`.
2. Installez les dépendances *(uniquement lors du premier lancement)* :

```bash
npm install
```

3. Lancez le serveur :

```bash
node server.js
```

✅ Serveur actif sur : [http://localhost:3000](http://localhost:3000)

---

### 4. Installation et démarrage d'Ollama (IA)

1. Installez Ollama :
```bash
irm https://ollama.com/install.ps1 | iex
```
2. Lancez le service Ollama :

```bash
ollama serve
```

3. Téléchargez le modèle utilisé par l'application :

```bash
ollama pull llama3.2:1b
```

✅ Ollama écoute par défaut sur : `http://localhost:11434`

---

### 5. Lancement du Frontend (Angular)

1. Ouvrez un terminal dans le dossier `gestistock-frontend`.
2. Installez les dépendances *(uniquement lors du premier lancement)* :

```bash
npm install
```

3. Démarrez le serveur de développement :

```bash
npm start
```

✅ Interface accessible sur : [http://localhost:4200](http://localhost:4200)

---

## Compte de démonstration

Vous pouvez vous connecter avec :
- Email : `admin@demo.local`
- Mot de passe : `admin123`
