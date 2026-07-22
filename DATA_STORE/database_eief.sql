-- ============================================
-- SCRIPT COMPLET POUR EIFE_PROD - VERSION CORRIGÉE
-- ============================================

-- ============================================
-- 1. CRÉER LES TYPES (ENUM) - AVEC VÉRIFICATION
-- ============================================

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Role') THEN
        CREATE TYPE public."Role" AS ENUM (
            'SUPER_ADMIN',
            'COMPTABLE',
            'ENSEIGNANT',
            'PARENT',
            'ELEVE',
            'ADMIN_CANTINE',
            'ADMIN_TRANSPORT',
            'ADMIN_BIBLIOTHEQUE',
            'ADMIN_LIBRAIRIE'
        );
    END IF;
END $$;

-- ============================================
-- 2. CRÉER LES TABLES - AVEC VÉRIFICATION
-- ============================================

-- 2.1 Années scolaires
CREATE TABLE IF NOT EXISTS public.annees_scolaires (
    id SERIAL PRIMARY KEY,
    libelle VARCHAR(20) NOT NULL,
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    est_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2.2 Utilisateurs
CREATE TABLE IF NOT EXISTS public.utilisateurs (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    nom VARCHAR(100) NOT NULL,
    telephone VARCHAR(20),
    adresse TEXT,
    photo_url TEXT,
    role VARCHAR(50) NOT NULL,
    est_actif BOOLEAN DEFAULT true,
    derniere_connexion TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT utilisateurs_role_check CHECK (role IN ('SUPER_ADMIN','COMPTABLE','ADMIN_CANTINE','ADMIN_TRANSPORT','ADMIN_BIBLIOTHEQUE','ENSEIGNANT','PARENT','ELEVE','ADMIN_LIBRAIRIE'))
);

-- 2.3 Parents
CREATE TABLE IF NOT EXISTS public.parents (
    id SERIAL PRIMARY KEY,
    utilisateur_id INTEGER UNIQUE,
    profession VARCHAR(100),
    situation_matrimoniale VARCHAR(100)
);

-- 2.4 Classes
CREATE TABLE IF NOT EXISTS public.classes (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(50) NOT NULL,
    niveau VARCHAR(50) NOT NULL,
    salle VARCHAR(50),
    capacite_max INTEGER DEFAULT 30,
    titulaire_id INTEGER,
    code_acces VARCHAR(20),
    frais_inscription INTEGER DEFAULT 0,
    annee_scolaire_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    premier_versement INTEGER DEFAULT 0,
    deuxieme_versement INTEGER DEFAULT 0,
    troisieme_versement INTEGER DEFAULT 0,
    total_versement INTEGER DEFAULT 0,
    reinscription_premier_versement INTEGER DEFAULT 0,
    reinscription_deuxieme_versement INTEGER DEFAULT 0,
    reinscription_troisieme_versement INTEGER DEFAULT 0,
    reinscription_total_versement INTEGER DEFAULT 0
);

-- 2.5 Élèves
CREATE TABLE IF NOT EXISTS public.eleves (
    id SERIAL PRIMARY KEY,
    utilisateur_id INTEGER UNIQUE,
    matricule VARCHAR(50) NOT NULL UNIQUE,
    date_naissance DATE NOT NULL,
    lieu_naissance VARCHAR(100),
    sexe VARCHAR(1),
    nationalite VARCHAR(50) DEFAULT 'Guinéenne',
    classe_id INTEGER,
    date_inscription DATE DEFAULT CURRENT_DATE,
    est_inscrit BOOLEAN DEFAULT true,
    carte_scolaire_url TEXT,
    photo_url TEXT,
    CONSTRAINT eleves_sexe_check CHECK (sexe IN ('M','F'))
);

-- 2.6 Liens parents-élèves
CREATE TABLE IF NOT EXISTS public.lien_parent_eleve (
    parent_id INTEGER NOT NULL,
    eleve_id INTEGER NOT NULL,
    lien VARCHAR(50) DEFAULT 'parent',
    PRIMARY KEY (parent_id, eleve_id)
);

-- 2.7 Matières
CREATE TABLE IF NOT EXISTS public.matieres (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    coefficient INTEGER DEFAULT 1,
    description TEXT
);

-- 2.8 Personnels
CREATE TABLE IF NOT EXISTS public.personnels (
    id SERIAL PRIMARY KEY,
    utilisateur_id INTEGER UNIQUE,
    matricule_personnel VARCHAR(50) NOT NULL UNIQUE,
    type VARCHAR(50),
    date_embauche DATE DEFAULT CURRENT_DATE,
    salaire_base INTEGER,
    carte_personnel_url TEXT,
    carte_id_url TEXT,
    cv_url TEXT,
    certificat_residence_url TEXT,
    statut VARCHAR(20) DEFAULT 'actif',
    departement VARCHAR(100),
    prime_mensuelle INTEGER DEFAULT 0,
    mode_paiement_salaire VARCHAR(50) DEFAULT 'virement',
    CONSTRAINT personnels_statut_check CHECK (statut IN ('actif','inactif','conge')),
    CONSTRAINT personnels_type_check CHECK (type IN ('enseignant','admin_cantine','admin_transport','admin_bibliotheque','admin_librairie','comptable'))
);

-- 2.9 Enseignements
CREATE TABLE IF NOT EXISTS public.enseignements (
    id SERIAL PRIMARY KEY,
    enseignant_id INTEGER,
    classe_id INTEGER,
    matiere_id INTEGER,
    heures_semaine NUMERIC(5,2),
    heures_mois NUMERIC(5,2),
    heures_an NUMERIC(5,2),
    annee_scolaire_id INTEGER
);

-- 2.10 Examens
CREATE TABLE IF NOT EXISTS public.examens (
    id SERIAL PRIMARY KEY,
    enseignement_id INTEGER,
    titre VARCHAR(255) NOT NULL,
    duree_minutes INTEGER,
    date_debut TIMESTAMP,
    date_fin TIMESTAMP,
    est_actif BOOLEAN DEFAULT true,
    fichier_url TEXT
);

-- 2.11 Examens_eleves
CREATE TABLE IF NOT EXISTS public.examens_eleves (
    id SERIAL PRIMARY KEY,
    examen_id INTEGER NOT NULL,
    eleve_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT now(),
    UNIQUE (examen_id, eleve_id)
);

-- 2.12 Questions QCM
CREATE TABLE IF NOT EXISTS public.questions_qcm (
    id SERIAL PRIMARY KEY,
    examen_id INTEGER,
    question TEXT NOT NULL,
    points INTEGER DEFAULT 1,
    ordre INTEGER
);

-- 2.13 Options QCM
CREATE TABLE IF NOT EXISTS public.options_qcm (
    id SERIAL PRIMARY KEY,
    question_id INTEGER,
    option_texte TEXT NOT NULL,
    est_correcte BOOLEAN DEFAULT false
);

-- 2.14 Reponses_eleves_qcm
CREATE TABLE IF NOT EXISTS public.reponses_eleves_qcm (
    id SERIAL PRIMARY KEY,
    examen_id INTEGER,
    eleve_id INTEGER,
    question_id INTEGER,
    option_id INTEGER,
    date_reponse TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2.15 Devoirs
CREATE TABLE IF NOT EXISTS public.devoirs (
    id SERIAL PRIMARY KEY,
    enseignement_id INTEGER,
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    fichier_url TEXT,
    date_limite DATE NOT NULL,
    date_publication DATE DEFAULT CURRENT_DATE
);

-- 2.16 Soumissions_devoirs
CREATE TABLE IF NOT EXISTS public.soumissions_devoirs (
    id SERIAL PRIMARY KEY,
    devoir_id INTEGER,
    eleve_id INTEGER,
    fichier_url TEXT,
    date_soumission TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    note NUMERIC(5,2),
    commentaire TEXT,
    est_retard BOOLEAN DEFAULT false
);

-- 2.17 Leçons
CREATE TABLE IF NOT EXISTS public.lecons (
    id SERIAL PRIMARY KEY,
    enseignement_id INTEGER,
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    contenu TEXT,
    fichier_url TEXT,
    video_url TEXT,
    date_publication DATE DEFAULT CURRENT_DATE
);

-- 2.18 Présences
CREATE TABLE IF NOT EXISTS public.presences (
    id SERIAL PRIMARY KEY,
    eleve_id INTEGER,
    classe_id INTEGER,
    date DATE NOT NULL,
    statut VARCHAR(20),
    heure_arrivee TIME,
    justificatif_url TEXT,
    enseignant_id INTEGER,
    CONSTRAINT presences_statut_check CHECK (statut IN ('present','absent','retard','justifie'))
);

-- 2.19 Notes
CREATE TABLE IF NOT EXISTS public.notes (
    id SERIAL PRIMARY KEY,
    eleve_id INTEGER,
    enseignement_id INTEGER,
    type_note VARCHAR(50),
    valeur NUMERIC(5,2) NOT NULL,
    coefficient INTEGER DEFAULT 1,
    date_saisie DATE DEFAULT CURRENT_DATE,
    commentaire TEXT,
    enseignant_id INTEGER,
    CONSTRAINT notes_type_note_check CHECK (type_note IN ('devoir','composition','examen'))
);

-- 2.20 Quiz
CREATE TABLE IF NOT EXISTS public.quiz (
    id SERIAL PRIMARY KEY,
    enseignement_id INTEGER,
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'qcm',
    duree_minutes INTEGER DEFAULT 10,
    est_actif BOOLEAN DEFAULT true,
    date_debut TIMESTAMP,
    date_fin TIMESTAMP,
    est_aleatoire BOOLEAN DEFAULT false,
    afficher_resultats BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT now(),
    fichier_url TEXT
);

-- 2.21 Categories_quiz
CREATE TABLE IF NOT EXISTS public.categories_quiz (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    couleur VARCHAR(7) DEFAULT '#6B46C1',
    icon VARCHAR(50) DEFAULT 'BookOpen',
    est_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT now()
);

-- 2.22 Questions_quiz
CREATE TABLE IF NOT EXISTS public.questions_quiz (
    id SERIAL PRIMARY KEY,
    categorie_id INTEGER,
    enseignement_id INTEGER,
    question TEXT NOT NULL,
    explication TEXT,
    difficulte VARCHAR(20) DEFAULT 'facile',
    points INTEGER DEFAULT 1,
    temps_secondes INTEGER DEFAULT 30,
    est_active BOOLEAN DEFAULT true,
    ordre INTEGER,
    created_at TIMESTAMP DEFAULT now(),
    created_by INTEGER
);

-- 2.23 Options_quiz
CREATE TABLE IF NOT EXISTS public.options_quiz (
    id SERIAL PRIMARY KEY,
    question_id INTEGER,
    option_texte TEXT NOT NULL,
    est_correcte BOOLEAN DEFAULT false,
    ordre INTEGER
);

-- 2.24 Quiz_questions
CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id SERIAL PRIMARY KEY,
    quiz_id INTEGER,
    question_id INTEGER,
    ordre INTEGER,
    points_personnalises INTEGER,
    UNIQUE (quiz_id, question_id)
);

-- 2.25 Participations_quiz
CREATE TABLE IF NOT EXISTS public.participations_quiz (
    id SERIAL PRIMARY KEY,
    quiz_id INTEGER,
    eleve_id INTEGER,
    date_debut TIMESTAMP DEFAULT now(),
    date_fin TIMESTAMP,
    score_total INTEGER DEFAULT 0,
    points_obtenus INTEGER DEFAULT 0,
    reponses_correctes INTEGER DEFAULT 0,
    reponses_totales INTEGER DEFAULT 0,
    pourcentage NUMERIC(5,2) DEFAULT 0,
    est_termine BOOLEAN DEFAULT false,
    UNIQUE (quiz_id, eleve_id)
);

-- 2.26 Reponses_quiz
CREATE TABLE IF NOT EXISTS public.reponses_quiz (
    id SERIAL PRIMARY KEY,
    participation_id INTEGER,
    question_id INTEGER,
    option_id INTEGER,
    est_correcte BOOLEAN DEFAULT false,
    temps_reponse_ms INTEGER,
    date_reponse TIMESTAMP DEFAULT now()
);

-- 2.27 Préinscriptions
CREATE TABLE IF NOT EXISTS public.preinscriptions (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER,
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
    statut VARCHAR(50) DEFAULT 'en_attente',
    numero_dossier VARCHAR(50) UNIQUE,
    date_preinscription TIMESTAMP DEFAULT now(),
    observations TEXT,
    traite_par INTEGER,
    date_traitement TIMESTAMP,
    frais_montant INTEGER DEFAULT 0,
    frais_statut VARCHAR(20) DEFAULT 'non_paye',
    frais_mode_paiement VARCHAR(50),
    frais_reference VARCHAR(100),
    frais_date_paiement TIMESTAMP,
    plan_paiement_id INTEGER,
    montant_total_plan INTEGER DEFAULT 0,
    montant_restant_plan INTEGER DEFAULT 0,
    type_inscription VARCHAR(50) DEFAULT 'inscription',
    est_reinscription BOOLEAN DEFAULT false,
    CONSTRAINT preinscriptions_statut_check CHECK (statut IN ('en_attente','valide','rejete')),
    CONSTRAINT preinscriptions_frais_statut_check CHECK (frais_statut IN ('non_paye','paye','partiel'))
);

-- 2.28 Commandes_fournitures
CREATE TABLE IF NOT EXISTS public.commandes_fournitures (
    id SERIAL PRIMARY KEY,
    preinscription_id INTEGER,
    article_id INTEGER,
    quantite INTEGER DEFAULT 1 NOT NULL,
    prix_unitaire INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);

-- 2.29 Preinscription_cantine
CREATE TABLE IF NOT EXISTS public.preinscription_cantine (
    id SERIAL PRIMARY KEY,
    preinscription_id INTEGER,
    menu_id INTEGER,
    prix INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);

-- 2.30 Preinscription_transport
CREATE TABLE IF NOT EXISTS public.preinscription_transport (
    id SERIAL PRIMARY KEY,
    preinscription_id INTEGER,
    ligne_id INTEGER,
    prix INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);

-- 2.31 Inscriptions
CREATE TABLE IF NOT EXISTS public.inscriptions (
    id SERIAL PRIMARY KEY,
    preinscription_id INTEGER,
    eleve_id INTEGER,
    parent_id INTEGER,
    numero_matricule VARCHAR(50) NOT NULL UNIQUE,
    date_inscription DATE DEFAULT CURRENT_DATE,
    annee_scolaire_id INTEGER,
    statut VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    CONSTRAINT inscriptions_statut_check CHECK (statut IN ('active','terminee','suspendue'))
);

-- 2.32 Réinscriptions
CREATE TABLE IF NOT EXISTS public.reinscriptions (
    id SERIAL PRIMARY KEY,
    inscription_id INTEGER,
    eleve_id INTEGER,
    parent_id INTEGER,
    annee_scolaire_id INTEGER,
    classe_id INTEGER,
    montant_frais INTEGER DEFAULT 500000,
    frais_statut VARCHAR(50) DEFAULT 'non_paye',
    frais_mode_paiement VARCHAR(50),
    frais_reference VARCHAR(100),
    frais_date_paiement TIMESTAMP,
    statut VARCHAR(50) DEFAULT 'en_attente',
    date_reinscription TIMESTAMP DEFAULT now(),
    observations TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    acte_naissance_url TEXT,
    photo_url TEXT,
    bulletin_url TEXT,
    date_traitement TIMESTAMP,
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
    parent_telephone VARCHAR(20),
    montant_total_plan INTEGER DEFAULT 0,
    montant_restant_plan INTEGER DEFAULT 0,
    CONSTRAINT reinscriptions_statut_check CHECK (statut IN ('en_attente','valide','rejete'))
);

-- 2.33 Échéances paiement
CREATE TABLE IF NOT EXISTS public.echeances_paiement (
    id SERIAL PRIMARY KEY,
    preinscription_id INTEGER,
    reinscription_id INTEGER,
    type VARCHAR(50) NOT NULL,
    echeance VARCHAR(50) NOT NULL,
    montant INTEGER NOT NULL,
    date_echeance DATE,
    statut VARCHAR(20) DEFAULT 'en_attente',
    date_paiement DATE,
    reference_transaction VARCHAR(100),
    mode_paiement VARCHAR(50),
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- 2.34 Paiements
CREATE TABLE IF NOT EXISTS public.paiements (
    id SERIAL PRIMARY KEY,
    eleve_id INTEGER,
    montant INTEGER NOT NULL,
    type_frais VARCHAR(50),
    mois INTEGER,
    annee INTEGER,
    mode_paiement VARCHAR(50),
    reference_transaction VARCHAR(100),
    statut VARCHAR(20) DEFAULT 'valide',
    date_paiement DATE DEFAULT CURRENT_DATE,
    "reçu_url" TEXT,
    saisie_par INTEGER,
    preinscription_id INTEGER,
    reinscription_id INTEGER,
    CONSTRAINT paiements_statut_check CHECK (statut IN ('valide','paye','en_attente','annule')),
    CONSTRAINT paiements_mode_paiement_check CHECK (mode_paiement IN ('mobile_money','especes','carte'))
);

-- 2.35 Paiements_salaires
CREATE TABLE IF NOT EXISTS public.paiements_salaires (
    id SERIAL PRIMARY KEY,
    personnel_id INTEGER,
    montant INTEGER NOT NULL,
    mois INTEGER NOT NULL,
    annee INTEGER NOT NULL,
    mode_paiement VARCHAR(50),
    reference_transaction VARCHAR(100),
    saisie_par INTEGER,
    statut VARCHAR(20) DEFAULT 'paye',
    date_paiement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    note TEXT,
    UNIQUE (personnel_id, mois, annee),
    CONSTRAINT paiements_salaires_statut_check CHECK (statut IN ('paye','en_attente','annule'))
);

-- 2.36 Avances_salaires
CREATE TABLE IF NOT EXISTS public.avances_salaires (
    id SERIAL PRIMARY KEY,
    personnel_id INTEGER NOT NULL,
    montant INTEGER NOT NULL,
    motif TEXT,
    date_avance TIMESTAMP DEFAULT now(),
    mois_deduction INTEGER NOT NULL,
    annee_deduction INTEGER NOT NULL,
    statut VARCHAR(20) DEFAULT 'accorde',
    accorde_par INTEGER,
    created_at TIMESTAMP DEFAULT now(),
    CONSTRAINT avances_salaires_statut_check CHECK (statut IN ('accorde','rembourse','annule'))
);

-- 2.37 Conges_personnel
CREATE TABLE IF NOT EXISTS public.conges_personnel (
    id SERIAL PRIMARY KEY,
    personnel_id INTEGER NOT NULL,
    type_conge VARCHAR(50) DEFAULT 'annuel' NOT NULL,
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    nombre_jours INTEGER,
    motif TEXT,
    statut VARCHAR(20) DEFAULT 'en_attente',
    approuve_par INTEGER,
    date_approbation TIMESTAMP,
    created_at TIMESTAMP DEFAULT now(),
    CONSTRAINT conges_personnel_statut_check CHECK (statut IN ('en_attente','approuve','refuse','annule')),
    CONSTRAINT conges_personnel_type_conge_check CHECK (type_conge IN ('annuel','maladie','maternite','paternite','sans_solde','exceptionnel'))
);

-- 2.38 Contrats_personnel
CREATE TABLE IF NOT EXISTS public.contrats_personnel (
    id SERIAL PRIMARY KEY,
    personnel_id INTEGER NOT NULL,
    type_contrat VARCHAR(50) DEFAULT 'CDI' NOT NULL,
    date_debut DATE NOT NULL,
    date_fin DATE,
    salaire_brut INTEGER NOT NULL,
    salaire_net INTEGER NOT NULL,
    heures_semaine NUMERIC(5,2) DEFAULT 40,
    conges_annuels INTEGER DEFAULT 25,
    observations TEXT,
    is_actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    CONSTRAINT contrats_personnel_type_contrat_check CHECK (type_contrat IN ('CDI','CDD','Vacataire','Stage','Consultant'))
);

-- 2.39 Catégories dépenses
CREATE TABLE IF NOT EXISTS public.categories_depenses (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    libelle VARCHAR(100) NOT NULL,
    type VARCHAR(10) DEFAULT 'sortie' NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT now(),
    CONSTRAINT categories_depenses_type_check CHECK (type IN ('entree','sortie'))
);

-- 2.40 Dépenses
CREATE TABLE IF NOT EXISTS public.depenses (
    id SERIAL PRIMARY KEY,
    categorie VARCHAR(100) NOT NULL,
    montant INTEGER NOT NULL,
    description TEXT,
    date_depense TIMESTAMP DEFAULT now(),
    sous_categorie VARCHAR(100),
    reference VARCHAR(100),
    fournisseur VARCHAR(200),
    numero_recu VARCHAR(100),
    saisi_par INTEGER,
    valide_par INTEGER,
    statut VARCHAR(20) DEFAULT 'valide',
    exercice_annee INTEGER DEFAULT EXTRACT(YEAR FROM now()),
    exercice_mois INTEGER DEFAULT EXTRACT(MONTH FROM now()),
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    CONSTRAINT depenses_statut_check CHECK (statut IN ('valide','annule','en_attente'))
);

-- 2.41 Mouvements caisse
CREATE TABLE IF NOT EXISTS public.mouvements_caisse (
    id SERIAL PRIMARY KEY,
    type VARCHAR(10) NOT NULL,
    montant INTEGER NOT NULL,
    categorie VARCHAR(100) NOT NULL,
    sous_categorie VARCHAR(100),
    description TEXT,
    reference VARCHAR(100),
    date_mouvement TIMESTAMP DEFAULT now() NOT NULL,
    exercice_annee INTEGER DEFAULT EXTRACT(YEAR FROM now()) NOT NULL,
    exercice_mois INTEGER DEFAULT EXTRACT(MONTH FROM now()) NOT NULL,
    saisi_par INTEGER,
    valide_par INTEGER,
    statut VARCHAR(20) DEFAULT 'valide',
    recu_url TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    CONSTRAINT mouvements_caisse_type_check CHECK (type IN ('entree','sortie')),
    CONSTRAINT mouvements_caisse_statut_check CHECK (statut IN ('valide','annule','en_attente'))
);

-- 2.42 Budget prévisionnel
CREATE TABLE IF NOT EXISTS public.budget_previsionnel (
    id SERIAL PRIMARY KEY,
    annee INTEGER NOT NULL,
    categorie_code VARCHAR(20) NOT NULL,
    montant_prevu INTEGER DEFAULT 0 NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    UNIQUE (annee, categorie_code)
);

-- 2.43 Services annexes
CREATE TABLE IF NOT EXISTS public.services_annexes (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL UNIQUE,
    montant_mensuel INTEGER NOT NULL,
    type VARCHAR(50) DEFAULT 'optionnel',
    description TEXT,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2.44 Annonces
CREATE TABLE IF NOT EXISTS public.annonces (
    id SERIAL PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    contenu TEXT NOT NULL,
    cible VARCHAR(50) DEFAULT 'tous',
    type VARCHAR(50) DEFAULT 'information',
    classe_id INTEGER,
    image_url TEXT,
    date_publication TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP,
    date_programmee TIMESTAMP,
    publie_par INTEGER,
    CONSTRAINT annonces_cible_check CHECK (cible IN ('tous','classe','parent','enseignant'))
);

-- 2.45 Messages
CREATE TABLE IF NOT EXISTS public.messages (
    id SERIAL PRIMARY KEY,
    expediteur_id INTEGER,
    destinataire_id INTEGER,
    sujet VARCHAR(255),
    contenu TEXT,
    est_lu BOOLEAN DEFAULT false,
    date_envoi TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2.46 Logs_activites
CREATE TABLE IF NOT EXISTS public.logs_activites (
    id SERIAL PRIMARY KEY,
    utilisateur_id INTEGER,
    action VARCHAR(255),
    details TEXT,
    ip_address VARCHAR(45),
    date_action TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2.47 Sessions
CREATE TABLE IF NOT EXISTS public.sessions (
    id SERIAL PRIMARY KEY,
    utilisateur_id INTEGER,
    token VARCHAR(255) NOT NULL UNIQUE,
    expire_le TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2.48 Reset tokens
CREATE TABLE IF NOT EXISTS public.reset_tokens (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT now(),
    used BOOLEAN DEFAULT false,
    UNIQUE (email)
);

-- 2.49 Frais_scolaires
CREATE TABLE IF NOT EXISTS public.frais_scolaires (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100),
    type_frais VARCHAR(50) NOT NULL,
    montant INTEGER NOT NULL,
    obligatoire BOOLEAN DEFAULT true,
    frequence VARCHAR(50) DEFAULT 'mensuel',
    niveau VARCHAR(50),
    annee_scolaire_id INTEGER,
    description TEXT
);

-- 2.50 Articles librairie
CREATE TABLE IF NOT EXISTS public.articles_librairie (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    prix_unitaire INTEGER NOT NULL,
    quantite_stock INTEGER DEFAULT 0,
    categorie VARCHAR(100) DEFAULT 'fourniture',
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2.51 Commandes librairie
CREATE TABLE IF NOT EXISTS public.commandes_librairie (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER,
    numero_commande VARCHAR(50) NOT NULL UNIQUE,
    date_commande TIMESTAMP DEFAULT now(),
    statut VARCHAR(20) DEFAULT 'en_attente',
    total INTEGER NOT NULL,
    observations TEXT,
    date_traitement TIMESTAMP,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    CONSTRAINT commandes_librairie_statut_check CHECK (statut IN ('en_attente','valide','rejete'))
);

-- 2.52 Commandes librairie articles
CREATE TABLE IF NOT EXISTS public.commandes_librairie_articles (
    id SERIAL PRIMARY KEY,
    commande_id INTEGER,
    article_id INTEGER,
    quantite INTEGER NOT NULL,
    prix_unitaire INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);

-- 2.53 Ventes librairie
CREATE TABLE IF NOT EXISTS public.ventes_librairie (
    id SERIAL PRIMARY KEY,
    article_id INTEGER,
    eleve_id INTEGER,
    quantite INTEGER DEFAULT 1 NOT NULL,
    montant_total INTEGER NOT NULL,
    date_vente TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    vendu_par INTEGER
);

-- 2.54 Bus
CREATE TABLE IF NOT EXISTS public.bus (
    id SERIAL PRIMARY KEY,
    immatriculation VARCHAR(50) NOT NULL UNIQUE,
    capacite INTEGER,
    chauffeur_nom VARCHAR(100),
    chauffeur_tel VARCHAR(20)
);

-- 2.55 Lignes transport
CREATE TABLE IF NOT EXISTS public.lignes_transport (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100),
    bus_id INTEGER,
    horaire_matin TIME,
    horaire_soir TIME,
    prix_abonnement INTEGER
);

-- 2.56 Inscriptions transport
CREATE TABLE IF NOT EXISTS public.inscriptions_transport (
    id SERIAL PRIMARY KEY,
    eleve_id INTEGER,
    ligne_id INTEGER,
    date_debut DATE,
    date_fin DATE,
    est_actif BOOLEAN DEFAULT true
);

-- 2.57 Présences transport
CREATE TABLE IF NOT EXISTS public.presences_transport (
    id SERIAL PRIMARY KEY,
    eleve_id INTEGER NOT NULL,
    date DATE NOT NULL,
    statut VARCHAR(20) NOT NULL,
    heure_arrivee TIME,
    commentaire TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (eleve_id, date),
    CONSTRAINT presences_transport_statut_check CHECK (statut IN ('present','absent','retard'))
);

-- 2.58 Inscriptions cantine
CREATE TABLE IF NOT EXISTS public.inscriptions_cantine (
    id SERIAL PRIMARY KEY,
    eleve_id INTEGER,
    est_actif BOOLEAN DEFAULT true,
    solde NUMERIC(12,2) DEFAULT 0,
    preferences_alimentaires TEXT,
    allergies TEXT,
    date_inscription DATE DEFAULT CURRENT_DATE
);

-- 2.59 Menus cantine
CREATE TABLE IF NOT EXISTS public.menus_cantine (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    plat VARCHAR(255),
    accompagnement VARCHAR(255),
    dessert VARCHAR(255),
    prix NUMERIC(10,2) DEFAULT 5000,
    allergenes TEXT,
    calories INTEGER,
    regime_special BOOLEAN DEFAULT false
);

-- 2.60 Cantine menus (ancienne version)
CREATE TABLE IF NOT EXISTS public.cantine_menus (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    plat VARCHAR(255),
    accompagnement VARCHAR(255),
    dessert VARCHAR(255),
    regime_special BOOLEAN DEFAULT false,
    prix INTEGER,
    prix_annuel INTEGER
);

-- 2.61 Réservations cantine
CREATE TABLE IF NOT EXISTS public.reservations_cantine (
    id SERIAL PRIMARY KEY,
    eleve_id INTEGER,
    menu_id INTEGER,
    date DATE NOT NULL,
    statut VARCHAR(20) DEFAULT 'confirmee',
    paye BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT reservations_cantine_statut_check CHECK (statut IN ('confirmee','annulee','en_attente'))
);

-- 2.62 Reserves cantine
CREATE TABLE IF NOT EXISTS public.reserves_cantine (
    id SERIAL PRIMARY KEY,
    eleve_id INTEGER,
    date DATE NOT NULL,
    est_present BOOLEAN DEFAULT false,
    date_reservation DATE DEFAULT CURRENT_DATE
);

-- 2.63 Transactions cantine
CREATE TABLE IF NOT EXISTS public.transactions_cantine (
    id SERIAL PRIMARY KEY,
    eleve_id INTEGER,
    montant NUMERIC(12,2) NOT NULL,
    type VARCHAR(20),
    description TEXT,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT transactions_cantine_type_check CHECK (type IN ('credit','debit'))
);

-- 2.64 Livres bibliothèque
CREATE TABLE IF NOT EXISTS public.livres_bibliotheque (
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

-- 2.65 Emprunts bibliothèque
CREATE TABLE IF NOT EXISTS public.emprunts_bibliotheque (
    id SERIAL PRIMARY KEY,
    livre_id INTEGER,
    eleve_id INTEGER,
    date_emprunt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_retour_prevue TIMESTAMP NOT NULL,
    date_retour_reelle TIMESTAMP,
    statut VARCHAR(20) DEFAULT 'en_cours',
    CONSTRAINT emprunts_bibliotheque_statut_check CHECK (statut IN ('en_cours','retourne','en_retard'))
);

-- ============================================
-- 3. AJOUTER LES CLÉS ÉTRANGÈRES (après création des tables)
-- ============================================

-- Classes
ALTER TABLE public.classes ADD CONSTRAINT classes_annee_scolaire_id_fkey FOREIGN KEY (annee_scolaire_id) REFERENCES annees_scolaires(id) ON DELETE SET NULL;
ALTER TABLE public.classes ADD CONSTRAINT classes_titulaire_id_fkey FOREIGN KEY (titulaire_id) REFERENCES personnels(id) ON DELETE SET NULL;

-- Parents
ALTER TABLE public.parents ADD CONSTRAINT parents_utilisateur_id_fkey FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE;

-- Élèves
ALTER TABLE public.eleves ADD CONSTRAINT eleves_utilisateur_id_fkey FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE;
ALTER TABLE public.eleves ADD CONSTRAINT eleves_classe_id_fkey FOREIGN KEY (classe_id) REFERENCES classes(id) ON DELETE SET NULL;

-- Liens parents-élèves
ALTER TABLE public.lien_parent_eleve ADD CONSTRAINT lien_parent_eleve_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE;
ALTER TABLE public.lien_parent_eleve ADD CONSTRAINT lien_parent_eleve_eleve_id_fkey FOREIGN KEY (eleve_id) REFERENCES eleves(id) ON DELETE CASCADE;

-- Personnels
ALTER TABLE public.personnels ADD CONSTRAINT personnels_utilisateur_id_fkey FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE;

-- Enseignements
ALTER TABLE public.enseignements ADD CONSTRAINT enseignements_enseignant_id_fkey FOREIGN KEY (enseignant_id) REFERENCES personnels(id) ON DELETE SET NULL;
ALTER TABLE public.enseignements ADD CONSTRAINT enseignements_classe_id_fkey FOREIGN KEY (classe_id) REFERENCES classes(id) ON DELETE SET NULL;
ALTER TABLE public.enseignements ADD CONSTRAINT enseignements_matiere_id_fkey FOREIGN KEY (matiere_id) REFERENCES matieres(id) ON DELETE SET NULL;
ALTER TABLE public.enseignements ADD CONSTRAINT enseignements_annee_scolaire_id_fkey FOREIGN KEY (annee_scolaire_id) REFERENCES annees_scolaires(id) ON DELETE SET NULL;

-- Examens
ALTER TABLE public.examens ADD CONSTRAINT examens_enseignement_id_fkey FOREIGN KEY (enseignement_id) REFERENCES enseignements(id) ON DELETE SET NULL;

-- Examens_eleves
ALTER TABLE public.examens_eleves ADD CONSTRAINT examens_eleves_examen_id_fkey FOREIGN KEY (examen_id) REFERENCES examens(id) ON DELETE CASCADE;
ALTER TABLE public.examens_eleves ADD CONSTRAINT examens_eleves_eleve_id_fkey FOREIGN KEY (eleve_id) REFERENCES eleves(id) ON DELETE CASCADE;

-- Questions QCM
ALTER TABLE public.questions_qcm ADD CONSTRAINT questions_qcm_examen_id_fkey FOREIGN KEY (examen_id) REFERENCES examens(id) ON DELETE CASCADE;

-- Options QCM
ALTER TABLE public.options_qcm ADD CONSTRAINT options_qcm_question_id_fkey FOREIGN KEY (question_id) REFERENCES questions_qcm(id) ON DELETE CASCADE;

-- Reponses_eleves_qcm
ALTER TABLE public.reponses_eleves_qcm ADD CONSTRAINT reponses_eleves_qcm_examen_id_fkey FOREIGN KEY (examen_id) REFERENCES examens(id) ON DELETE CASCADE;
ALTER TABLE public.reponses_eleves_qcm ADD CONSTRAINT reponses_eleves_qcm_eleve_id_fkey FOREIGN KEY (eleve_id) REFERENCES eleves(id) ON DELETE CASCADE;
ALTER TABLE public.reponses_eleves_qcm ADD CONSTRAINT reponses_eleves_qcm_question_id_fkey FOREIGN KEY (question_id) REFERENCES questions_qcm(id) ON DELETE SET NULL;
ALTER TABLE public.reponses_eleves_qcm ADD CONSTRAINT reponses_eleves_qcm_option_id_fkey FOREIGN KEY (option_id) REFERENCES options_qcm(id) ON DELETE SET NULL;

-- Devoirs
ALTER TABLE public.devoirs ADD CONSTRAINT devoirs_enseignement_id_fkey FOREIGN KEY (enseignement_id) REFERENCES enseignements(id) ON DELETE SET NULL;

-- Soumissions_devoirs
ALTER TABLE public.soumissions_devoirs ADD CONSTRAINT soumissions_devoirs_devoir_id_fkey FOREIGN KEY (devoir_id) REFERENCES devoirs(id) ON DELETE CASCADE;
ALTER TABLE public.soumissions_devoirs ADD CONSTRAINT soumissions_devoirs_eleve_id_fkey FOREIGN KEY (eleve_id) REFERENCES eleves(id) ON DELETE CASCADE;

-- Leçons
ALTER TABLE public.lecons ADD CONSTRAINT lecons_enseignement_id_fkey FOREIGN KEY (enseignement_id) REFERENCES enseignements(id) ON DELETE SET NULL;

-- Présences
ALTER TABLE public.presences ADD CONSTRAINT presences_eleve_id_fkey FOREIGN KEY (eleve_id) REFERENCES eleves(id) ON DELETE CASCADE;
ALTER TABLE public.presences ADD CONSTRAINT presences_classe_id_fkey FOREIGN KEY (classe_id) REFERENCES classes(id) ON DELETE SET NULL;
ALTER TABLE public.presences ADD CONSTRAINT presences_enseignant_id_fkey FOREIGN KEY (enseignant_id) REFERENCES personnels(id) ON DELETE SET NULL;

-- Notes
ALTER TABLE public.notes ADD CONSTRAINT notes_eleve_id_fkey FOREIGN KEY (eleve_id) REFERENCES eleves(id) ON DELETE CASCADE;
ALTER TABLE public.notes ADD CONSTRAINT notes_enseignement_id_fkey FOREIGN KEY (enseignement_id) REFERENCES enseignements(id) ON DELETE SET NULL;
ALTER TABLE public.notes ADD CONSTRAINT notes_enseignant_id_fkey FOREIGN KEY (enseignant_id) REFERENCES personnels(id) ON DELETE SET NULL;

-- Quiz
ALTER TABLE public.quiz ADD CONSTRAINT quiz_enseignement_id_fkey FOREIGN KEY (enseignement_id) REFERENCES enseignements(id) ON DELETE SET NULL;

-- Questions_quiz
ALTER TABLE public.questions_quiz ADD CONSTRAINT questions_quiz_categorie_id_fkey FOREIGN KEY (categorie_id) REFERENCES categories_quiz(id) ON DELETE SET NULL;
ALTER TABLE public.questions_quiz ADD CONSTRAINT questions_quiz_enseignement_id_fkey FOREIGN KEY (enseignement_id) REFERENCES enseignements(id) ON DELETE SET NULL;
ALTER TABLE public.questions_quiz ADD CONSTRAINT questions_quiz_created_by_fkey FOREIGN KEY (created_by) REFERENCES utilisateurs(id) ON DELETE SET NULL;

-- Options_quiz
ALTER TABLE public.options_quiz ADD CONSTRAINT options_quiz_question_id_fkey FOREIGN KEY (question_id) REFERENCES questions_quiz(id) ON DELETE CASCADE;

-- Quiz_questions
ALTER TABLE public.quiz_questions ADD CONSTRAINT quiz_questions_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES quiz(id) ON DELETE CASCADE;
ALTER TABLE public.quiz_questions ADD CONSTRAINT quiz_questions_question_id_fkey FOREIGN KEY (question_id) REFERENCES questions_quiz(id) ON DELETE CASCADE;

-- Participations_quiz
ALTER TABLE public.participations_quiz ADD CONSTRAINT participations_quiz_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES quiz(id) ON DELETE CASCADE;
ALTER TABLE public.participations_quiz ADD CONSTRAINT participations_quiz_eleve_id_fkey FOREIGN KEY (eleve_id) REFERENCES eleves(id) ON DELETE CASCADE;

-- Reponses_quiz
ALTER TABLE public.reponses_quiz ADD CONSTRAINT reponses_quiz_participation_id_fkey FOREIGN KEY (participation_id) REFERENCES participations_quiz(id) ON DELETE CASCADE;
ALTER TABLE public.reponses_quiz ADD CONSTRAINT reponses_quiz_question_id_fkey FOREIGN KEY (question_id) REFERENCES questions_quiz(id) ON DELETE CASCADE;
ALTER TABLE public.reponses_quiz ADD CONSTRAINT reponses_quiz_option_id_fkey FOREIGN KEY (option_id) REFERENCES options_quiz(id) ON DELETE CASCADE;

-- Préinscriptions
ALTER TABLE public.preinscriptions ADD CONSTRAINT preinscriptions_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE;
ALTER TABLE public.preinscriptions ADD CONSTRAINT preinscriptions_traite_par_fkey FOREIGN KEY (traite_par) REFERENCES utilisateurs(id) ON DELETE SET NULL;

-- Commandes_fournitures
ALTER TABLE public.commandes_fournitures ADD CONSTRAINT commandes_fournitures_preinscription_id_fkey FOREIGN KEY (preinscription_id) REFERENCES preinscriptions(id) ON DELETE CASCADE;
ALTER TABLE public.commandes_fournitures ADD CONSTRAINT commandes_fournitures_article_id_fkey FOREIGN KEY (article_id) REFERENCES articles_librairie(id) ON DELETE SET NULL;

-- Preinscription_cantine
ALTER TABLE public.preinscription_cantine ADD CONSTRAINT preinscription_cantine_preinscription_id_fkey FOREIGN KEY (preinscription_id) REFERENCES preinscriptions(id) ON DELETE CASCADE;
ALTER TABLE public.preinscription_cantine ADD CONSTRAINT preinscription_cantine_menu_id_fkey FOREIGN KEY (menu_id) REFERENCES cantine_menus(id) ON DELETE SET NULL;

-- Preinscription_transport
ALTER TABLE public.preinscription_transport ADD CONSTRAINT preinscription_transport_preinscription_id_fkey FOREIGN KEY (preinscription_id) REFERENCES preinscriptions(id) ON DELETE CASCADE;
ALTER TABLE public.preinscription_transport ADD CONSTRAINT preinscription_transport_ligne_id_fkey FOREIGN KEY (ligne_id) REFERENCES lignes_transport(id) ON DELETE SET NULL;

-- Inscriptions
ALTER TABLE public.inscriptions ADD CONSTRAINT inscriptions_preinscription_id_fkey FOREIGN KEY (preinscription_id) REFERENCES preinscriptions(id) ON DELETE SET NULL;
ALTER TABLE public.inscriptions ADD CONSTRAINT inscriptions_eleve_id_fkey FOREIGN KEY (eleve_id) REFERENCES eleves(id) ON DELETE CASCADE;
ALTER TABLE public.inscriptions ADD CONSTRAINT inscriptions_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE;
ALTER TABLE public.inscriptions ADD CONSTRAINT inscriptions_annee_scolaire_id_fkey FOREIGN KEY (annee_scolaire_id) REFERENCES annees_scolaires(id) ON DELETE SET NULL;

-- Réinscriptions
ALTER TABLE public.reinscriptions ADD CONSTRAINT reinscriptions_inscription_id_fkey FOREIGN KEY (inscription_id) REFERENCES inscriptions(id) ON DELETE SET NULL;
ALTER TABLE public.reinscriptions ADD CONSTRAINT reinscriptions_eleve_id_fkey FOREIGN KEY (eleve_id) REFERENCES eleves(id) ON DELETE CASCADE;
ALTER TABLE public.reinscriptions ADD CONSTRAINT reinscriptions_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE;
ALTER TABLE public.reinscriptions ADD CONSTRAINT reinscriptions_annee_scolaire_id_fkey FOREIGN KEY (annee_scolaire_id) REFERENCES annees_scolaires(id) ON DELETE SET NULL;
ALTER TABLE public.reinscriptions ADD CONSTRAINT reinscriptions_classe_id_fkey FOREIGN KEY (classe_id) REFERENCES classes(id) ON DELETE SET NULL;

-- Échéances paiement
ALTER TABLE public.echeances_paiement ADD CONSTRAINT echeances_paiement_preinscription_id_fkey FOREIGN KEY (preinscription_id) REFERENCES preinscriptions(id) ON DELETE CASCADE;
ALTER TABLE public.echeances_paiement ADD CONSTRAINT echeances_paiement_reinscription_id_fkey FOREIGN KEY (reinscription_id) REFERENCES reinscriptions(id) ON DELETE CASCADE;

-- Paiements
ALTER TABLE public.paiements ADD CONSTRAINT paiements_eleve_id_fkey FOREIGN KEY (eleve_id) REFERENCES eleves(id) ON DELETE CASCADE;
ALTER TABLE public.paiements ADD CONSTRAINT paiements_saisie_par_fkey FOREIGN KEY (saisie_par) REFERENCES utilisateurs(id) ON DELETE SET NULL;
ALTER TABLE public.paiements ADD CONSTRAINT paiements_preinscription_id_fkey FOREIGN KEY (preinscription_id) REFERENCES preinscriptions(id) ON DELETE SET NULL;
ALTER TABLE public.paiements ADD CONSTRAINT paiements_reinscription_id_fkey FOREIGN KEY (reinscription_id) REFERENCES reinscriptions(id) ON DELETE CASCADE;

-- Paiements_salaires
ALTER TABLE public.paiements_salaires ADD CONSTRAINT paiements_salaires_personnel_id_fkey FOREIGN KEY (personnel_id) REFERENCES personnels(id) ON DELETE CASCADE;
ALTER TABLE public.paiements_salaires ADD CONSTRAINT paiements_salaires_saisie_par_fkey FOREIGN KEY (saisie_par) REFERENCES utilisateurs(id) ON DELETE SET NULL;

-- Avances_salaires
ALTER TABLE public.avances_salaires ADD CONSTRAINT avances_salaires_personnel_id_fkey FOREIGN KEY (personnel_id) REFERENCES personnels(id) ON DELETE CASCADE;
ALTER TABLE public.avances_salaires ADD CONSTRAINT avances_salaires_accorde_par_fkey FOREIGN KEY (accorde_par) REFERENCES utilisateurs(id) ON DELETE SET NULL;

-- Conges_personnel
ALTER TABLE public.conges_personnel ADD CONSTRAINT conges_personnel_personnel_id_fkey FOREIGN KEY (personnel_id) REFERENCES personnels(id) ON DELETE CASCADE;
ALTER TABLE public.conges_personnel ADD CONSTRAINT conges_personnel_approuve_par_fkey FOREIGN KEY (approuve_par) REFERENCES utilisateurs(id) ON DELETE SET NULL;

-- Contrats_personnel
ALTER TABLE public.contrats_personnel ADD CONSTRAINT contrats_personnel_personnel_id_fkey FOREIGN KEY (personnel_id) REFERENCES personnels(id) ON DELETE CASCADE;

-- Dépenses
ALTER TABLE public.depenses ADD CONSTRAINT depenses_saisi_par_fkey FOREIGN KEY (saisi_par) REFERENCES utilisateurs(id) ON DELETE SET NULL;
ALTER TABLE public.depenses ADD CONSTRAINT depenses_valide_par_fkey FOREIGN KEY (valide_par) REFERENCES utilisateurs(id) ON DELETE SET NULL;

-- Mouvements caisse
ALTER TABLE public.mouvements_caisse ADD CONSTRAINT mouvements_caisse_saisi_par_fkey FOREIGN KEY (saisi_par) REFERENCES utilisateurs(id) ON DELETE SET NULL;
ALTER TABLE public.mouvements_caisse ADD CONSTRAINT mouvements_caisse_valide_par_fkey FOREIGN KEY (valide_par) REFERENCES utilisateurs(id) ON DELETE SET NULL;

-- Budget prévisionnel
ALTER TABLE public.budget_previsionnel ADD CONSTRAINT budget_previsionnel_categorie_code_fkey FOREIGN KEY (categorie_code) REFERENCES categories_depenses(code) ON DELETE SET NULL;

-- Annonces
ALTER TABLE public.annonces ADD CONSTRAINT annonces_classe_id_fkey FOREIGN KEY (classe_id) REFERENCES classes(id) ON DELETE SET NULL;
ALTER TABLE public.annonces ADD CONSTRAINT annonces_publie_par_fkey FOREIGN KEY (publie_par) REFERENCES utilisateurs(id) ON DELETE SET NULL;

-- Messages
ALTER TABLE public.messages ADD CONSTRAINT messages_expediteur_id_fkey FOREIGN KEY (expediteur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE;
ALTER TABLE public.messages ADD CONSTRAINT messages_destinataire_id_fkey FOREIGN KEY (destinataire_id) REFERENCES utilisateurs(id) ON DELETE CASCADE;

-- Logs_activites
ALTER TABLE public.logs_activites ADD CONSTRAINT logs_activites_utilisateur_id_fkey FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE SET NULL;

-- Sessions
ALTER TABLE public.sessions ADD CONSTRAINT sessions_utilisateur_id_fkey FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE;

-- Frais_scolaires
ALTER TABLE public.frais_scolaires ADD CONSTRAINT frais_scolaires_annee_scolaire_id_fkey FOREIGN KEY (annee_scolaire_id) REFERENCES annees_scolaires(id) ON DELETE SET NULL;

-- Commandes librairie
ALTER TABLE public.commandes_librairie ADD CONSTRAINT commandes_librairie_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE;

-- Commandes librairie articles
ALTER TABLE public.commandes_librairie_articles ADD CONSTRAINT commandes_librairie_articles_commande_id_fkey FOREIGN KEY (commande_id) REFERENCES commandes_librairie(id) ON DELETE CASCADE;
ALTER TABLE public.commandes_librairie_articles ADD CONSTRAINT commandes_librairie_articles_article_id_fkey FOREIGN KEY (article_id) REFERENCES articles_librairie(id) ON DELETE SET NULL;

-- Ventes librairie
ALTER TABLE public.ventes_librairie ADD CONSTRAINT ventes_librairie_article_id_fkey FOREIGN KEY (article_id) REFERENCES articles_librairie(id) ON DELETE CASCADE;
ALTER TABLE public.ventes_librairie ADD CONSTRAINT ventes_librairie_eleve_id_fkey FOREIGN KEY (eleve_id) REFERENCES eleves(id) ON DELETE SET NULL;
ALTER TABLE public.ventes_librairie ADD CONSTRAINT ventes_librairie_vendu_par_fkey FOREIGN KEY (vendu_par) REFERENCES utilisateurs(id) ON DELETE SET NULL;

-- Lignes transport
ALTER TABLE public.lignes_transport ADD CONSTRAINT lignes_transport_bus_id_fkey FOREIGN KEY (bus_id) REFERENCES bus(id) ON DELETE SET NULL;

-- Inscriptions transport
ALTER TABLE public.inscriptions_transport ADD CONSTRAINT inscriptions_transport_eleve_id_fkey FOREIGN KEY (eleve_id) REFERENCES eleves(id) ON DELETE CASCADE;
ALTER TABLE public.inscriptions_transport ADD CONSTRAINT inscriptions_transport_ligne_id_fkey FOREIGN KEY (ligne_id) REFERENCES lignes_transport(id) ON DELETE SET NULL;

-- Présences transport
ALTER TABLE public.presences_transport ADD CONSTRAINT presences_transport_eleve_id_fkey FOREIGN KEY (eleve_id) REFERENCES eleves(id) ON DELETE CASCADE;

-- Inscriptions cantine
ALTER TABLE public.inscriptions_cantine ADD CONSTRAINT inscriptions_cantine_eleve_id_fkey FOREIGN KEY (eleve_id) REFERENCES eleves(id) ON DELETE CASCADE;

-- Réservations cantine
ALTER TABLE public.reservations_cantine ADD CONSTRAINT reservations_cantine_eleve_id_fkey FOREIGN KEY (eleve_id) REFERENCES eleves(id) ON DELETE CASCADE;
ALTER TABLE public.reservations_cantine ADD CONSTRAINT reservations_cantine_menu_id_fkey FOREIGN KEY (menu_id) REFERENCES menus_cantine(id) ON DELETE SET NULL;

-- Reserves cantine
ALTER TABLE public.reserves_cantine ADD CONSTRAINT reserves_cantine_eleve_id_fkey FOREIGN KEY (eleve_id) REFERENCES eleves(id) ON DELETE CASCADE;

-- Transactions cantine
ALTER TABLE public.transactions_cantine ADD CONSTRAINT transactions_cantine_eleve_id_fkey FOREIGN KEY (eleve_id) REFERENCES eleves(id) ON DELETE CASCADE;

-- Emprunts bibliothèque
ALTER TABLE public.emprunts_bibliotheque ADD CONSTRAINT emprunts_bibliotheque_livre_id_fkey FOREIGN KEY (livre_id) REFERENCES livres_bibliotheque(id) ON DELETE CASCADE;
ALTER TABLE public.emprunts_bibliotheque ADD CONSTRAINT emprunts_bibliotheque_eleve_id_fkey FOREIGN KEY (eleve_id) REFERENCES eleves(id) ON DELETE CASCADE;

-- ============================================
-- 4. CRÉER LES INDEX
-- ============================================

CREATE INDEX IF NOT EXISTS idx_reset_tokens_token ON reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_reset_tokens_email ON reset_tokens(email);
CREATE INDEX IF NOT EXISTS idx_eleves_classe ON eleves(classe_id);
CREATE INDEX IF NOT EXISTS idx_eleves_matricule ON eleves(matricule);
CREATE INDEX IF NOT EXISTS idx_enseignements_classe ON enseignements(classe_id);
CREATE INDEX IF NOT EXISTS idx_enseignements_enseignant ON enseignements(enseignant_id);
CREATE INDEX IF NOT EXISTS idx_examens_eleves_eleve_id ON examens_eleves(eleve_id);
CREATE INDEX IF NOT EXISTS idx_examens_eleves_examen_id ON examens_eleves(examen_id);
CREATE INDEX IF NOT EXISTS idx_inscriptions_eleve ON inscriptions(eleve_id);
CREATE INDEX IF NOT EXISTS idx_inscriptions_parent ON inscriptions(parent_id);
CREATE INDEX IF NOT EXISTS idx_paiements_eleve ON paiements(eleve_id);
CREATE INDEX IF NOT EXISTS idx_paiements_date ON paiements(date_paiement);
CREATE INDEX IF NOT EXISTS idx_paiements_preinscription_id ON paiements(preinscription_id);
CREATE INDEX IF NOT EXISTS idx_presences_date ON presences(date);
CREATE INDEX IF NOT EXISTS idx_presences_transport_date ON presences_transport(date);
CREATE INDEX IF NOT EXISTS idx_presences_transport_eleve ON presences_transport(eleve_id);
CREATE INDEX IF NOT EXISTS idx_reinscriptions_eleve ON reinscriptions(eleve_id);
CREATE INDEX IF NOT EXISTS idx_reinscriptions_annee ON reinscriptions(annee_scolaire_id);
CREATE INDEX IF NOT EXISTS idx_reinscriptions_statut ON reinscriptions(statut);
CREATE INDEX IF NOT EXISTS idx_preinscriptions_date ON preinscriptions(date_preinscription);
CREATE INDEX IF NOT EXISTS idx_preinscriptions_parent_id ON preinscriptions(parent_id);
CREATE INDEX IF NOT EXISTS idx_preinscriptions_statut ON preinscriptions(statut);
CREATE INDEX IF NOT EXISTS idx_preinscriptions_numero_dossier ON preinscriptions(numero_dossier);
CREATE INDEX IF NOT EXISTS idx_messages_destinataire ON messages(destinataire_id, est_lu);
CREATE INDEX IF NOT EXISTS idx_mouvements_caisse_date ON mouvements_caisse(date_mouvement);
CREATE INDEX IF NOT EXISTS idx_mouvements_caisse_type ON mouvements_caisse(type);
CREATE INDEX IF NOT EXISTS idx_mouvements_caisse_annee_mois ON mouvements_caisse(exercice_annee, exercice_mois);
CREATE INDEX IF NOT EXISTS idx_depenses_date ON depenses(date_depense);
CREATE INDEX IF NOT EXISTS idx_depenses_categorie ON depenses(categorie);
CREATE INDEX IF NOT EXISTS idx_depenses_annee_mois ON depenses(exercice_annee, exercice_mois);
CREATE INDEX IF NOT EXISTS idx_paiements_salaires_mois_annee ON paiements_salaires(mois, annee);
CREATE INDEX IF NOT EXISTS idx_echeances_paiement_reinscription_id ON echeances_paiement(reinscription_id);

-- ============================================
-- 5. INSÉRER LES DONNÉES DE BASE (si elles n'existent pas)
-- ============================================

-- 5.1 Année scolaire (si pas d'année active)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM annees_scolaires) THEN
        INSERT INTO annees_scolaires (libelle, date_debut, date_fin, est_active) 
        VALUES ('2025-2026', '2025-09-01', '2026-06-30', true);
    END IF;
END $$;

-- 5.2 Administrateurs
INSERT INTO utilisateurs (email, password, prenom, nom, role, est_actif, created_at, updated_at)
SELECT * FROM (VALUES 
    ('admin@eief.com', '$2b$10$Cl.LbpccIdc1.rBfxmuvGuhrvsgOasr/kus9dyvifHCojG8ZiPR72', 'Super', 'Admin', 'SUPER_ADMIN', true, NOW(), NOW()),
    ('comptable@eief.com', '$2b$10$Cl.LbpccIdc1.rBfxmuvGuhrvsgOasr/kus9dyvifHCojG8ZiPR72', 'Claire', 'Comptable', 'COMPTABLE', true, NOW(), NOW()),
    ('directeur@eief.com', '$2b$10$Cl.LbpccIdc1.rBfxmuvGuhrvsgOasr/kus9dyvifHCojG8ZiPR72', 'Paul', 'Directeur', 'DIRECTEUR_GENERAL', true, NOW(), NOW()),
    ('cantine@eief.com', '$2b$10$Cl.LbpccIdc1.rBfxmuvGuhrvsgOasr/kus9dyvifHCojG8ZiPR72', 'Aissatou', 'Kane', 'ADMIN_CANTINE', true, NOW(), NOW()),
    ('librairie@eief.com', '$2b$10$Cl.LbpccIdc1.rBfxmuvGuhrvsgOasr/kus9dyvifHCojG8ZiPR72', 'Fatou', 'Diop', 'ADMIN_LIBRAIRIE', true, NOW(), NOW()),
    ('bibliotheque@eief.com', '$2b$10$Cl.LbpccIdc1.rBfxmuvGuhrvsgOasr/kus9dyvifHCojG8ZiPR72', 'Mamadou', 'Diallo', 'ADMIN_BIBLIOTHEQUE', true, NOW(), NOW()),
    ('transport@eief.com', '$2b$10$Cl.LbpccIdc1.rBfxmuvGuhrvsgOasr/kus9dyvifHCojG8ZiPR72', 'Amadou', 'Camara', 'ADMIN_TRANSPORT', true, NOW(), NOW())
) AS v(email, password, prenom, nom, role, est_actif, created_at, updated_at)
WHERE NOT EXISTS (SELECT 1 FROM utilisateurs WHERE utilisateurs.email = v.email);

-- 5.3 Catégories de dépenses
INSERT INTO categories_depenses (code, libelle, type, is_active)
SELECT * FROM (VALUES 
    ('SAL', 'Salaires du personnel', 'sortie', true),
    ('FOUR', 'Fournitures de bureau', 'sortie', true),
    ('MAINT', 'Maintenance / Entretien', 'sortie', true),
    ('ELEC', 'Eau / Électricité', 'sortie', true),
    ('EQUIP', 'Équipement / Matériel', 'sortie', true),
    ('TRANS', 'Transport / Carburant', 'sortie', true),
    ('COMM', 'Communication / Internet', 'sortie', true),
    ('LOYER', 'Loyer / Foncier', 'sortie', true),
    ('SANTE', 'Santé / Médical', 'sortie', true),
    ('FORM', 'Formation du personnel', 'sortie', true),
    ('DIV', 'Divers / Autres', 'sortie', true),
    ('SCOL', 'Frais de scolarité', 'entree', true),
    ('REINSC', 'Frais de réinscription', 'entree', true),
    ('CANT', 'Cantine', 'entree', true),
    ('BIBL', 'Bibliothèque', 'entree', true),
    ('TRANSP', 'Transport élèves', 'entree', true)
) AS v(code, libelle, type, is_active)
WHERE NOT EXISTS (SELECT 1 FROM categories_depenses WHERE categories_depenses.code = v.code);

-- ============================================
-- 6. VÉRIFICATION FINALE
-- ============================================

-- Voir les administrateurs
SELECT id, email, prenom, nom, role FROM utilisateurs ORDER BY id;

-- Compter les enregistrements
SELECT 
    'utilisateurs' as table_name, COUNT(*) as count FROM utilisateurs
UNION ALL
SELECT 'annees_scolaires', COUNT(*) FROM annees_scolaires
UNION ALL
SELECT 'classes', COUNT(*) FROM classes
UNION ALL
SELECT 'categories_depenses', COUNT(*) FROM categories_depenses
UNION ALL
SELECT 'services_annexes', COUNT(*) FROM services_annexes
UNION ALL
SELECT 'budget_previsionnel', COUNT(*) FROM budget_previsionnel
ORDER BY table_name;