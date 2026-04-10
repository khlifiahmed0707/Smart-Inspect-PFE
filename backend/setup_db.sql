USE formulaire_db;

CREATE TABLE IF NOT EXISTS new_register (
    email VARCHAR(255) NOT NULL,
    nom VARCHAR(255),
    prenom VARCHAR(255),
    password VARCHAR(255),
    numero_carte_identite VARCHAR(255),
    PRIMARY KEY (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
