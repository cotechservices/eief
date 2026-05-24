-- ============================================
-- BASE DE DONNÉES : ECOLE_FUTUR_GESTION
-- POSTGRESQL
-- ============================================

-- Création de la base de données
CREATE DATABASE ecole_futur_gestion;

-- ============================================
-- 1. TABLE utilisateurs (authentification commune)
-- ============================================
CREATE TABLE utilisateurs (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    mot_de_passe VARCHAR(255) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    nom VARCHAR(100) NOT NULL,
    telephone VARCHAR(20),
    adresse TEXT,
    photo_url TEXT,
    role VARCHAR(50) NOT NULL CHECK (role IN (
    'SUPER_ADMIN',
    'DIRECTEUR_GENERAL',
    'DIRECTEUR_ETUDES',
    'COMPTABLE',
    'SURVEILLANT_GENERAL',
    'ADMIN_CANTINE',
    'ADMIN_TRANSPORT',
    'ADMIN_BIBLIOTHEQUE',
    'ENSEIGNANT',
    'PARENT',
    'ELEVE',
    'ADMIN_LIBRAIRIE'
)),
    est_actif BOOLEAN DEFAULT true,
    derniere_connexion TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. TABLE eleves
-- ============================================
CREATE TABLE eleves (
    id SERIAL PRIMARY KEY,
    utilisateur_id INTEGER UNIQUE REFERENCES utilisateurs(id) ON DELETE CASCADE,
    matricule VARCHAR(50) UNIQUE NOT NULL,
    date_naissance DATE NOT NULL,
    lieu_naissance VARCHAR(100),
    sexe VARCHAR(1) CHECK (sexe IN ('M', 'F')),
    nationalite VARCHAR(50) DEFAULT 'Guinéenne',
    classe_id INTEGER,
    date_inscription DATE DEFAULT CURRENT_DATE,
    est_inscrit BOOLEAN DEFAULT true,
    carte_scolaire_url TEXT,
    photo_url TEXT
);

-- ============================================
-- 3. TABLE parents
-- ============================================
CREATE TABLE parents (
    id SERIAL PRIMARY KEY,
    utilisateur_id INTEGER UNIQUE REFERENCES utilisateurs(id) ON DELETE CASCADE,
    profession VARCHAR(100),
    situation_matrimoniale VARCHAR(50)
);

-- ============================================
-- 4. TABLE lien_parent_eleve (liaison many-to-many)
-- ============================================
CREATE TABLE lien_parent_eleve (
    parent_id INTEGER REFERENCES parents(id) ON DELETE CASCADE,
    eleve_id INTEGER REFERENCES eleves(id) ON DELETE CASCADE,
    lien VARCHAR(50) DEFAULT 'parent',
    PRIMARY KEY (parent_id, eleve_id)
);

-- ============================================
-- 5. TABLE personnels (enseignants + non-enseignants)
-- ============================================
CREATE TABLE personnels (
    id SERIAL PRIMARY KEY,
    utilisateur_id INTEGER UNIQUE REFERENCES utilisateurs(id) ON DELETE CASCADE,
    matricule_personnel VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(50) CHECK (type IN ('enseignant', 'admin_enseignant', 'admin_cantine', 'admin_transport', 'admin_bibliotheque', 'admin_librairie', 'comptable', 'surveillant_general', 'directeur_etudes', 'directeur_general')),
    date_embauche DATE DEFAULT CURRENT_DATE,
    salaire_base INTEGER,
    carte_personnel_url TEXT
);

-- ============================================
-- 6. TABLE classes
-- ============================================
CREATE TABLE classes (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(50) NOT NULL,
    niveau VARCHAR(50) NOT NULL,
    salle VARCHAR(50),
    capacite_max INTEGER DEFAULT 30,
    titulaire_id INTEGER REFERENCES personnels(id),
    code_acces VARCHAR(20),
    annee_scolaire_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mise à jour de la foreign key eleves.classe_id
ALTER TABLE eleves ADD CONSTRAINT fk_eleve_classe FOREIGN KEY (classe_id) REFERENCES classes(id);

-- ============================================
-- 7. TABLE annees_scolaires
-- ============================================
CREATE TABLE annees_scolaires (
    id SERIAL PRIMARY KEY,
    libelle VARCHAR(20) NOT NULL,
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    est_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE classes ADD CONSTRAINT fk_classe_annee FOREIGN KEY (annee_scolaire_id) REFERENCES annees_scolaires(id);

-- ============================================
-- 8. TABLE matieres
-- ============================================
CREATE TABLE matieres (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    coefficient INTEGER DEFAULT 1,
    description TEXT
);

-- ============================================
-- 9. TABLE enseignement (liaison personnel (enseignant) - classe - matiere)
-- ============================================
CREATE TABLE enseignements (
    id SERIAL PRIMARY KEY,
    enseignant_id INTEGER REFERENCES personnels(id),
    classe_id INTEGER REFERENCES classes(id),
    matiere_id INTEGER REFERENCES matieres(id),
    heures_semaine DECIMAL(5,2),
    heures_mois DECIMAL(5,2),
    heures_an DECIMAL(5,2),
    annee_scolaire_id INTEGER REFERENCES annees_scolaires(id)
);

-- ============================================
-- 10. TABLE lecons
-- ============================================
CREATE TABLE lecons (
    id SERIAL PRIMARY KEY,
    enseignement_id INTEGER REFERENCES enseignements(id),
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    contenu TEXT,
    fichier_url TEXT,
    video_url TEXT,
    date_publication DATE DEFAULT CURRENT_DATE
);

-- ============================================
-- 11. TABLE devoirs
-- ============================================
CREATE TABLE devoirs (
    id SERIAL PRIMARY KEY,
    enseignement_id INTEGER REFERENCES enseignements(id),
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    fichier_url TEXT,
    date_limite DATE NOT NULL,
    date_publication DATE DEFAULT CURRENT_DATE
);

-- ============================================
-- 12. TABLE soumissions_devoirs
-- ============================================
CREATE TABLE soumissions_devoirs (
    id SERIAL PRIMARY KEY,
    devoir_id INTEGER REFERENCES devoirs(id) ON DELETE CASCADE,
    eleve_id INTEGER REFERENCES eleves(id) ON DELETE CASCADE,
    fichier_url TEXT,
    date_soumission TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    note DECIMAL(5,2),
    commentaire TEXT,
    est_retard BOOLEAN DEFAULT false
);

-- ============================================
-- 13. TABLE examens (QCM)
-- ============================================
CREATE TABLE examens (
    id SERIAL PRIMARY KEY,
    enseignement_id INTEGER REFERENCES enseignements(id),
    titre VARCHAR(255) NOT NULL,
    duree_minutes INTEGER,
    date_debut TIMESTAMP,
    date_fin TIMESTAMP,
    est_actif BOOLEAN DEFAULT true
);

-- ============================================
-- 14. TABLE questions_qcm
-- ============================================
CREATE TABLE questions_qcm (
    id SERIAL PRIMARY KEY,
    examen_id INTEGER REFERENCES examens(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    points INTEGER DEFAULT 1,
    ordre INTEGER
);

-- ============================================
-- 15. TABLE options_qcm
-- ============================================
CREATE TABLE options_qcm (
    id SERIAL PRIMARY KEY,
    question_id INTEGER REFERENCES questions_qcm(id) ON DELETE CASCADE,
    option_texte TEXT NOT NULL,
    est_correcte BOOLEAN DEFAULT false
);

-- ============================================
-- 16. TABLE reponses_eleves_qcm
-- ============================================
CREATE TABLE reponses_eleves_qcm (
    id SERIAL PRIMARY KEY,
    examen_id INTEGER REFERENCES examens(id) ON DELETE CASCADE,
    eleve_id INTEGER REFERENCES eleves(id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES questions_qcm(id),
    option_id INTEGER REFERENCES options_qcm(id),
    date_reponse TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 17. TABLE notes
-- ============================================
CREATE TABLE notes (
    id SERIAL PRIMARY KEY,
    eleve_id INTEGER REFERENCES eleves(id) ON DELETE CASCADE,
    enseignement_id INTEGER REFERENCES enseignements(id),
    type_note VARCHAR(50) CHECK (type_note IN ('devoir', 'composition', 'examen')),
    valeur DECIMAL(5,2) NOT NULL,
    coefficient INTEGER DEFAULT 1,
    date_saisie DATE DEFAULT CURRENT_DATE,
    commentaire TEXT,
    enseignant_id INTEGER REFERENCES personnels(id)
);

-- ============================================
-- 18. TABLE presences
-- ============================================
CREATE TABLE presences (
    id SERIAL PRIMARY KEY,
    eleve_id INTEGER REFERENCES eleves(id) ON DELETE CASCADE,
    classe_id INTEGER REFERENCES classes(id),
    date DATE NOT NULL,
    statut VARCHAR(20) CHECK (statut IN ('present', 'absent', 'retard', 'justifie')),
    heure_arrivee TIME,
    justificatif_url TEXT,
    enseignant_id INTEGER REFERENCES personnels(id)
);

-- ============================================
-- 19. TABLE paiements
-- ============================================
CREATE TABLE paiements (
    id SERIAL PRIMARY KEY,
    eleve_id INTEGER REFERENCES eleves(id) ON DELETE CASCADE,
    montant INTEGER NOT NULL,
    type_frais VARCHAR(50) CHECK (type_frais IN ('inscription', 'mensualite', 'cantine', 'transport', 'bibliotheque', 'autre')),
    mois INTEGER,
    annee INTEGER,
    mode_paiement VARCHAR(50) CHECK (mode_paiement IN ('mobile_money', 'especes', 'carte')),
    reference_transaction VARCHAR(100),
    statut VARCHAR(20) DEFAULT 'valide',
    date_paiement DATE DEFAULT CURRENT_DATE,
    reçu_url TEXT,
    saisie_par INTEGER REFERENCES utilisateurs(id)
);

-- ============================================
-- 20. TABLE frais_scolaires (tarifs par année)
-- ============================================
CREATE TABLE frais_scolaires (
    id SERIAL PRIMARY KEY,
    type_frais VARCHAR(50) NOT NULL,
    montant INTEGER NOT NULL,
    annee_scolaire_id INTEGER REFERENCES annees_scolaires(id),
    description TEXT
);

-- ============================================
-- 21. TABLE cantine_menus
-- ============================================
CREATE TABLE cantine_menus (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    plat VARCHAR(255),
    accompagnement VARCHAR(255),
    dessert VARCHAR(255),
    regime_special BOOLEAN DEFAULT false
);

-- ============================================
-- 22. TABLE reserves_cantine
-- ============================================
CREATE TABLE reserves_cantine (
    id SERIAL PRIMARY KEY,
    eleve_id INTEGER REFERENCES eleves(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    est_present BOOLEAN DEFAULT false,
    date_reservation DATE DEFAULT CURRENT_DATE
);

-- ============================================
-- 23. TABLE bus
-- ============================================
CREATE TABLE bus (
    id SERIAL PRIMARY KEY,
    immatriculation VARCHAR(50) UNIQUE NOT NULL,
    capacite INTEGER,
    chauffeur_nom VARCHAR(100),
    chauffeur_tel VARCHAR(20)
);

-- ============================================
-- 24. TABLE lignes_transport
-- ============================================
CREATE TABLE lignes_transport (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100),
    bus_id INTEGER REFERENCES bus(id),
    horaire_matin TIME,
    horaire_soir TIME
);

-- ============================================
-- 25. TABLE inscriptions_transport
-- ============================================
CREATE TABLE inscriptions_transport (
    id SERIAL PRIMARY KEY,
    eleve_id INTEGER REFERENCES eleves(id) ON DELETE CASCADE,
    ligne_id INTEGER REFERENCES lignes_transport(id),
    date_debut DATE,
    date_fin DATE,
    est_actif BOOLEAN DEFAULT true
);

-- ============================================
-- 26. TABLE livres_bibliotheque
-- ============================================
CREATE TABLE livres_bibliotheque (
    id SERIAL PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    auteur VARCHAR(255),
    isbn VARCHAR(50),
    quantite INTEGER DEFAULT 1,
    disponible INTEGER DEFAULT 1,
    emplacement VARCHAR(50)
);

-- ============================================
-- 27. TABLE messages
-- ============================================
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    expediteur_id INTEGER REFERENCES utilisateurs(id) ON DELETE CASCADE,
    destinataire_id INTEGER REFERENCES utilisateurs(id) ON DELETE CASCADE,
    sujet VARCHAR(255),
    contenu TEXT,
    est_lu BOOLEAN DEFAULT false,
    date_envoi TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 28. TABLE annonces
-- ============================================
CREATE TABLE annonces (
    id SERIAL PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    contenu TEXT NOT NULL,
    cible VARCHAR(50) CHECK (cible IN ('tous', 'classe', 'parent', 'enseignant')),
    classe_id INTEGER REFERENCES classes(id),
    date_publication TIMESTAMP DEFAULT CURRENT_DATE,
    date_programmee TIMESTAMP,
    publie_par INTEGER REFERENCES utilisateurs(id)
);

-- ============================================
-- 29. TABLE logs_activites
-- ============================================
CREATE TABLE logs_activites (
    id SERIAL PRIMARY KEY,
    utilisateur_id INTEGER REFERENCES utilisateurs(id),
    action VARCHAR(255),
    details TEXT,
    ip_address VARCHAR(45),
    date_action TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 30. TABLE sessions
-- ============================================
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    utilisateur_id INTEGER REFERENCES utilisateurs(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expire_le TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEX POUR PERFORMANCES
-- ============================================

CREATE INDEX idx_utilisateurs_email ON utilisateurs(email);
CREATE INDEX idx_utilisateurs_role ON utilisateurs(role);
CREATE INDEX idx_eleves_matricule ON eleves(matricule);
CREATE INDEX idx_eleves_classe ON eleves(classe_id);
CREATE INDEX idx_presences_date ON presences(date);
CREATE INDEX idx_paiements_eleve ON paiements(eleve_id);
CREATE INDEX idx_paiements_date ON paiements(date_paiement);
CREATE INDEX idx_notes_eleve ON notes(eleve_id);
CREATE INDEX idx_enseignements_classe ON enseignements(classe_id);
CREATE INDEX idx_enseignements_enseignant ON enseignements(enseignant_id);
CREATE INDEX idx_messages_destinataire ON messages(destinataire_id, est_lu);

-- ============================================
-- INITIALISATION ANNÉE SCOLAIRE
-- ============================================

INSERT INTO annees_scolaires (libelle, date_debut, date_fin, est_active)
VALUES ('2025-2026', '2025-10-01', '2026-06-30', true);

-- ============================================
-- FIN DU SCRIPT
-- ============================================


-----------------------------------------------------------------------

-- ============================================
-- BASE DE DONNÉES : ECOLE_FUTUR_GESTION (SUPABASE)
-- ============================================

-- ============================================
-- 1. TABLE utilisateurs
-- ============================================
CREATE TABLE IF NOT EXISTS utilisateurs (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    mot_de_passe VARCHAR(255) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    nom VARCHAR(100) NOT NULL,
    telephone VARCHAR(20),
    adresse TEXT,
    photo_url TEXT,
    role VARCHAR(50) NOT NULL CHECK (role IN (
        'SUPER_ADMIN',
    'DIRECTEUR_GENERAL',
    'DIRECTEUR_ETUDES',
    'COMPTABLE',
    'SURVEILLANT_GENERAL',
    'ADMIN_CANTINE',
    'ADMIN_TRANSPORT',
    'ADMIN_BIBLIOTHEQUE',
    'ENSEIGNANT',
    'PARENT',
    'ELEVE',
    'ADMIN_LIBRAIRIE'
    )),
    est_actif BOOLEAN DEFAULT true,
    derniere_connexion TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. TABLE eleves
-- ============================================
CREATE TABLE IF NOT EXISTS eleves (
    id SERIAL PRIMARY KEY,
    utilisateur_id INTEGER UNIQUE REFERENCES utilisateurs(id) ON DELETE CASCADE,
    matricule VARCHAR(50) UNIQUE NOT NULL,
    date_naissance DATE NOT NULL,
    lieu_naissance VARCHAR(100),
    sexe VARCHAR(1) CHECK (sexe IN ('M', 'F')),
    nationalite VARCHAR(50) DEFAULT 'Guinéenne',
    classe_id INTEGER,
    date_inscription DATE DEFAULT CURRENT_DATE,
    est_inscrit BOOLEAN DEFAULT true,
    carte_scolaire_url TEXT,
    photo_url TEXT
);

-- ============================================
-- 3. TABLE parents
-- ============================================
CREATE TABLE IF NOT EXISTS parents (
    id SERIAL PRIMARY KEY,
    utilisateur_id INTEGER UNIQUE REFERENCES utilisateurs(id) ON DELETE CASCADE,
    profession VARCHAR(100),
    situation_matrimoniale VARCHAR(50)
);

-- ============================================
-- 4. TABLE lien_parent_eleve
-- ============================================
CREATE TABLE IF NOT EXISTS lien_parent_eleve (
    parent_id INTEGER REFERENCES parents(id) ON DELETE CASCADE,
    eleve_id INTEGER REFERENCES eleves(id) ON DELETE CASCADE,
    lien VARCHAR(50) DEFAULT 'parent',
    PRIMARY KEY (parent_id, eleve_id)
);

-- ============================================
-- 5. TABLE personnels
-- ============================================
CREATE TABLE IF NOT EXISTS personnels (
    id SERIAL PRIMARY KEY,
    utilisateur_id INTEGER UNIQUE REFERENCES utilisateurs(id) ON DELETE CASCADE,
    matricule_personnel VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(50) CHECK (type IN ('enseignant', 'admin_enseignant', 'admin_cantine', 'admin_transport', 'admin_bibliotheque', 'admin_librairie', 'comptable', 'surveillant_general', 'directeur_etudes', 'directeur_general')),
    date_embauche DATE DEFAULT CURRENT_DATE,
    salaire_base INTEGER,
    carte_personnel_url TEXT
);

-- ============================================
-- 6. TABLE classes
-- ============================================
CREATE TABLE IF NOT EXISTS classes (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(50) NOT NULL,
    niveau VARCHAR(50) NOT NULL,
    salle VARCHAR(50),
    capacite_max INTEGER DEFAULT 30,
    titulaire_id INTEGER REFERENCES personnels(id),
    code_acces VARCHAR(20),
    annee_scolaire_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 7. TABLE annees_scolaires
-- ============================================
CREATE TABLE IF NOT EXISTS annees_scolaires (
    id SERIAL PRIMARY KEY,
    libelle VARCHAR(20) NOT NULL,
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    est_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 8. TABLE matieres
-- ============================================
CREATE TABLE IF NOT EXISTS matieres (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    coefficient INTEGER DEFAULT 1,
    description TEXT
);

-- ============================================
-- 9. TABLE enseignements
-- ============================================
CREATE TABLE IF NOT EXISTS enseignements (
    id SERIAL PRIMARY KEY,
    enseignant_id INTEGER REFERENCES personnels(id),
    classe_id INTEGER REFERENCES classes(id),
    matiere_id INTEGER REFERENCES matieres(id),
    heures_semaine DECIMAL(5,2),
    heures_mois DECIMAL(5,2),
    heures_an DECIMAL(5,2),
    annee_scolaire_id INTEGER REFERENCES annees_scolaires(id)
);

-- ============================================
-- 10. TABLE lecons
-- ============================================
CREATE TABLE IF NOT EXISTS lecons (
    id SERIAL PRIMARY KEY,
    enseignement_id INTEGER REFERENCES enseignements(id),
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    contenu TEXT,
    fichier_url TEXT,
    video_url TEXT,
    date_publication DATE DEFAULT CURRENT_DATE
);

-- ============================================
-- 11. TABLE devoirs
-- ============================================
CREATE TABLE IF NOT EXISTS devoirs (
    id SERIAL PRIMARY KEY,
    enseignement_id INTEGER REFERENCES enseignements(id),
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    fichier_url TEXT,
    date_limite DATE NOT NULL,
    date_publication DATE DEFAULT CURRENT_DATE
);

-- ============================================
-- 12. TABLE soumissions_devoirs
-- ============================================
CREATE TABLE IF NOT EXISTS soumissions_devoirs (
    id SERIAL PRIMARY KEY,
    devoir_id INTEGER REFERENCES devoirs(id) ON DELETE CASCADE,
    eleve_id INTEGER REFERENCES eleves(id) ON DELETE CASCADE,
    fichier_url TEXT,
    date_soumission TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    note DECIMAL(5,2),
    commentaire TEXT,
    est_retard BOOLEAN DEFAULT false
);

-- ============================================
-- 13. TABLE examens
-- ============================================
CREATE TABLE IF NOT EXISTS examens (
    id SERIAL PRIMARY KEY,
    enseignement_id INTEGER REFERENCES enseignements(id),
    titre VARCHAR(255) NOT NULL,
    duree_minutes INTEGER,
    date_debut TIMESTAMP,
    date_fin TIMESTAMP,
    est_actif BOOLEAN DEFAULT true
);

-- ============================================
-- 14. TABLE questions_qcm
-- ============================================
CREATE TABLE IF NOT EXISTS questions_qcm (
    id SERIAL PRIMARY KEY,
    examen_id INTEGER REFERENCES examens(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    points INTEGER DEFAULT 1,
    ordre INTEGER
);

-- ============================================
-- 15. TABLE options_qcm
-- ============================================
CREATE TABLE IF NOT EXISTS options_qcm (
    id SERIAL PRIMARY KEY,
    question_id INTEGER REFERENCES questions_qcm(id) ON DELETE CASCADE,
    option_texte TEXT NOT NULL,
    est_correcte BOOLEAN DEFAULT false
);

-- ============================================
-- 16. TABLE reponses_eleves_qcm
-- ============================================
CREATE TABLE IF NOT EXISTS reponses_eleves_qcm (
    id SERIAL PRIMARY KEY,
    examen_id INTEGER REFERENCES examens(id) ON DELETE CASCADE,
    eleve_id INTEGER REFERENCES eleves(id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES questions_qcm(id),
    option_id INTEGER REFERENCES options_qcm(id),
    date_reponse TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 17. TABLE notes
-- ============================================
CREATE TABLE IF NOT EXISTS notes (
    id SERIAL PRIMARY KEY,
    eleve_id INTEGER REFERENCES eleves(id) ON DELETE CASCADE,
    enseignement_id INTEGER REFERENCES enseignements(id),
    type_note VARCHAR(50) CHECK (type_note IN ('devoir', 'composition', 'examen')),
    valeur DECIMAL(5,2) NOT NULL,
    coefficient INTEGER DEFAULT 1,
    date_saisie DATE DEFAULT CURRENT_DATE,
    commentaire TEXT,
    enseignant_id INTEGER REFERENCES personnels(id)
);

-- ============================================
-- 18. TABLE presences
-- ============================================
CREATE TABLE IF NOT EXISTS presences (
    id SERIAL PRIMARY KEY,
    eleve_id INTEGER REFERENCES eleves(id) ON DELETE CASCADE,
    classe_id INTEGER REFERENCES classes(id),
    date DATE NOT NULL,
    statut VARCHAR(20) CHECK (statut IN ('present', 'absent', 'retard', 'justifie')),
    heure_arrivee TIME,
    justificatif_url TEXT,
    enseignant_id INTEGER REFERENCES personnels(id)
);

-- ============================================
-- 19. TABLE paiements
-- ============================================
CREATE TABLE IF NOT EXISTS paiements (
    id SERIAL PRIMARY KEY,
    eleve_id INTEGER REFERENCES eleves(id) ON DELETE CASCADE,
    montant INTEGER NOT NULL,
    type_frais VARCHAR(50) CHECK (type_frais IN ('inscription', 'mensualite', 'cantine', 'transport', 'bibliotheque', 'autre')),
    mois INTEGER,
    annee INTEGER,
    mode_paiement VARCHAR(50) CHECK (mode_paiement IN ('mobile_money', 'especes', 'carte')),
    reference_transaction VARCHAR(100),
    statut VARCHAR(20) DEFAULT 'valide',
    date_paiement DATE DEFAULT CURRENT_DATE,
    reçu_url TEXT,
    saisie_par INTEGER REFERENCES utilisateurs(id)
);

-- ============================================
-- 20. TABLE frais_scolaires
-- ============================================
CREATE TABLE IF NOT EXISTS frais_scolaires (
    id SERIAL PRIMARY KEY,
    type_frais VARCHAR(50) NOT NULL,
    montant INTEGER NOT NULL,
    annee_scolaire_id INTEGER REFERENCES annees_scolaires(id),
    description TEXT
);

-- ============================================
-- 21. TABLE cantine_menus
-- ============================================
CREATE TABLE IF NOT EXISTS cantine_menus (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    plat VARCHAR(255),
    accompagnement VARCHAR(255),
    dessert VARCHAR(255),
    regime_special BOOLEAN DEFAULT false
);

-- ============================================
-- 22. TABLE reserves_cantine
-- ============================================
CREATE TABLE IF NOT EXISTS reserves_cantine (
    id SERIAL PRIMARY KEY,
    eleve_id INTEGER REFERENCES eleves(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    est_present BOOLEAN DEFAULT false,
    date_reservation DATE DEFAULT CURRENT_DATE
);

-- ============================================
-- 23. TABLE bus
-- ============================================
CREATE TABLE IF NOT EXISTS bus (
    id SERIAL PRIMARY KEY,
    immatriculation VARCHAR(50) UNIQUE NOT NULL,
    capacite INTEGER,
    chauffeur_nom VARCHAR(100),
    chauffeur_tel VARCHAR(20)
);

-- ============================================
-- 24. TABLE lignes_transport
-- ============================================
CREATE TABLE IF NOT EXISTS lignes_transport (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100),
    bus_id INTEGER REFERENCES bus(id),
    horaire_matin TIME,
    horaire_soir TIME
);

-- ============================================
-- 25. TABLE inscriptions_transport
-- ============================================
CREATE TABLE IF NOT EXISTS inscriptions_transport (
    id SERIAL PRIMARY KEY,
    eleve_id INTEGER REFERENCES eleves(id) ON DELETE CASCADE,
    ligne_id INTEGER REFERENCES lignes_transport(id),
    date_debut DATE,
    date_fin DATE,
    est_actif BOOLEAN DEFAULT true
);

-- ============================================
-- 26. TABLE livres_bibliotheque
-- ============================================
CREATE TABLE IF NOT EXISTS livres_bibliotheque (
    id SERIAL PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    auteur VARCHAR(255),
    isbn VARCHAR(50),
    quantite INTEGER DEFAULT 1,
    disponible INTEGER DEFAULT 1,
    emplacement VARCHAR(50)
);

-- ============================================
-- 27. TABLE messages
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    expediteur_id INTEGER REFERENCES utilisateurs(id) ON DELETE CASCADE,
    destinataire_id INTEGER REFERENCES utilisateurs(id) ON DELETE CASCADE,
    sujet VARCHAR(255),
    contenu TEXT,
    est_lu BOOLEAN DEFAULT false,
    date_envoi TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 28. TABLE annonces
-- ============================================
CREATE TABLE IF NOT EXISTS annonces (
    id SERIAL PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    contenu TEXT NOT NULL,
    cible VARCHAR(50) CHECK (cible IN ('tous', 'classe', 'parent', 'enseignant')),
    classe_id INTEGER REFERENCES classes(id),
    date_publication TIMESTAMP DEFAULT CURRENT_DATE,
    date_programmee TIMESTAMP,
    publie_par INTEGER REFERENCES utilisateurs(id)
);

-- ============================================
-- 29. TABLE logs_activites
-- ============================================
CREATE TABLE IF NOT EXISTS logs_activites (
    id SERIAL PRIMARY KEY,
    utilisateur_id INTEGER REFERENCES utilisateurs(id),
    action VARCHAR(255),
    details TEXT,
    ip_address VARCHAR(45),
    date_action TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 30. TABLE sessions
-- ============================================
CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    utilisateur_id INTEGER REFERENCES utilisateurs(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expire_le TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEX
-- ============================================

CREATE INDEX IF NOT EXISTS idx_utilisateurs_email ON utilisateurs(email);
CREATE INDEX IF NOT EXISTS idx_utilisateurs_role ON utilisateurs(role);
CREATE INDEX IF NOT EXISTS idx_eleves_matricule ON eleves(matricule);
CREATE INDEX IF NOT EXISTS idx_eleves_classe ON eleves(classe_id);
CREATE INDEX IF NOT EXISTS idx_presences_date ON presences(date);
CREATE INDEX IF NOT EXISTS idx_paiements_eleve ON paiements(eleve_id);
CREATE INDEX IF NOT EXISTS idx_paiements_date ON paiements(date_paiement);
CREATE INDEX IF NOT EXISTS idx_notes_eleve ON notes(eleve_id);
CREATE INDEX IF NOT EXISTS idx_enseignements_classe ON enseignements(classe_id);
CREATE INDEX IF NOT EXISTS idx_enseignements_enseignant ON enseignements(enseignant_id);
CREATE INDEX IF NOT EXISTS idx_messages_destinataire ON messages(destinataire_id, est_lu);

-- ============================================
-- INITIALISATION ANNÉE SCOLAIRE
-- ============================================

INSERT INTO annees_scolaires (libelle, date_debut, date_fin, est_active)
SELECT '2025-2026', '2025-10-01', '2026-06-30', true
WHERE NOT EXISTS (SELECT 1 FROM annees_scolaires);

-- ============================================
-- CRÉATION ADMIN
-- ============================================

-- Mot de passe hashé pour 'admin123'
INSERT INTO utilisateurs (email, mot_de_passe, prenom, nom, role, est_actif)
SELECT 'admin@eief.com', 
       '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr7ZqFqFqFqFqFqFqFqFqFqFqFqF',
       'Super', 'Admin', 'SUPER_ADMIN', true
WHERE NOT EXISTS (SELECT 1 FROM utilisateurs WHERE email = 'admin@eief.com');

-- ============================================
-- FIN DU SCRIPT
-- ============================================