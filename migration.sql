-- ============================================
-- SCRIPT DE MIGRATION - EIEF
-- À exécuter dans l'éditeur SQL de Supabase
-- Ajoute les colonnes manquantes sans supprimer les données
-- ============================================

-- ============================================
-- TABLE preinscriptions : colonnes manquantes
-- ============================================
ALTER TABLE preinscriptions
  ADD COLUMN IF NOT EXISTS frais_montant INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS frais_statut VARCHAR(20) DEFAULT 'non_paye',
  ADD COLUMN IF NOT EXISTS frais_mode_paiement VARCHAR(50),
  ADD COLUMN IF NOT EXISTS frais_reference VARCHAR(100),
  ADD COLUMN IF NOT EXISTS acte_naissance_url TEXT,
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS bulletin_url TEXT,
  ADD COLUMN IF NOT EXISTS date_traitement TIMESTAMP;

-- Ajouter la contrainte CHECK sur frais_statut si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'preinscriptions_frais_statut_check'
  ) THEN
    ALTER TABLE preinscriptions 
      ADD CONSTRAINT preinscriptions_frais_statut_check 
      CHECK (frais_statut IN ('non_paye', 'paye'));
  END IF;
END$$;

-- ============================================
-- TABLE reinscriptions : colonnes manquantes
-- ============================================
ALTER TABLE reinscriptions
  ADD COLUMN IF NOT EXISTS acte_naissance_url TEXT,
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS bulletin_url TEXT,
  ADD COLUMN IF NOT EXISTS date_traitement TIMESTAMP;

-- ============================================
-- TABLE classes : colonne manquante
-- ============================================
ALTER TABLE classes
  ADD COLUMN IF NOT EXISTS frais_inscription INTEGER DEFAULT 0;

-- ============================================
-- TABLE frais_scolaires : colonnes manquantes
-- ============================================
ALTER TABLE frais_scolaires
  ADD COLUMN IF NOT EXISTS nom VARCHAR(100),
  ADD COLUMN IF NOT EXISTS obligatoire BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS frequence VARCHAR(50) DEFAULT 'mensuel',
  ADD COLUMN IF NOT EXISTS niveau VARCHAR(50);

-- ============================================
-- TABLE annonces : colonnes manquantes
-- ============================================
ALTER TABLE annonces
  ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'information',
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS date_modification TIMESTAMP;

-- ============================================
-- TABLE livres_bibliotheque : colonnes manquantes
-- ============================================
ALTER TABLE livres_bibliotheque
  ADD COLUMN IF NOT EXISTS categorie VARCHAR(100),
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- ============================================
-- TABLE paiements : étendre la contrainte statut
-- (supprimer l'ancienne contrainte et recréer)
-- ============================================
DO $$
BEGIN
  -- Supprimer l'ancienne contrainte CHECK sur statut si elle existe
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'paiements'::regclass 
    AND contype = 'c'
    AND conname LIKE '%statut%'
  ) THEN
    EXECUTE (
      SELECT 'ALTER TABLE paiements DROP CONSTRAINT ' || conname
      FROM pg_constraint 
      WHERE conrelid = 'paiements'::regclass 
      AND contype = 'c'
      AND conname LIKE '%statut%'
      LIMIT 1
    );
  END IF;
END$$;

ALTER TABLE paiements
  DROP CONSTRAINT IF EXISTS paiements_statut_check;

ALTER TABLE paiements
  ADD CONSTRAINT paiements_statut_check 
  CHECK (statut IN ('valide', 'paye', 'en_attente', 'annule'));

-- ============================================
-- TABLE parents : élargir situation_matrimoniale pour stocker les infos mère en JSON
-- ============================================
ALTER TABLE parents ALTER COLUMN situation_matrimoniale TYPE TEXT;

-- ============================================
-- NOUVELLES TABLES (créées seulement si absentes)
-- ============================================

-- Table paiements_salaires
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

-- Table articles_librairie
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

