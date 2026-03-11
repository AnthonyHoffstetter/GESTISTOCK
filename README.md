# 📦 GESTISTOCK — Système de Gestion de Stock Intelligent

**GESTISTOCK** est une solution logicielle Full-Stack conçue pour la gestion et l'optimisation des inventaires dans le secteur de la construction. L'application permet le suivi en temps réel des produits, des fournisseurs et des mouvements de stock, tout en intégrant un module d'analyse prédictive via IA.

---

## 🛠️ Architecture Technique

| Composant | Technologie | Version |
| :--- | :--- | :--- |
| **Frontend** | Angular (Teal Design System) | 17+ |
| **Backend** | Spring Boot / Java | 3.4 / 21 |
| **Base de données** | MySQL | 8.0 |
| **Sécurité** | Spring Security & JWT | — |

---

## 📂 Structure du Projet

```text
GESTISTOCK/
├── gestistock-backend/      # API REST Spring Boot (Port 8080)
├── gestistock-frontend/     # Interface Utilisateur Angular (Port 4200)
├── .gitignore               # Configuration globale des exclusions Git
└── README.md                # Documentation principale du projet
```

---

## 🏁 Guide de Lancement Rapide

### 1. Prérequis

Assurez-vous d'avoir installé :

- **MySQL** (via WAMP, XAMPP ou installation directe)
- **Node.js** (version LTS recommandée)
- **Java JDK 21**

---

### 2. Configuration de la Base de Données

1. Lancez votre serveur MySQL.
2. Créez la base de données vide :

```sql
CREATE DATABASE gestistock_db;
```

> **Note :** Le backend est configuré pour initialiser automatiquement les tables et les données via le fichiers `schema.sql` situés dans `src/main/resources`.

---

### 3. Lancement du Backend (API)

1. Ouvrez un terminal dans le dossier `gestistock-backend`.
2. Lancez l'application via le wrapper Maven :

```bash
./mvnw spring-boot:run
```


✅ Serveur actif sur : [http://localhost:8080](http://localhost:8080)

---

### 4. Lancement du Frontend (Angular)

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