CREATE TABLE utilisateur (
  id_utilisateur BIGINT AUTO_INCREMENT PRIMARY KEY,
  nom_complet VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  mot_de_passe VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL,
  statut BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT ck_utilisateur_role CHECK (role IN ('Admin', 'Mag'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE categorie (
  id_categorie BIGINT AUTO_INCREMENT PRIMARY KEY,
  nom_categorie VARCHAR(150) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE produit (
  id_produit BIGINT AUTO_INCREMENT PRIMARY KEY,
  reference VARCHAR(100) NOT NULL UNIQUE,
  nom_produit VARCHAR(200) NOT NULL,
  description TEXT,
  prix DECIMAL(10,2) NOT NULL,
  quantite_stock INT NOT NULL DEFAULT 0,
  stock_minimum INT NOT NULL DEFAULT 0,
  id_categorie BIGINT NOT NULL,
  CONSTRAINT fk_produit_categorie
    FOREIGN KEY (id_categorie) REFERENCES categorie(id_categorie)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE fournisseur (
  id_fournisseur BIGINT AUTO_INCREMENT PRIMARY KEY,
  nom_complet VARCHAR(150) NOT NULL,
  email VARCHAR(150),
  telephone VARCHAR(50),
  adresse VARCHAR(255),
  notes TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE bon (
  id_bon BIGINT AUTO_INCREMENT PRIMARY KEY,
  reference VARCHAR(100) NOT NULL UNIQUE,
  date_bon DATETIME NOT NULL,
  type_bon VARCHAR(10) NOT NULL,
  statut VARCHAR(10) NOT NULL,
  notes TEXT,
  total DECIMAL(12,2),
  id_utilisateur BIGINT NOT NULL,
  id_fournisseur BIGINT,
  CONSTRAINT ck_bon_type CHECK (type_bon IN ('IN', 'OUT')),
  CONSTRAINT ck_bon_statut CHECK (statut IN ('Valide', 'Annule')),
  CONSTRAINT fk_bon_utilisateur
    FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur),
  CONSTRAINT fk_bon_fournisseur
    FOREIGN KEY (id_fournisseur) REFERENCES fournisseur(id_fournisseur)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE ligne_bon (
  id_ligne_bon BIGINT AUTO_INCREMENT PRIMARY KEY,
  quantite INT NOT NULL,
  prix_unitaire DECIMAL(10,2) NOT NULL,
  id_bon BIGINT NOT NULL,
  id_produit BIGINT NOT NULL,
  CONSTRAINT fk_ligne_bon_bon
    FOREIGN KEY (id_bon) REFERENCES bon(id_bon),
  CONSTRAINT fk_ligne_bon_produit
    FOREIGN KEY (id_produit) REFERENCES produit(id_produit)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE mouvement_stock (
  id_mouvement BIGINT AUTO_INCREMENT PRIMARY KEY,
  type_mouvement VARCHAR(10) NOT NULL,
  quantite INT NOT NULL,
  date_mouvement DATETIME NOT NULL,
  motif VARCHAR(255),
  id_produit BIGINT NOT NULL,
  id_utilisateur BIGINT NOT NULL,
  CONSTRAINT ck_mouvement_type CHECK (type_mouvement IN ('IN', 'OUT')),
  CONSTRAINT fk_mouvement_produit
    FOREIGN KEY (id_produit) REFERENCES produit(id_produit),
  CONSTRAINT fk_mouvement_utilisateur
    FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_produit_categorie ON produit(id_categorie);
CREATE INDEX idx_bon_utilisateur ON bon(id_utilisateur);
CREATE INDEX idx_bon_fournisseur ON bon(id_fournisseur);
CREATE INDEX idx_ligne_bon_bon ON ligne_bon(id_bon);
CREATE INDEX idx_ligne_bon_produit ON ligne_bon(id_produit);
CREATE INDEX idx_mouvement_produit ON mouvement_stock(id_produit);
CREATE INDEX idx_mouvement_utilisateur ON mouvement_stock(id_utilisateur);

INSERT INTO utilisateur (nom_complet, email, mot_de_passe, role, statut)
VALUES ('Admin Demo', 'admin@demo.local', 'admin123', 'Admin', TRUE);