-- Table ventes_librairie
CREATE TABLE IF NOT EXISTS ventes_librairie (
    id SERIAL PRIMARY KEY,
    article_id INTEGER REFERENCES articles_librairie(id) ON DELETE CASCADE,
    eleve_id INTEGER REFERENCES eleves(id),
    quantite INTEGER NOT NULL DEFAULT 1,
    montant_total INTEGER NOT NULL,
    date_vente TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    vendu_par INTEGER REFERENCES utilisateurs(id)
);

-- Table emprunts_bibliotheque
CREATE TABLE IF NOT EXISTS emprunts_bibliotheque (
    id SERIAL PRIMARY KEY,
    livre_id INTEGER REFERENCES livres_bibliotheque(id) ON DELETE CASCADE,
    eleve_id INTEGER REFERENCES eleves(id) ON DELETE CASCADE,
    date_emprunt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_retour_prevue TIMESTAMP NOT NULL,
    date_retour_reelle TIMESTAMP,
    statut VARCHAR(20) DEFAULT 'en_cours' CHECK (statut IN ('en_cours', 'retourne', 'en_retard'))
);

-- Table menus_cantine (nouveau modèle avec prix)
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

-- Table inscriptions_cantine
CREATE TABLE IF NOT EXISTS inscriptions_cantine (
    id SERIAL PRIMARY KEY,
    eleve_id INTEGER REFERENCES eleves(id) ON DELETE CASCADE,
    est_actif BOOLEAN DEFAULT true,
    solde DECIMAL(12,2) DEFAULT 0,
    preferences_alimentaires TEXT,
    allergies TEXT,
    date_inscription DATE DEFAULT CURRENT_DATE
);

-- Table reservations_cantine
CREATE TABLE IF NOT EXISTS reservations_cantine (
    id SERIAL PRIMARY KEY,
    eleve_id INTEGER REFERENCES eleves(id) ON DELETE CASCADE,
    menu_id INTEGER REFERENCES menus_cantine(id),
    date DATE NOT NULL,
    statut VARCHAR(20) DEFAULT 'confirmee' CHECK (statut IN ('confirmee', 'annulee', 'en_attente')),
    paye BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table transactions_cantine
CREATE TABLE IF NOT EXISTS transactions_cantine (
    id SERIAL PRIMARY KEY,
    eleve_id INTEGER REFERENCES eleves(id) ON DELETE CASCADE,
    montant DECIMAL(12,2) NOT NULL,
    type VARCHAR(20) CHECK (type IN ('credit', 'debit')),
    description TEXT,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- NOUVEAUX INDEX
-- ============================================
CREATE INDEX IF NOT EXISTS idx_emprunts_eleve ON emprunts_bibliotheque(eleve_id);
CREATE INDEX IF NOT EXISTS idx_emprunts_livre ON emprunts_bibliotheque(livre_id);
CREATE INDEX IF NOT EXISTS idx_ventes_article ON ventes_librairie(article_id);
CREATE INDEX IF NOT EXISTS idx_paiements_salaires_personnel ON paiements_salaires(personnel_id);
CREATE INDEX IF NOT EXISTS idx_reservations_cantine_eleve ON reservations_cantine(eleve_id);
CREATE INDEX IF NOT EXISTS idx_reservations_cantine_date ON reservations_cantine(date);
CREATE INDEX IF NOT EXISTS idx_transactions_cantine_eleve ON transactions_cantine(eleve_id);

-- ============================================
-- VÉRIFICATION FINALE
-- ============================================
SELECT 
  table_name,
  COUNT(*) as nb_colonnes
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND table_name IN (
    'preinscriptions', 'reinscriptions', 'classes', 'frais_scolaires',
    'annonces', 'livres_bibliotheque', 'paiements', 'paiements_salaires',
    'articles_librairie', 'ventes_librairie', 'emprunts_bibliotheque',
    'menus_cantine', 'inscriptions_cantine', 'reservations_cantine',
    'transactions_cantine'
  )
GROUP BY table_name
ORDER BY table_name;
