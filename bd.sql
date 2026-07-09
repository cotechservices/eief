-- ============================================
-- BASE DE DONNÉES : ECOLE_FUTUR_GESTION (SUPABASE)
-- Généré automatiquement en analysant les routes API du projet
-- ============================================

-- ============================================
-- 1. TABLE utilisateurs
-- ============================================
CREATE TABLE IF NOT EXISTS utilisateurs (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
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
-- 2. TABLE annees_scolaires
-- (doit être créée avant classes)
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
-- 3. TABLE personnels
-- ============================================
CREATE TABLE IF NOT EXISTS personnels (
    id SERIAL PRIMARY KEY,
    utilisateur_id INTEGER UNIQUE REFERENCES utilisateurs(id) ON DELETE CASCADE,
    matricule_personnel VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(50) CHECK (type IN (
        'enseignant', 'admin_enseignant', 'admin_cantine', 'admin_transport',
        'admin_bibliotheque', 'admin_librairie', 'comptable',
        'surveillant_general', 'directeur_etudes', 'directeur_general'
    )),
    date_embauche DATE DEFAULT CURRENT_DATE,
    salaire_base INTEGER,
    carte_personnel_url TEXT
);

-- ============================================
-- 4. TABLE classes
-- (doit être créée avant eleves et enseignements)
-- ============================================
CREATE TABLE IF NOT EXISTS classes (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(50) NOT NULL,
    niveau VARCHAR(50) NOT NULL,
    salle VARCHAR(50),
    capacite_max INTEGER DEFAULT 30,
    titulaire_id INTEGER REFERENCES personnels(id),
    code_acces VARCHAR(20),
    frais_inscription INTEGER DEFAULT 0,
    annee_scolaire_id INTEGER REFERENCES annees_scolaires(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 5. TABLE eleves
-- ============================================
CREATE TABLE IF NOT EXISTS eleves (
    id SERIAL PRIMARY KEY,
    utilisateur_id INTEGER UNIQUE REFERENCES utilisateurs(id) ON DELETE CASCADE,
    matricule VARCHAR(50) UNIQUE NOT NULL,
    date_naissance DATE NOT NULL,
    lieu_naissance VARCHAR(100),
    sexe VARCHAR(1) CHECK (sexe IN ('M', 'F')),
    nationalite VARCHAR(50) DEFAULT 'Guinéenne',
    classe_id INTEGER REFERENCES classes(id),
    date_inscription DATE DEFAULT CURRENT_DATE,
    est_inscrit BOOLEAN DEFAULT true,
    carte_scolaire_url TEXT,
    photo_url TEXT
);

-- ============================================
-- 6. TABLE parents
-- ============================================
CREATE TABLE IF NOT EXISTS parents (
    id SERIAL PRIMARY KEY,
    utilisateur_id INTEGER UNIQUE REFERENCES utilisateurs(id) ON DELETE CASCADE,
    profession VARCHAR(100),
    situation_matrimoniale VARCHAR(50)
);

-- ============================================
-- 7. TABLE lien_parent_eleve
-- ============================================
CREATE TABLE IF NOT EXISTS lien_parent_eleve (
    parent_id INTEGER REFERENCES parents(id) ON DELETE CASCADE,
    eleve_id INTEGER REFERENCES eleves(id) ON DELETE CASCADE,
    lien VARCHAR(50) DEFAULT 'parent',
    PRIMARY KEY (parent_id, eleve_id)
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
    statut VARCHAR(20) DEFAULT 'valide' CHECK (statut IN ('valide', 'paye', 'en_attente', 'annule')),
    date_paiement DATE DEFAULT CURRENT_DATE,
    reçu_url TEXT,
    saisie_par INTEGER REFERENCES utilisateurs(id)
);

-- ============================================
-- 20. TABLE frais_scolaires
-- (colonnes étendues selon routes API)
-- ============================================
CREATE TABLE IF NOT EXISTS frais_scolaires (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100),
    type_frais VARCHAR(50) NOT NULL,
    montant INTEGER NOT NULL,
    obligatoire BOOLEAN DEFAULT true,
    frequence VARCHAR(50) DEFAULT 'mensuel',
    niveau VARCHAR(50),
    annee_scolaire_id INTEGER REFERENCES annees_scolaires(id),
    description TEXT
);

-- ============================================
-- 21. TABLE cantine_menus (ancien modèle - vue admin)
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
-- 22. TABLE menus_cantine (nouveau modèle - vue parent)
-- ============================================
CREATE TABLE IF NOT EXISTS menus_cantine (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    plat VARCHAR(255),
    accompagnement VARCHAR(255),
    dessert VARCHAR(255),
    prix DECIMAL(10,2) DEFAULT 5000,
    allergenes TEXT,
    calories INTEGER,
    regime_special BOOLEAN DEFAULT false
);

-- ============================================
-- 23. TABLE reserves_cantine (ancien modèle)
-- ============================================
CREATE TABLE IF NOT EXISTS reserves_cantine (
    id SERIAL PRIMARY KEY,
    eleve_id INTEGER REFERENCES eleves(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    est_present BOOLEAN DEFAULT false,
    date_reservation DATE DEFAULT CURRENT_DATE
);

-- ============================================
-- 24. TABLE inscriptions_cantine (nouveau modèle)
-- ============================================
CREATE TABLE IF NOT EXISTS inscriptions_cantine (
    id SERIAL PRIMARY KEY,
    eleve_id INTEGER REFERENCES eleves(id) ON DELETE CASCADE,
    est_actif BOOLEAN DEFAULT true,
    solde DECIMAL(12,2) DEFAULT 0,
    preferences_alimentaires TEXT,
    allergies TEXT,
    date_inscription DATE DEFAULT CURRENT_DATE
);

-- ============================================
-- 25. TABLE reservations_cantine (nouveau modèle)
-- ============================================
CREATE TABLE IF NOT EXISTS reservations_cantine (
    id SERIAL PRIMARY KEY,
    eleve_id INTEGER REFERENCES eleves(id) ON DELETE CASCADE,
    menu_id INTEGER REFERENCES menus_cantine(id),
    date DATE NOT NULL,
    statut VARCHAR(20) DEFAULT 'confirmee' CHECK (statut IN ('confirmee', 'annulee', 'en_attente')),
    paye BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 26. TABLE transactions_cantine
-- ============================================
CREATE TABLE IF NOT EXISTS transactions_cantine (
    id SERIAL PRIMARY KEY,
    eleve_id INTEGER REFERENCES eleves(id) ON DELETE CASCADE,
    montant DECIMAL(12,2) NOT NULL,
    type VARCHAR(20) CHECK (type IN ('credit', 'debit')),
    description TEXT,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 27. TABLE bus
-- ============================================
CREATE TABLE IF NOT EXISTS bus (
    id SERIAL PRIMARY KEY,
    immatriculation VARCHAR(50) UNIQUE NOT NULL,
    capacite INTEGER,
    chauffeur_nom VARCHAR(100),
    chauffeur_tel VARCHAR(20)
);

-- ============================================
-- 28. TABLE lignes_transport
-- ============================================
CREATE TABLE IF NOT EXISTS lignes_transport (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100),
    bus_id INTEGER REFERENCES bus(id),
    horaire_matin TIME,
    horaire_soir TIME
);

-- ============================================
-- 29. TABLE inscriptions_transport
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
-- 30. TABLE livres_bibliotheque
-- (colonnes étendues selon routes API)
-- ============================================
CREATE TABLE IF NOT EXISTS livres_bibliotheque (
    id SERIAL PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    auteur VARCHAR(255),
    isbn VARCHAR(50),
    quantite INTEGER DEFAULT 1,
    disponible INTEGER DEFAULT 1,
    emplacement VARCHAR(50),
    categorie VARCHAR(100),
    image_url TEXT
);

-- ============================================
-- 31. TABLE emprunts_bibliotheque
-- ============================================
CREATE TABLE IF NOT EXISTS emprunts_bibliotheque (
    id SERIAL PRIMARY KEY,
    livre_id INTEGER REFERENCES livres_bibliotheque(id) ON DELETE CASCADE,
    eleve_id INTEGER REFERENCES eleves(id) ON DELETE CASCADE,
    date_emprunt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_retour_prevue TIMESTAMP NOT NULL,
    date_retour_reelle TIMESTAMP,
    statut VARCHAR(20) DEFAULT 'en_cours' CHECK (statut IN ('en_cours', 'retourne', 'en_retard'))
);

-- ============================================
-- 32. TABLE articles_librairie
-- ============================================
CREATE TABLE IF NOT EXISTS articles_librairie (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    prix_unitaire INTEGER NOT NULL,
    quantite_stock INTEGER DEFAULT 0,
    categorie VARCHAR(100) DEFAULT 'fourniture',
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 33. TABLE ventes_librairie
-- ============================================
CREATE TABLE IF NOT EXISTS ventes_librairie (
    id SERIAL PRIMARY KEY,
    article_id INTEGER REFERENCES articles_librairie(id) ON DELETE CASCADE,
    eleve_id INTEGER REFERENCES eleves(id),
    quantite INTEGER NOT NULL DEFAULT 1,
    montant_total INTEGER NOT NULL,
    date_vente TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    vendu_par INTEGER REFERENCES utilisateurs(id)
);

-- ============================================
-- 34. TABLE messages
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
-- 35. TABLE annonces
-- (colonnes étendues selon routes API)
-- ============================================
CREATE TABLE IF NOT EXISTS annonces (
    id SERIAL PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    contenu TEXT NOT NULL,
    cible VARCHAR(50) DEFAULT 'tous' CHECK (cible IN ('tous', 'classe', 'parent', 'enseignant')),
    type VARCHAR(50) DEFAULT 'information',
    classe_id INTEGER REFERENCES classes(id),
    image_url TEXT,
    date_publication TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP,
    date_programmee TIMESTAMP,
    publie_par INTEGER REFERENCES utilisateurs(id)
);

-- ============================================
-- 36. TABLE logs_activites
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
-- 37. TABLE sessions
-- ============================================
CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    utilisateur_id INTEGER REFERENCES utilisateurs(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expire_le TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 38. TABLE paiements_salaires
-- ============================================
CREATE TABLE IF NOT EXISTS paiements_salaires (
    id SERIAL PRIMARY KEY,
    personnel_id INTEGER REFERENCES personnels(id) ON DELETE CASCADE,
    montant INTEGER NOT NULL,
    mois INTEGER NOT NULL,
    annee INTEGER NOT NULL,
    mode_paiement VARCHAR(50),
    reference_transaction VARCHAR(100),
    saisie_par INTEGER REFERENCES utilisateurs(id),
    statut VARCHAR(20) DEFAULT 'paye' CHECK (statut IN ('paye', 'en_attente', 'annule')),
    date_paiement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (personnel_id, mois, annee)
);

-- ============================================
-- 39. TABLE preinscriptions
-- (colonnes étendues selon routes API)
-- ============================================
CREATE TABLE IF NOT EXISTS preinscriptions (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER REFERENCES parents(id) ON DELETE CASCADE,
    enfant_nom VARCHAR(100) NOT NULL,
    enfant_prenom VARCHAR(100) NOT NULL,
    date_naissance DATE NOT NULL,
    lieu_naissance VARCHAR(100),
    sexe VARCHAR(10) NOT NULL,
    niveau VARCHAR(50) NOT NULL,
    classe VARCHAR(50) NOT NULL,
    acte_naissance_url TEXT,
    photo_url TEXT,
    bulletin_url TEXT,
    statut VARCHAR(50) DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'valide', 'rejete')),
    numero_dossier VARCHAR(50) UNIQUE,
    date_preinscription TIMESTAMP DEFAULT NOW(),
    observations TEXT,
    frais_montant INTEGER DEFAULT 0,
    frais_statut VARCHAR(20) DEFAULT 'non_paye' CHECK (frais_statut IN ('non_paye', 'paye')),
    frais_mode_paiement VARCHAR(50),
    frais_reference VARCHAR(100),
    traite_par INTEGER REFERENCES utilisateurs(id),
    date_traitement TIMESTAMP
);

-- ============================================
-- 40. TABLE inscriptions
-- ============================================
CREATE TABLE IF NOT EXISTS inscriptions (
    id SERIAL PRIMARY KEY,
    preinscription_id INTEGER REFERENCES preinscriptions(id) ON DELETE CASCADE,
    eleve_id INTEGER REFERENCES eleves(id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES parents(id) ON DELETE CASCADE,
    numero_matricule VARCHAR(50) UNIQUE NOT NULL,
    date_inscription DATE DEFAULT CURRENT_DATE,
    annee_scolaire_id INTEGER REFERENCES annees_scolaires(id),
    statut VARCHAR(50) DEFAULT 'active' CHECK (statut IN ('active', 'terminee', 'suspendue')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 41. TABLE reinscriptions
-- (colonnes étendues selon routes API admin)
-- ============================================
CREATE TABLE IF EXISTS public.reinscriptions (
    id SERIAL PRIMARY KEY,
    inscription_id INTEGER REFERENCES inscriptions(id) ON DELETE CASCADE,
    eleve_id INTEGER REFERENCES eleves(id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES parents(id) ON DELETE CASCADE,
    annee_scolaire_id INTEGER REFERENCES annees_scolaires(id),
    classe_id INTEGER REFERENCES classes(id),
    montant_frais INTEGER, 
    frais_statut VARCHAR(50) DEFAULT 'non_paye' CHECK (frais_statut IN ('non_paye', 'paye')),
    frais_mode_paiement VARCHAR(50),
    frais_reference VARCHAR(100),
    frais_date_paiement TIMESTAMP,
    statut VARCHAR(50) DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'valide', 'rejete')),
    date_reinscription TIMESTAMP DEFAULT NOW(),
    observations TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    acte_naissance_url TEXT,
    photo_url TEXT,
    bulletin_url TEXT,
    date_traitement TIMESTAMP,
    -- Colonnes de copie (pour éviter les JOIN)
    numero_dossier VARCHAR(50) UNIQUE,
    enfant_nom VARCHAR(100),
    enfant_prenom VARCHAR(100),
    date_naissance DATE,
    lieu_naissance VARCHAR(200),
    sexe VARCHAR(10),
    niveau VARCHAR(50),
    classe_nom VARCHAR(50),
    parent_nom VARCHAR(100),
    parent_prenom VARCHAR(100),
    parent_email VARCHAR(100),
    parent_telephone VARCHAR(20)
);

-- =========================================================
-- 0. CRÉATION DE LA TABLE depenses (si elle n'existe pas)
-- =========================================================
CREATE TABLE IF NOT EXISTS depenses (
  id             SERIAL PRIMARY KEY,
  categorie      VARCHAR(100) NOT NULL,
  montant        INTEGER NOT NULL,
  description    TEXT,
  date_depense   TIMESTAMPTZ DEFAULT NOW(),
  sous_categorie VARCHAR(100),
  reference      VARCHAR(100),
  fournisseur    VARCHAR(200),
  numero_recu    VARCHAR(100),
  saisi_par      INTEGER REFERENCES utilisateurs(id) ON DELETE SET NULL,
  valide_par     INTEGER REFERENCES utilisateurs(id) ON DELETE SET NULL,
  statut         VARCHAR(20) DEFAULT 'valide' CHECK (statut IN ('valide', 'annule', 'en_attente')),
  exercice_annee INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
  exercice_mois  INTEGER DEFAULT EXTRACT(MONTH FROM NOW()),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
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
CREATE INDEX IF NOT EXISTS idx_preinscriptions_parent_id ON preinscriptions(parent_id);
CREATE INDEX IF NOT EXISTS idx_preinscriptions_statut ON preinscriptions(statut);
CREATE INDEX IF NOT EXISTS idx_preinscriptions_numero_dossier ON preinscriptions(numero_dossier);
CREATE INDEX IF NOT EXISTS idx_preinscriptions_date ON preinscriptions(date_preinscription);
CREATE INDEX IF NOT EXISTS idx_preinscriptions_nom_enfant ON preinscriptions(enfant_nom, enfant_prenom);
CREATE INDEX IF NOT EXISTS idx_inscriptions_eleve ON inscriptions(eleve_id);
CREATE INDEX IF NOT EXISTS idx_inscriptions_parent ON inscriptions(parent_id);
CREATE INDEX IF NOT EXISTS idx_reinscriptions_eleve ON reinscriptions(eleve_id);
CREATE INDEX IF NOT EXISTS idx_reinscriptions_annee ON reinscriptions(annee_scolaire_id);
CREATE INDEX IF NOT EXISTS idx_emprunts_eleve ON emprunts_bibliotheque(eleve_id);
CREATE INDEX IF NOT EXISTS idx_emprunts_livre ON emprunts_bibliotheque(livre_id);
CREATE INDEX IF NOT EXISTS idx_ventes_article ON ventes_librairie(article_id);
CREATE INDEX IF NOT EXISTS idx_paiements_salaires_personnel ON paiements_salaires(personnel_id);
CREATE INDEX IF NOT EXISTS idx_reservations_cantine_eleve ON reservations_cantine(eleve_id);
CREATE INDEX IF NOT EXISTS idx_reservations_cantine_date ON reservations_cantine(date);
CREATE INDEX IF NOT EXISTS idx_transactions_cantine_eleve ON transactions_cantine(eleve_id);
CREATE INDEX idx_reinscriptions_eleve ON reinscriptions(eleve_id);
CREATE INDEX idx_reinscriptions_annee ON reinscriptions(annee_scolaire_id);
CREATE INDEX idx_reinscriptions_statut ON reinscriptions(statut);
CREATE INDEX idx_reinscriptions_numero_dossier ON reinscriptions(numero_dossier);

-- Créer les index pour depenses
CREATE INDEX IF NOT EXISTS idx_depenses_date ON depenses(date_depense);
CREATE INDEX IF NOT EXISTS idx_depenses_categorie ON depenses(categorie);
CREATE INDEX IF NOT EXISTS idx_depenses_annee_mois ON depenses(exercice_annee, exercice_mois);

-- ============================================
-- INITIALISATION ANNÉE SCOLAIRE
-- ============================================

INSERT INTO annees_scolaires (libelle, date_debut, date_fin, est_active)
SELECT '2025-2026', '2025-10-01', '2026-06-30', true
WHERE NOT EXISTS (SELECT 1 FROM annees_scolaires WHERE libelle = '2025-2026');

-- ============================================
-- CRÉATION ADMIN
-- ============================================

-- Mot de passe hashé pour 'admin123'
INSERT INTO utilisateurs (email, password, prenom, nom, role, est_actif)
SELECT 'admin@eief.com', 
       '$2b$10$Cl.LbpccIdc1.rBfxmuvGuhrvsgOasr/kus9dyvifHCojG8ZiPR72',
       'Super', 'Admin', 'SUPER_ADMIN', true
WHERE NOT EXISTS (SELECT 1 FROM utilisateurs WHERE email = 'admin@eief.com');

-- ============================================
-- CRÉATION PARENT TEST
-- ============================================

INSERT INTO utilisateurs (email, password, prenom, nom, role, est_actif)
SELECT 'parent@eief.com', 
       '$2b$10$Cl.LbpccIdc1.rBfxmuvGuhrvsgOasr/kus9dyvifHCojG8ZiPR72',
       'Jean', 'Parent', 'PARENT', true
WHERE NOT EXISTS (SELECT 1 FROM utilisateurs WHERE email = 'parent@eief.com');

-- ============================================
-- CRÉATION ÉLÈVE TEST
-- ============================================

INSERT INTO utilisateurs (email, password, prenom, nom, role, est_actif)
SELECT 'eleve@eief.com', 
       '$2b$10$Cl.LbpccIdc1.rBfxmuvGuhrvsgOasr/kus9dyvifHCojG8ZiPR72',
       'Marie', 'Eleve', 'ELEVE', true
WHERE NOT EXISTS (SELECT 1 FROM utilisateurs WHERE email = 'eleve@eief.com');

-- ============================================
-- CRÉATION ENSEIGNANT TEST
-- ============================================

INSERT INTO utilisateurs (email, password, prenom, nom, role, est_actif)
SELECT 'professeur@eief.com', 
       '$2b$10$Cl.LbpccIdc1.rBfxmuvGuhrvsgOasr/kus9dyvifHCojG8ZiPR72',
       'Pierre', 'Enseignant', 'ENSEIGNANT', true
WHERE NOT EXISTS (SELECT 1 FROM utilisateurs WHERE email = 'professeur@eief.com');;

-- ============================================
-- CRÉATION COMPTABLE TEST
-- ============================================

INSERT INTO utilisateurs (email, password, prenom, nom, role, est_actif)
SELECT 'comptable@eief.com', 
       '$2b$10$Cl.LbpccIdc1.rBfxmuvGuhrvsgOasr/kus9dyvifHCojG8ZiPR72',
       'Claire', 'Comptable', 'COMPTABLE', true
WHERE NOT EXISTS (SELECT 1 FROM utilisateurs WHERE email = 'comptable@eief.com');

-- ============================================
-- CRÉATION DIRECTEUR TEST
-- ============================================

INSERT INTO utilisateurs (email, password, prenom, nom, role, est_actif)
SELECT 'directeur@eief.com', 
       '$2b$10$Cl.LbpccIdc1.rBfxmuvGuhrvsgOasr/kus9dyvifHCojG8ZiPR72',
       'Paul', 'Directeur', 'DIRECTEUR_GENERAL', true
WHERE NOT EXISTS (SELECT 1 FROM utilisateurs WHERE email = 'directeur@eief.com');

-- ============================================
-- CRÉATION CHAUFFEUR TEST
-- ============================================

INSERT INTO utilisateurs (email, password, prenom, nom, role, est_actif)
SELECT 'transport@eief.com', 
       '$2b$10$Cl.LbpccIdc1.rBfxmuvGuhrvsgOasr/kus9dyvifHCojG8ZiPR72',
       'Amadou', 'Camara', 'ADMIN_TRANSPORT', true
WHERE NOT EXISTS (SELECT 1 FROM utilisateurs WHERE email = 'transport@eief.com');

-- ============================================
-- CRÉATION CANTINE TEST
-- ============================================

INSERT INTO utilisateurs (email, password, prenom, nom, role, est_actif)
SELECT 'cantine@eief.com', 
       '$2b$10$Cl.LbpccIdc1.rBfxmuvGuhrvsgOasr/kus9dyvifHCojG8ZiPR72',
       'Aissatou', 'Kane', 'ADMIN_CANTINE', true
WHERE NOT EXISTS (SELECT 1 FROM utilisateurs WHERE email = 'cantine@eief.com');


-- ============================================
-- CRÉATION LIBRAIRIE TEST

INSERT INTO utilisateurs (email, password, prenom, nom, role, est_actif)
SELECT 'librairie@eief.com', 
       '$2b$10$Cl.LbpccIdc1.rBfxmuvGuhrvsgOasr/kus9dyvifHCojG8ZiPR72',
       'Fatou', 'Diop', 'ADMIN_LIBRAIRIE', true
WHERE NOT EXISTS (SELECT 1 FROM utilisateurs WHERE email = 'librairie@eief.com');

-- ============================================
-- CREATION BIBLIOTHECAIRE TEST
-- ============================================

INSERT INTO utilisateurs (email, password, prenom, nom, role, est_actif)
SELECT 'bibliotheque@eief.com', 
       '$2b$10$Cl.LbpccIdc1.rBfxmuvGuhrvsgOasr/kus9dyvifHCojG8ZiPR72',
       'Mamadou', 'Diallo', 'ADMIN_BIBLIOTHEQUE', true
WHERE NOT EXISTS (SELECT 1 FROM utilisateurs WHERE email = 'bibliotheque@eief.com');
-- ============================================
-- AFFICHAGE DES UTILISATEURS CRÉÉS
-- ============================================

SELECT id, email, nom, prenom, role FROM utilisateurs;

-- ============================================
-- FIN DU SCRIPT
-- ============================================