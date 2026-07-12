/*
  Warnings:

  - You are about to drop the `Classe` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Devoir` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Eleve` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Enseignement` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Lecon` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LienParentEleve` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Matiere` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Message` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Note` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Paiement` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Parent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Personnel` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Presence` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SoumissionDevoir` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Utilisateur` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'CHAUFFEUR';
ALTER TYPE "Role" ADD VALUE 'CANTINE';

-- DropForeignKey
ALTER TABLE "Devoir" DROP CONSTRAINT "Devoir_enseignementId_fkey";

-- DropForeignKey
ALTER TABLE "Eleve" DROP CONSTRAINT "Eleve_classeId_fkey";

-- DropForeignKey
ALTER TABLE "Eleve" DROP CONSTRAINT "Eleve_utilisateurId_fkey";

-- DropForeignKey
ALTER TABLE "Enseignement" DROP CONSTRAINT "Enseignement_classeId_fkey";

-- DropForeignKey
ALTER TABLE "Enseignement" DROP CONSTRAINT "Enseignement_enseignantId_fkey";

-- DropForeignKey
ALTER TABLE "Enseignement" DROP CONSTRAINT "Enseignement_matiereId_fkey";

-- DropForeignKey
ALTER TABLE "Lecon" DROP CONSTRAINT "Lecon_enseignementId_fkey";

-- DropForeignKey
ALTER TABLE "LienParentEleve" DROP CONSTRAINT "LienParentEleve_eleveId_fkey";

-- DropForeignKey
ALTER TABLE "LienParentEleve" DROP CONSTRAINT "LienParentEleve_parentId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_destinataireId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_expediteurId_fkey";

-- DropForeignKey
ALTER TABLE "Note" DROP CONSTRAINT "Note_eleveId_fkey";

-- DropForeignKey
ALTER TABLE "Note" DROP CONSTRAINT "Note_enseignementId_fkey";

-- DropForeignKey
ALTER TABLE "Paiement" DROP CONSTRAINT "Paiement_eleveId_fkey";

-- DropForeignKey
ALTER TABLE "Parent" DROP CONSTRAINT "Parent_utilisateurId_fkey";

-- DropForeignKey
ALTER TABLE "Personnel" DROP CONSTRAINT "Personnel_utilisateurId_fkey";

-- DropForeignKey
ALTER TABLE "Presence" DROP CONSTRAINT "Presence_classeId_fkey";

-- DropForeignKey
ALTER TABLE "Presence" DROP CONSTRAINT "Presence_eleveId_fkey";

-- DropForeignKey
ALTER TABLE "SoumissionDevoir" DROP CONSTRAINT "SoumissionDevoir_devoirId_fkey";

-- DropForeignKey
ALTER TABLE "SoumissionDevoir" DROP CONSTRAINT "SoumissionDevoir_eleveId_fkey";

-- DropTable
DROP TABLE "Classe";

-- DropTable
DROP TABLE "Devoir";

-- DropTable
DROP TABLE "Eleve";

-- DropTable
DROP TABLE "Enseignement";

-- DropTable
DROP TABLE "Lecon";

-- DropTable
DROP TABLE "LienParentEleve";

-- DropTable
DROP TABLE "Matiere";

-- DropTable
DROP TABLE "Message";

-- DropTable
DROP TABLE "Note";

-- DropTable
DROP TABLE "Paiement";

-- DropTable
DROP TABLE "Parent";

-- DropTable
DROP TABLE "Personnel";

-- DropTable
DROP TABLE "Presence";

-- DropTable
DROP TABLE "SoumissionDevoir";

-- DropTable
DROP TABLE "Utilisateur";

-- CreateTable
CREATE TABLE "annees_scolaires" (
    "id" SERIAL NOT NULL,
    "libelle" VARCHAR(20) NOT NULL,
    "date_debut" DATE NOT NULL,
    "date_fin" DATE NOT NULL,
    "est_active" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "annees_scolaires_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "annonces" (
    "id" SERIAL NOT NULL,
    "titre" VARCHAR(255) NOT NULL,
    "contenu" TEXT NOT NULL,
    "cible" VARCHAR(50) DEFAULT 'tous',
    "type" VARCHAR(50) DEFAULT 'information',
    "classe_id" INTEGER,
    "image_url" TEXT,
    "date_publication" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "date_modification" TIMESTAMP(6),
    "date_programmee" TIMESTAMP(6),
    "publie_par" INTEGER,

    CONSTRAINT "annonces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles_librairie" (
    "id" SERIAL NOT NULL,
    "nom" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "prix_unitaire" INTEGER NOT NULL,
    "quantite_stock" INTEGER DEFAULT 0,
    "categorie" VARCHAR(100) DEFAULT 'fourniture',
    "image_url" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "articles_librairie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avances_salaires" (
    "id" SERIAL NOT NULL,
    "personnel_id" INTEGER NOT NULL,
    "montant" INTEGER NOT NULL,
    "motif" TEXT,
    "date_avance" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "mois_deduction" INTEGER NOT NULL,
    "annee_deduction" INTEGER NOT NULL,
    "statut" VARCHAR(20) DEFAULT 'accorde',
    "accorde_par" INTEGER,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "avances_salaires_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_previsionnel" (
    "id" SERIAL NOT NULL,
    "annee" INTEGER NOT NULL,
    "categorie_code" VARCHAR(20) NOT NULL,
    "montant_prevu" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "budget_previsionnel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bus" (
    "id" SERIAL NOT NULL,
    "immatriculation" VARCHAR(50) NOT NULL,
    "capacite" INTEGER,
    "chauffeur_nom" VARCHAR(100),
    "chauffeur_tel" VARCHAR(20),

    CONSTRAINT "bus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cantine_menus" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "plat" VARCHAR(255),
    "accompagnement" VARCHAR(255),
    "dessert" VARCHAR(255),
    "regime_special" BOOLEAN DEFAULT false,
    "prix" INTEGER,
    "prix_annuel" INTEGER,

    CONSTRAINT "cantine_menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories_depenses" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "libelle" VARCHAR(100) NOT NULL,
    "type" VARCHAR(10) NOT NULL DEFAULT 'sortie',
    "description" TEXT,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_depenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories_quiz" (
    "id" SERIAL NOT NULL,
    "nom" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "couleur" VARCHAR(7) DEFAULT '#6B46C1',
    "icon" VARCHAR(50) DEFAULT 'BookOpen',
    "est_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_quiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" SERIAL NOT NULL,
    "nom" VARCHAR(50) NOT NULL,
    "niveau" VARCHAR(50) NOT NULL,
    "salle" VARCHAR(50),
    "capacite_max" INTEGER DEFAULT 30,
    "titulaire_id" INTEGER,
    "code_acces" VARCHAR(20),
    "frais_inscription" INTEGER DEFAULT 0,
    "annee_scolaire_id" INTEGER,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "premier_versement" INTEGER DEFAULT 0,
    "deuxieme_versement" INTEGER DEFAULT 0,
    "troisieme_versement" INTEGER DEFAULT 0,
    "total_versement" INTEGER DEFAULT 0,
    "reinscription_premier_versement" INTEGER DEFAULT 0,
    "reinscription_deuxieme_versement" INTEGER DEFAULT 0,
    "reinscription_troisieme_versement" INTEGER DEFAULT 0,
    "reinscription_total_versement" INTEGER DEFAULT 0,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commandes_fournitures" (
    "id" SERIAL NOT NULL,
    "preinscription_id" INTEGER,
    "article_id" INTEGER,
    "quantite" INTEGER NOT NULL DEFAULT 1,
    "prix_unitaire" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commandes_fournitures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commandes_librairie" (
    "id" SERIAL NOT NULL,
    "parent_id" INTEGER,
    "numero_commande" VARCHAR(50) NOT NULL,
    "date_commande" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "statut" VARCHAR(20) DEFAULT 'en_attente',
    "total" INTEGER NOT NULL,
    "observations" TEXT,
    "date_traitement" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commandes_librairie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commandes_librairie_articles" (
    "id" SERIAL NOT NULL,
    "commande_id" INTEGER,
    "article_id" INTEGER,
    "quantite" INTEGER NOT NULL,
    "prix_unitaire" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commandes_librairie_articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conges_personnel" (
    "id" SERIAL NOT NULL,
    "personnel_id" INTEGER NOT NULL,
    "type_conge" VARCHAR(50) NOT NULL DEFAULT 'annuel',
    "date_debut" DATE NOT NULL,
    "date_fin" DATE NOT NULL,
    "nombre_jours" INTEGER,
    "motif" TEXT,
    "statut" VARCHAR(20) DEFAULT 'en_attente',
    "approuve_par" INTEGER,
    "date_approbation" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conges_personnel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contrats_personnel" (
    "id" SERIAL NOT NULL,
    "personnel_id" INTEGER NOT NULL,
    "type_contrat" VARCHAR(50) NOT NULL DEFAULT 'CDI',
    "date_debut" DATE NOT NULL,
    "date_fin" DATE,
    "salaire_brut" INTEGER NOT NULL,
    "salaire_net" INTEGER NOT NULL,
    "heures_semaine" DECIMAL(5,2) DEFAULT 40,
    "conges_annuels" INTEGER DEFAULT 25,
    "observations" TEXT,
    "is_actif" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contrats_personnel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "depenses" (
    "id" SERIAL NOT NULL,
    "categorie" VARCHAR(100) NOT NULL,
    "montant" INTEGER NOT NULL,
    "description" TEXT,
    "date_depense" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "sous_categorie" VARCHAR(100),
    "reference" VARCHAR(100),
    "fournisseur" VARCHAR(200),
    "numero_recu" VARCHAR(100),
    "saisi_par" INTEGER,
    "valide_par" INTEGER,
    "statut" VARCHAR(20) DEFAULT 'valide',
    "exercice_annee" INTEGER DEFAULT EXTRACT(year FROM now()),
    "exercice_mois" INTEGER DEFAULT EXTRACT(month FROM now()),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "depenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devoirs" (
    "id" SERIAL NOT NULL,
    "enseignement_id" INTEGER,
    "titre" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "fichier_url" TEXT,
    "date_limite" DATE NOT NULL,
    "date_publication" DATE DEFAULT CURRENT_DATE,

    CONSTRAINT "devoirs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "echeances_paiement" (
    "id" SERIAL NOT NULL,
    "preinscription_id" INTEGER,
    "type" VARCHAR(50) NOT NULL,
    "echeance" VARCHAR(50) NOT NULL,
    "montant" INTEGER NOT NULL,
    "date_echeance" DATE,
    "statut" VARCHAR(20) DEFAULT 'en_attente',
    "date_paiement" DATE,
    "reference_transaction" VARCHAR(100),
    "mode_paiement" VARCHAR(50),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "reinscription_id" INTEGER,

    CONSTRAINT "echeances_paiement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eleves" (
    "id" SERIAL NOT NULL,
    "utilisateur_id" INTEGER,
    "matricule" VARCHAR(50) NOT NULL,
    "date_naissance" DATE NOT NULL,
    "lieu_naissance" VARCHAR(100),
    "sexe" VARCHAR(1),
    "nationalite" VARCHAR(50) DEFAULT 'Guinéenne',
    "classe_id" INTEGER,
    "date_inscription" DATE DEFAULT CURRENT_DATE,
    "est_inscrit" BOOLEAN DEFAULT true,
    "carte_scolaire_url" TEXT,
    "photo_url" TEXT,

    CONSTRAINT "eleves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emprunts_bibliotheque" (
    "id" SERIAL NOT NULL,
    "livre_id" INTEGER,
    "eleve_id" INTEGER,
    "date_emprunt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "date_retour_prevue" TIMESTAMP(6) NOT NULL,
    "date_retour_reelle" TIMESTAMP(6),
    "statut" VARCHAR(20) DEFAULT 'en_cours',

    CONSTRAINT "emprunts_bibliotheque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enseignements" (
    "id" SERIAL NOT NULL,
    "enseignant_id" INTEGER,
    "classe_id" INTEGER,
    "matiere_id" INTEGER,
    "heures_semaine" DECIMAL(5,2),
    "heures_mois" DECIMAL(5,2),
    "heures_an" DECIMAL(5,2),
    "annee_scolaire_id" INTEGER,

    CONSTRAINT "enseignements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "examens" (
    "id" SERIAL NOT NULL,
    "enseignement_id" INTEGER,
    "titre" VARCHAR(255) NOT NULL,
    "duree_minutes" INTEGER,
    "date_debut" TIMESTAMP(6),
    "date_fin" TIMESTAMP(6),
    "est_actif" BOOLEAN DEFAULT true,
    "fichier_url" TEXT,

    CONSTRAINT "examens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "examens_eleves" (
    "id" SERIAL NOT NULL,
    "examen_id" INTEGER NOT NULL,
    "eleve_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "examens_eleves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "frais_scolaires" (
    "id" SERIAL NOT NULL,
    "nom" VARCHAR(100),
    "type_frais" VARCHAR(50) NOT NULL,
    "montant" INTEGER NOT NULL,
    "obligatoire" BOOLEAN DEFAULT true,
    "frequence" VARCHAR(50) DEFAULT 'mensuel',
    "niveau" VARCHAR(50),
    "annee_scolaire_id" INTEGER,
    "description" TEXT,

    CONSTRAINT "frais_scolaires_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inscriptions" (
    "id" SERIAL NOT NULL,
    "preinscription_id" INTEGER,
    "eleve_id" INTEGER,
    "parent_id" INTEGER,
    "numero_matricule" VARCHAR(50) NOT NULL,
    "date_inscription" DATE DEFAULT CURRENT_DATE,
    "annee_scolaire_id" INTEGER,
    "statut" VARCHAR(50) DEFAULT 'active',
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inscriptions_cantine" (
    "id" SERIAL NOT NULL,
    "eleve_id" INTEGER,
    "est_actif" BOOLEAN DEFAULT true,
    "solde" DECIMAL(12,2) DEFAULT 0,
    "preferences_alimentaires" TEXT,
    "allergies" TEXT,
    "date_inscription" DATE DEFAULT CURRENT_DATE,

    CONSTRAINT "inscriptions_cantine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inscriptions_transport" (
    "id" SERIAL NOT NULL,
    "eleve_id" INTEGER,
    "ligne_id" INTEGER,
    "date_debut" DATE,
    "date_fin" DATE,
    "est_actif" BOOLEAN DEFAULT true,

    CONSTRAINT "inscriptions_transport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lecons" (
    "id" SERIAL NOT NULL,
    "enseignement_id" INTEGER,
    "titre" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "contenu" TEXT,
    "fichier_url" TEXT,
    "video_url" TEXT,
    "date_publication" DATE DEFAULT CURRENT_DATE,

    CONSTRAINT "lecons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lien_parent_eleve" (
    "parent_id" INTEGER NOT NULL,
    "eleve_id" INTEGER NOT NULL,
    "lien" VARCHAR(50) DEFAULT 'parent',

    CONSTRAINT "lien_parent_eleve_pkey" PRIMARY KEY ("parent_id","eleve_id")
);

-- CreateTable
CREATE TABLE "lignes_transport" (
    "id" SERIAL NOT NULL,
    "nom" VARCHAR(100),
    "bus_id" INTEGER,
    "horaire_matin" TIME(6),
    "horaire_soir" TIME(6),
    "prix_abonnement" INTEGER,

    CONSTRAINT "lignes_transport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "livres_bibliotheque" (
    "id" SERIAL NOT NULL,
    "titre" VARCHAR(255) NOT NULL,
    "auteur" VARCHAR(255),
    "isbn" VARCHAR(50),
    "quantite" INTEGER DEFAULT 1,
    "disponible" INTEGER DEFAULT 1,
    "emplacement" VARCHAR(50),
    "categorie" VARCHAR(100),
    "image_url" TEXT,

    CONSTRAINT "livres_bibliotheque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs_activites" (
    "id" SERIAL NOT NULL,
    "utilisateur_id" INTEGER,
    "action" VARCHAR(255),
    "details" TEXT,
    "ip_address" VARCHAR(45),
    "date_action" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_activites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matieres" (
    "id" SERIAL NOT NULL,
    "nom" VARCHAR(100) NOT NULL,
    "coefficient" INTEGER DEFAULT 1,
    "description" TEXT,

    CONSTRAINT "matieres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menus_cantine" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "plat" VARCHAR(255),
    "accompagnement" VARCHAR(255),
    "dessert" VARCHAR(255),
    "prix" DECIMAL(10,2) DEFAULT 5000,
    "allergenes" TEXT,
    "calories" INTEGER,
    "regime_special" BOOLEAN DEFAULT false,

    CONSTRAINT "menus_cantine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" SERIAL NOT NULL,
    "expediteur_id" INTEGER,
    "destinataire_id" INTEGER,
    "sujet" VARCHAR(255),
    "contenu" TEXT,
    "est_lu" BOOLEAN DEFAULT false,
    "date_envoi" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mouvements_caisse" (
    "id" SERIAL NOT NULL,
    "type" VARCHAR(10) NOT NULL,
    "montant" INTEGER NOT NULL,
    "categorie" VARCHAR(100) NOT NULL,
    "sous_categorie" VARCHAR(100),
    "description" TEXT,
    "reference" VARCHAR(100),
    "date_mouvement" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exercice_annee" INTEGER NOT NULL DEFAULT EXTRACT(year FROM now()),
    "exercice_mois" INTEGER NOT NULL DEFAULT EXTRACT(month FROM now()),
    "saisi_par" INTEGER,
    "valide_par" INTEGER,
    "statut" VARCHAR(20) DEFAULT 'valide',
    "recu_url" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mouvements_caisse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" SERIAL NOT NULL,
    "eleve_id" INTEGER,
    "enseignement_id" INTEGER,
    "type_note" VARCHAR(50),
    "valeur" DECIMAL(5,2) NOT NULL,
    "coefficient" INTEGER DEFAULT 1,
    "date_saisie" DATE DEFAULT CURRENT_DATE,
    "commentaire" TEXT,
    "enseignant_id" INTEGER,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "options_qcm" (
    "id" SERIAL NOT NULL,
    "question_id" INTEGER,
    "option_texte" TEXT NOT NULL,
    "est_correcte" BOOLEAN DEFAULT false,

    CONSTRAINT "options_qcm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "options_quiz" (
    "id" SERIAL NOT NULL,
    "question_id" INTEGER,
    "option_texte" TEXT NOT NULL,
    "est_correcte" BOOLEAN DEFAULT false,
    "ordre" INTEGER,

    CONSTRAINT "options_quiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paiements" (
    "id" SERIAL NOT NULL,
    "eleve_id" INTEGER,
    "montant" INTEGER NOT NULL,
    "type_frais" VARCHAR(50),
    "mois" INTEGER,
    "annee" INTEGER,
    "mode_paiement" VARCHAR(50),
    "reference_transaction" VARCHAR(100),
    "statut" VARCHAR(20) DEFAULT 'valide',
    "date_paiement" DATE DEFAULT CURRENT_DATE,
    "reçu_url" TEXT,
    "saisie_par" INTEGER,
    "preinscription_id" INTEGER,
    "reinscription_id" INTEGER,

    CONSTRAINT "paiements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paiements_salaires" (
    "id" SERIAL NOT NULL,
    "personnel_id" INTEGER,
    "montant" INTEGER NOT NULL,
    "mois" INTEGER NOT NULL,
    "annee" INTEGER NOT NULL,
    "mode_paiement" VARCHAR(50),
    "reference_transaction" VARCHAR(100),
    "saisie_par" INTEGER,
    "statut" VARCHAR(20) DEFAULT 'paye',
    "date_paiement" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "paiements_salaires_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parents" (
    "id" SERIAL NOT NULL,
    "utilisateur_id" INTEGER,
    "profession" VARCHAR(100),
    "situation_matrimoniale" VARCHAR(100),

    CONSTRAINT "parents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participations_quiz" (
    "id" SERIAL NOT NULL,
    "quiz_id" INTEGER,
    "eleve_id" INTEGER,
    "date_debut" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "date_fin" TIMESTAMP(6),
    "score_total" INTEGER DEFAULT 0,
    "points_obtenus" INTEGER DEFAULT 0,
    "reponses_correctes" INTEGER DEFAULT 0,
    "reponses_totales" INTEGER DEFAULT 0,
    "pourcentage" DECIMAL(5,2) DEFAULT 0,
    "est_termine" BOOLEAN DEFAULT false,

    CONSTRAINT "participations_quiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personnels" (
    "id" SERIAL NOT NULL,
    "utilisateur_id" INTEGER,
    "matricule_personnel" VARCHAR(50) NOT NULL,
    "type" VARCHAR(50),
    "date_embauche" DATE DEFAULT CURRENT_DATE,
    "salaire_base" INTEGER,
    "carte_personnel_url" TEXT,
    "statut" VARCHAR(20) DEFAULT 'actif',
    "departement" VARCHAR(100),
    "prime_mensuelle" INTEGER DEFAULT 0,
    "mode_paiement_salaire" VARCHAR(50) DEFAULT 'virement',

    CONSTRAINT "personnels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preinscription_cantine" (
    "id" SERIAL NOT NULL,
    "preinscription_id" INTEGER,
    "menu_id" INTEGER,
    "prix" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "preinscription_cantine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preinscription_transport" (
    "id" SERIAL NOT NULL,
    "preinscription_id" INTEGER,
    "ligne_id" INTEGER,
    "prix" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "preinscription_transport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preinscriptions" (
    "id" SERIAL NOT NULL,
    "parent_id" INTEGER,
    "enfant_nom" VARCHAR(100) NOT NULL,
    "enfant_prenom" VARCHAR(100) NOT NULL,
    "date_naissance" DATE NOT NULL,
    "lieu_naissance" VARCHAR(100),
    "sexe" VARCHAR(10) NOT NULL,
    "niveau" VARCHAR(50) NOT NULL,
    "classe" VARCHAR(50) NOT NULL,
    "acte_naissance_url" TEXT,
    "photo_url" TEXT,
    "bulletin_url" TEXT,
    "statut" VARCHAR(50) DEFAULT 'en_attente',
    "numero_dossier" VARCHAR(50),
    "date_preinscription" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "observations" TEXT,
    "traite_par" INTEGER,
    "date_traitement" TIMESTAMP(6),
    "frais_montant" INTEGER DEFAULT 0,
    "frais_statut" VARCHAR(20) DEFAULT 'non_paye',
    "frais_mode_paiement" VARCHAR(50),
    "frais_reference" VARCHAR(100),
    "frais_date_paiement" TIMESTAMP(6),
    "plan_paiement_id" INTEGER,
    "montant_total_plan" INTEGER DEFAULT 0,
    "montant_restant_plan" INTEGER DEFAULT 0,
    "type_inscription" VARCHAR(50) DEFAULT 'inscription',
    "est_reinscription" BOOLEAN DEFAULT false,

    CONSTRAINT "preinscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "presences" (
    "id" SERIAL NOT NULL,
    "eleve_id" INTEGER,
    "classe_id" INTEGER,
    "date" DATE NOT NULL,
    "statut" VARCHAR(20),
    "heure_arrivee" TIME(6),
    "justificatif_url" TEXT,
    "enseignant_id" INTEGER,

    CONSTRAINT "presences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "presences_transport" (
    "id" SERIAL NOT NULL,
    "eleve_id" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "statut" VARCHAR(20) NOT NULL,
    "heure_arrivee" TIME(6),
    "commentaire" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "presences_transport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions_qcm" (
    "id" SERIAL NOT NULL,
    "examen_id" INTEGER,
    "question" TEXT NOT NULL,
    "points" INTEGER DEFAULT 1,
    "ordre" INTEGER,

    CONSTRAINT "questions_qcm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions_quiz" (
    "id" SERIAL NOT NULL,
    "categorie_id" INTEGER,
    "enseignement_id" INTEGER,
    "question" TEXT NOT NULL,
    "explication" TEXT,
    "difficulte" VARCHAR(20) DEFAULT 'facile',
    "points" INTEGER DEFAULT 1,
    "temps_secondes" INTEGER DEFAULT 30,
    "est_active" BOOLEAN DEFAULT true,
    "ordre" INTEGER,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,

    CONSTRAINT "questions_quiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz" (
    "id" SERIAL NOT NULL,
    "enseignement_id" INTEGER,
    "titre" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "type" VARCHAR(50) DEFAULT 'qcm',
    "duree_minutes" INTEGER DEFAULT 10,
    "est_actif" BOOLEAN DEFAULT true,
    "date_debut" TIMESTAMP(6),
    "date_fin" TIMESTAMP(6),
    "est_aleatoire" BOOLEAN DEFAULT false,
    "afficher_resultats" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "fichier_url" TEXT,

    CONSTRAINT "quiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_questions" (
    "id" SERIAL NOT NULL,
    "quiz_id" INTEGER,
    "question_id" INTEGER,
    "ordre" INTEGER,
    "points_personnalises" INTEGER,

    CONSTRAINT "quiz_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reinscriptions" (
    "id" SERIAL NOT NULL,
    "inscription_id" INTEGER,
    "eleve_id" INTEGER,
    "parent_id" INTEGER,
    "annee_scolaire_id" INTEGER,
    "classe_id" INTEGER,
    "montant_frais" INTEGER DEFAULT 500000,
    "frais_statut" VARCHAR(50) DEFAULT 'non_paye',
    "frais_mode_paiement" VARCHAR(50),
    "frais_reference" VARCHAR(100),
    "frais_date_paiement" TIMESTAMP(6),
    "statut" VARCHAR(50) DEFAULT 'en_attente',
    "date_reinscription" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "observations" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "acte_naissance_url" TEXT,
    "photo_url" TEXT,
    "bulletin_url" TEXT,
    "date_traitement" TIMESTAMP(6),
    "numero_dossier" VARCHAR(50),
    "enfant_nom" VARCHAR(100),
    "enfant_prenom" VARCHAR(100),
    "date_naissance" DATE,
    "lieu_naissance" VARCHAR(200),
    "sexe" VARCHAR(10),
    "niveau" VARCHAR(50),
    "classe_nom" VARCHAR(50),
    "parent_nom" VARCHAR(100),
    "parent_prenom" VARCHAR(100),
    "parent_email" VARCHAR(100),
    "parent_telephone" VARCHAR(20),
    "montant_total_plan" INTEGER DEFAULT 0,
    "montant_restant_plan" INTEGER DEFAULT 0,

    CONSTRAINT "reinscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reponses_eleves_qcm" (
    "id" SERIAL NOT NULL,
    "examen_id" INTEGER,
    "eleve_id" INTEGER,
    "question_id" INTEGER,
    "option_id" INTEGER,
    "date_reponse" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reponses_eleves_qcm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reponses_quiz" (
    "id" SERIAL NOT NULL,
    "participation_id" INTEGER,
    "question_id" INTEGER,
    "option_id" INTEGER,
    "est_correcte" BOOLEAN DEFAULT false,
    "temps_reponse_ms" INTEGER,
    "date_reponse" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reponses_quiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservations_cantine" (
    "id" SERIAL NOT NULL,
    "eleve_id" INTEGER,
    "menu_id" INTEGER,
    "date" DATE NOT NULL,
    "statut" VARCHAR(20) DEFAULT 'confirmee',
    "paye" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservations_cantine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reserves_cantine" (
    "id" SERIAL NOT NULL,
    "eleve_id" INTEGER,
    "date" DATE NOT NULL,
    "est_present" BOOLEAN DEFAULT false,
    "date_reservation" DATE DEFAULT CURRENT_DATE,

    CONSTRAINT "reserves_cantine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reset_tokens" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMP(6) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "used" BOOLEAN DEFAULT false,

    CONSTRAINT "reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services_annexes" (
    "id" SERIAL NOT NULL,
    "nom" VARCHAR(100) NOT NULL,
    "montant_mensuel" INTEGER NOT NULL,
    "type" VARCHAR(50) DEFAULT 'optionnel',
    "description" TEXT,
    "actif" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "services_annexes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" SERIAL NOT NULL,
    "utilisateur_id" INTEGER,
    "token" VARCHAR(255) NOT NULL,
    "expire_le" TIMESTAMP(6) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "soumissions_devoirs" (
    "id" SERIAL NOT NULL,
    "devoir_id" INTEGER,
    "eleve_id" INTEGER,
    "fichier_url" TEXT,
    "date_soumission" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "note" DECIMAL(5,2),
    "commentaire" TEXT,
    "est_retard" BOOLEAN DEFAULT false,

    CONSTRAINT "soumissions_devoirs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions_cantine" (
    "id" SERIAL NOT NULL,
    "eleve_id" INTEGER,
    "montant" DECIMAL(12,2) NOT NULL,
    "type" VARCHAR(20),
    "description" TEXT,
    "date" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_cantine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "utilisateurs" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "prenom" VARCHAR(100) NOT NULL,
    "nom" VARCHAR(100) NOT NULL,
    "telephone" VARCHAR(20),
    "adresse" TEXT,
    "photo_url" TEXT,
    "role" VARCHAR(50) NOT NULL,
    "est_actif" BOOLEAN DEFAULT true,
    "derniere_connexion" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "utilisateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ventes_librairie" (
    "id" SERIAL NOT NULL,
    "article_id" INTEGER,
    "eleve_id" INTEGER,
    "quantite" INTEGER NOT NULL DEFAULT 1,
    "montant_total" INTEGER NOT NULL,
    "date_vente" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "vendu_par" INTEGER,

    CONSTRAINT "ventes_librairie_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "budget_previsionnel_annee_categorie_code_key" ON "budget_previsionnel"("annee", "categorie_code");

-- CreateIndex
CREATE UNIQUE INDEX "bus_immatriculation_key" ON "bus"("immatriculation");

-- CreateIndex
CREATE UNIQUE INDEX "categories_depenses_code_key" ON "categories_depenses"("code");

-- CreateIndex
CREATE UNIQUE INDEX "categories_quiz_nom_key" ON "categories_quiz"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "commandes_librairie_numero_commande_key" ON "commandes_librairie"("numero_commande");

-- CreateIndex
CREATE INDEX "idx_depenses_annee_mois" ON "depenses"("exercice_annee", "exercice_mois");

-- CreateIndex
CREATE INDEX "idx_depenses_categorie" ON "depenses"("categorie");

-- CreateIndex
CREATE INDEX "idx_depenses_date" ON "depenses"("date_depense");

-- CreateIndex
CREATE INDEX "idx_echeances_paiement_reinscription_id" ON "echeances_paiement"("reinscription_id");

-- CreateIndex
CREATE UNIQUE INDEX "eleves_utilisateur_id_key" ON "eleves"("utilisateur_id");

-- CreateIndex
CREATE UNIQUE INDEX "eleves_matricule_key" ON "eleves"("matricule");

-- CreateIndex
CREATE INDEX "idx_eleves_classe" ON "eleves"("classe_id");

-- CreateIndex
CREATE INDEX "idx_eleves_matricule" ON "eleves"("matricule");

-- CreateIndex
CREATE INDEX "idx_enseignements_classe" ON "enseignements"("classe_id");

-- CreateIndex
CREATE INDEX "idx_enseignements_enseignant" ON "enseignements"("enseignant_id");

-- CreateIndex
CREATE INDEX "idx_examens_eleves_eleve_id" ON "examens_eleves"("eleve_id");

-- CreateIndex
CREATE INDEX "idx_examens_eleves_examen_id" ON "examens_eleves"("examen_id");

-- CreateIndex
CREATE UNIQUE INDEX "examens_eleves_examen_id_eleve_id_key" ON "examens_eleves"("examen_id", "eleve_id");

-- CreateIndex
CREATE UNIQUE INDEX "inscriptions_numero_matricule_key" ON "inscriptions"("numero_matricule");

-- CreateIndex
CREATE INDEX "idx_inscriptions_eleve" ON "inscriptions"("eleve_id");

-- CreateIndex
CREATE INDEX "idx_inscriptions_parent" ON "inscriptions"("parent_id");

-- CreateIndex
CREATE INDEX "idx_messages_destinataire" ON "messages"("destinataire_id", "est_lu");

-- CreateIndex
CREATE INDEX "idx_mouvements_caisse_annee_mois" ON "mouvements_caisse"("exercice_annee", "exercice_mois");

-- CreateIndex
CREATE INDEX "idx_mouvements_caisse_date" ON "mouvements_caisse"("date_mouvement");

-- CreateIndex
CREATE INDEX "idx_mouvements_caisse_type" ON "mouvements_caisse"("type");

-- CreateIndex
CREATE INDEX "idx_notes_eleve" ON "notes"("eleve_id");

-- CreateIndex
CREATE INDEX "idx_paiements_date" ON "paiements"("date_paiement");

-- CreateIndex
CREATE INDEX "idx_paiements_eleve" ON "paiements"("eleve_id");

-- CreateIndex
CREATE INDEX "idx_paiements_preinscription_id" ON "paiements"("preinscription_id");

-- CreateIndex
CREATE INDEX "idx_paiements_salaires_mois_annee" ON "paiements_salaires"("mois", "annee");

-- CreateIndex
CREATE UNIQUE INDEX "paiements_salaires_personnel_id_mois_annee_key" ON "paiements_salaires"("personnel_id", "mois", "annee");

-- CreateIndex
CREATE UNIQUE INDEX "parents_utilisateur_id_key" ON "parents"("utilisateur_id");

-- CreateIndex
CREATE UNIQUE INDEX "participations_quiz_quiz_id_eleve_id_key" ON "participations_quiz"("quiz_id", "eleve_id");

-- CreateIndex
CREATE UNIQUE INDEX "personnels_utilisateur_id_key" ON "personnels"("utilisateur_id");

-- CreateIndex
CREATE UNIQUE INDEX "personnels_matricule_personnel_key" ON "personnels"("matricule_personnel");

-- CreateIndex
CREATE UNIQUE INDEX "preinscriptions_numero_dossier_key" ON "preinscriptions"("numero_dossier");

-- CreateIndex
CREATE INDEX "idx_preinscriptions_date" ON "preinscriptions"("date_preinscription");

-- CreateIndex
CREATE INDEX "idx_preinscriptions_nom_enfant" ON "preinscriptions"("enfant_nom", "enfant_prenom");

-- CreateIndex
CREATE INDEX "idx_preinscriptions_numero_dossier" ON "preinscriptions"("numero_dossier");

-- CreateIndex
CREATE INDEX "idx_preinscriptions_parent_id" ON "preinscriptions"("parent_id");

-- CreateIndex
CREATE INDEX "idx_preinscriptions_statut" ON "preinscriptions"("statut");

-- CreateIndex
CREATE INDEX "idx_presences_date" ON "presences"("date");

-- CreateIndex
CREATE INDEX "idx_presences_transport_date" ON "presences_transport"("date");

-- CreateIndex
CREATE INDEX "idx_presences_transport_eleve" ON "presences_transport"("eleve_id");

-- CreateIndex
CREATE UNIQUE INDEX "presences_transport_eleve_id_date_key" ON "presences_transport"("eleve_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "quiz_questions_quiz_id_question_id_key" ON "quiz_questions"("quiz_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "reinscriptions_numero_dossier_key" ON "reinscriptions"("numero_dossier");

-- CreateIndex
CREATE INDEX "idx_reinscriptions_annee" ON "reinscriptions"("annee_scolaire_id");

-- CreateIndex
CREATE INDEX "idx_reinscriptions_eleve" ON "reinscriptions"("eleve_id");

-- CreateIndex
CREATE INDEX "idx_reinscriptions_statut" ON "reinscriptions"("statut");

-- CreateIndex
CREATE UNIQUE INDEX "unique_email_token" ON "reset_tokens"("email");

-- CreateIndex
CREATE INDEX "idx_reset_tokens_email" ON "reset_tokens"("email");

-- CreateIndex
CREATE INDEX "idx_reset_tokens_token" ON "reset_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "services_annexes_nom_key" ON "services_annexes"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_email_key" ON "utilisateurs"("email");

-- AddForeignKey
ALTER TABLE "annonces" ADD CONSTRAINT "annonces_classe_id_fkey" FOREIGN KEY ("classe_id") REFERENCES "classes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "annonces" ADD CONSTRAINT "annonces_publie_par_fkey" FOREIGN KEY ("publie_par") REFERENCES "utilisateurs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "avances_salaires" ADD CONSTRAINT "avances_salaires_accorde_par_fkey" FOREIGN KEY ("accorde_par") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "avances_salaires" ADD CONSTRAINT "avances_salaires_personnel_id_fkey" FOREIGN KEY ("personnel_id") REFERENCES "personnels"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "budget_previsionnel" ADD CONSTRAINT "budget_previsionnel_categorie_code_fkey" FOREIGN KEY ("categorie_code") REFERENCES "categories_depenses"("code") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_annee_scolaire_id_fkey" FOREIGN KEY ("annee_scolaire_id") REFERENCES "annees_scolaires"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_titulaire_id_fkey" FOREIGN KEY ("titulaire_id") REFERENCES "personnels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "commandes_fournitures" ADD CONSTRAINT "commandes_fournitures_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles_librairie"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "commandes_fournitures" ADD CONSTRAINT "commandes_fournitures_preinscription_id_fkey" FOREIGN KEY ("preinscription_id") REFERENCES "preinscriptions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "commandes_librairie" ADD CONSTRAINT "commandes_librairie_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "parents"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "commandes_librairie_articles" ADD CONSTRAINT "commandes_librairie_articles_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles_librairie"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "commandes_librairie_articles" ADD CONSTRAINT "commandes_librairie_articles_commande_id_fkey" FOREIGN KEY ("commande_id") REFERENCES "commandes_librairie"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "conges_personnel" ADD CONSTRAINT "conges_personnel_approuve_par_fkey" FOREIGN KEY ("approuve_par") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "conges_personnel" ADD CONSTRAINT "conges_personnel_personnel_id_fkey" FOREIGN KEY ("personnel_id") REFERENCES "personnels"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "contrats_personnel" ADD CONSTRAINT "contrats_personnel_personnel_id_fkey" FOREIGN KEY ("personnel_id") REFERENCES "personnels"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "depenses" ADD CONSTRAINT "depenses_saisi_par_fkey" FOREIGN KEY ("saisi_par") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "depenses" ADD CONSTRAINT "depenses_valide_par_fkey" FOREIGN KEY ("valide_par") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "devoirs" ADD CONSTRAINT "devoirs_enseignement_id_fkey" FOREIGN KEY ("enseignement_id") REFERENCES "enseignements"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "echeances_paiement" ADD CONSTRAINT "echeances_paiement_preinscription_id_fkey" FOREIGN KEY ("preinscription_id") REFERENCES "preinscriptions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "echeances_paiement" ADD CONSTRAINT "echeances_paiement_reinscription_id_fkey" FOREIGN KEY ("reinscription_id") REFERENCES "reinscriptions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "eleves" ADD CONSTRAINT "eleves_classe_id_fkey" FOREIGN KEY ("classe_id") REFERENCES "classes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "eleves" ADD CONSTRAINT "eleves_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "emprunts_bibliotheque" ADD CONSTRAINT "emprunts_bibliotheque_eleve_id_fkey" FOREIGN KEY ("eleve_id") REFERENCES "eleves"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "emprunts_bibliotheque" ADD CONSTRAINT "emprunts_bibliotheque_livre_id_fkey" FOREIGN KEY ("livre_id") REFERENCES "livres_bibliotheque"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "enseignements" ADD CONSTRAINT "enseignements_annee_scolaire_id_fkey" FOREIGN KEY ("annee_scolaire_id") REFERENCES "annees_scolaires"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "enseignements" ADD CONSTRAINT "enseignements_classe_id_fkey" FOREIGN KEY ("classe_id") REFERENCES "classes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "enseignements" ADD CONSTRAINT "enseignements_enseignant_id_fkey" FOREIGN KEY ("enseignant_id") REFERENCES "personnels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "enseignements" ADD CONSTRAINT "enseignements_matiere_id_fkey" FOREIGN KEY ("matiere_id") REFERENCES "matieres"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "examens" ADD CONSTRAINT "examens_enseignement_id_fkey" FOREIGN KEY ("enseignement_id") REFERENCES "enseignements"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "examens_eleves" ADD CONSTRAINT "examens_eleves_eleve_id_fkey" FOREIGN KEY ("eleve_id") REFERENCES "eleves"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "examens_eleves" ADD CONSTRAINT "examens_eleves_examen_id_fkey" FOREIGN KEY ("examen_id") REFERENCES "examens"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "frais_scolaires" ADD CONSTRAINT "frais_scolaires_annee_scolaire_id_fkey" FOREIGN KEY ("annee_scolaire_id") REFERENCES "annees_scolaires"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inscriptions" ADD CONSTRAINT "inscriptions_annee_scolaire_id_fkey" FOREIGN KEY ("annee_scolaire_id") REFERENCES "annees_scolaires"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inscriptions" ADD CONSTRAINT "inscriptions_eleve_id_fkey" FOREIGN KEY ("eleve_id") REFERENCES "eleves"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inscriptions" ADD CONSTRAINT "inscriptions_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "parents"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inscriptions" ADD CONSTRAINT "inscriptions_preinscription_id_fkey" FOREIGN KEY ("preinscription_id") REFERENCES "preinscriptions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inscriptions_cantine" ADD CONSTRAINT "inscriptions_cantine_eleve_id_fkey" FOREIGN KEY ("eleve_id") REFERENCES "eleves"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inscriptions_transport" ADD CONSTRAINT "inscriptions_transport_eleve_id_fkey" FOREIGN KEY ("eleve_id") REFERENCES "eleves"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inscriptions_transport" ADD CONSTRAINT "inscriptions_transport_ligne_id_fkey" FOREIGN KEY ("ligne_id") REFERENCES "lignes_transport"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lecons" ADD CONSTRAINT "lecons_enseignement_id_fkey" FOREIGN KEY ("enseignement_id") REFERENCES "enseignements"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lien_parent_eleve" ADD CONSTRAINT "lien_parent_eleve_eleve_id_fkey" FOREIGN KEY ("eleve_id") REFERENCES "eleves"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lien_parent_eleve" ADD CONSTRAINT "lien_parent_eleve_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "parents"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lignes_transport" ADD CONSTRAINT "lignes_transport_bus_id_fkey" FOREIGN KEY ("bus_id") REFERENCES "bus"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "logs_activites" ADD CONSTRAINT "logs_activites_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_destinataire_id_fkey" FOREIGN KEY ("destinataire_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_expediteur_id_fkey" FOREIGN KEY ("expediteur_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mouvements_caisse" ADD CONSTRAINT "mouvements_caisse_saisi_par_fkey" FOREIGN KEY ("saisi_par") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mouvements_caisse" ADD CONSTRAINT "mouvements_caisse_valide_par_fkey" FOREIGN KEY ("valide_par") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_eleve_id_fkey" FOREIGN KEY ("eleve_id") REFERENCES "eleves"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_enseignant_id_fkey" FOREIGN KEY ("enseignant_id") REFERENCES "personnels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_enseignement_id_fkey" FOREIGN KEY ("enseignement_id") REFERENCES "enseignements"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "options_qcm" ADD CONSTRAINT "options_qcm_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions_qcm"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "options_quiz" ADD CONSTRAINT "options_quiz_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions_quiz"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "paiements" ADD CONSTRAINT "paiements_eleve_id_fkey" FOREIGN KEY ("eleve_id") REFERENCES "eleves"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "paiements" ADD CONSTRAINT "paiements_preinscription_id_fkey" FOREIGN KEY ("preinscription_id") REFERENCES "preinscriptions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "paiements" ADD CONSTRAINT "paiements_reinscription_id_fkey" FOREIGN KEY ("reinscription_id") REFERENCES "reinscriptions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "paiements" ADD CONSTRAINT "paiements_saisie_par_fkey" FOREIGN KEY ("saisie_par") REFERENCES "utilisateurs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "paiements_salaires" ADD CONSTRAINT "paiements_salaires_personnel_id_fkey" FOREIGN KEY ("personnel_id") REFERENCES "personnels"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "paiements_salaires" ADD CONSTRAINT "paiements_salaires_saisie_par_fkey" FOREIGN KEY ("saisie_par") REFERENCES "utilisateurs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "parents" ADD CONSTRAINT "parents_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "participations_quiz" ADD CONSTRAINT "participations_quiz_eleve_id_fkey" FOREIGN KEY ("eleve_id") REFERENCES "eleves"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "participations_quiz" ADD CONSTRAINT "participations_quiz_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quiz"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "personnels" ADD CONSTRAINT "personnels_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "preinscription_cantine" ADD CONSTRAINT "preinscription_cantine_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "cantine_menus"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "preinscription_cantine" ADD CONSTRAINT "preinscription_cantine_preinscription_id_fkey" FOREIGN KEY ("preinscription_id") REFERENCES "preinscriptions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "preinscription_transport" ADD CONSTRAINT "preinscription_transport_ligne_id_fkey" FOREIGN KEY ("ligne_id") REFERENCES "lignes_transport"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "preinscription_transport" ADD CONSTRAINT "preinscription_transport_preinscription_id_fkey" FOREIGN KEY ("preinscription_id") REFERENCES "preinscriptions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "preinscriptions" ADD CONSTRAINT "preinscriptions_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "parents"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "preinscriptions" ADD CONSTRAINT "preinscriptions_traite_par_fkey" FOREIGN KEY ("traite_par") REFERENCES "utilisateurs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "presences" ADD CONSTRAINT "presences_classe_id_fkey" FOREIGN KEY ("classe_id") REFERENCES "classes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "presences" ADD CONSTRAINT "presences_eleve_id_fkey" FOREIGN KEY ("eleve_id") REFERENCES "eleves"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "presences" ADD CONSTRAINT "presences_enseignant_id_fkey" FOREIGN KEY ("enseignant_id") REFERENCES "personnels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "presences_transport" ADD CONSTRAINT "presences_transport_eleve_id_fkey" FOREIGN KEY ("eleve_id") REFERENCES "eleves"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "questions_qcm" ADD CONSTRAINT "questions_qcm_examen_id_fkey" FOREIGN KEY ("examen_id") REFERENCES "examens"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "questions_quiz" ADD CONSTRAINT "questions_quiz_categorie_id_fkey" FOREIGN KEY ("categorie_id") REFERENCES "categories_quiz"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "questions_quiz" ADD CONSTRAINT "questions_quiz_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "utilisateurs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "questions_quiz" ADD CONSTRAINT "questions_quiz_enseignement_id_fkey" FOREIGN KEY ("enseignement_id") REFERENCES "enseignements"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "quiz" ADD CONSTRAINT "quiz_enseignement_id_fkey" FOREIGN KEY ("enseignement_id") REFERENCES "enseignements"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions_quiz"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quiz"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reinscriptions" ADD CONSTRAINT "reinscriptions_annee_scolaire_id_fkey" FOREIGN KEY ("annee_scolaire_id") REFERENCES "annees_scolaires"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reinscriptions" ADD CONSTRAINT "reinscriptions_classe_id_fkey" FOREIGN KEY ("classe_id") REFERENCES "classes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reinscriptions" ADD CONSTRAINT "reinscriptions_eleve_id_fkey" FOREIGN KEY ("eleve_id") REFERENCES "eleves"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reinscriptions" ADD CONSTRAINT "reinscriptions_inscription_id_fkey" FOREIGN KEY ("inscription_id") REFERENCES "inscriptions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reinscriptions" ADD CONSTRAINT "reinscriptions_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "parents"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reponses_eleves_qcm" ADD CONSTRAINT "reponses_eleves_qcm_eleve_id_fkey" FOREIGN KEY ("eleve_id") REFERENCES "eleves"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reponses_eleves_qcm" ADD CONSTRAINT "reponses_eleves_qcm_examen_id_fkey" FOREIGN KEY ("examen_id") REFERENCES "examens"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reponses_eleves_qcm" ADD CONSTRAINT "reponses_eleves_qcm_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "options_qcm"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reponses_eleves_qcm" ADD CONSTRAINT "reponses_eleves_qcm_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions_qcm"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reponses_quiz" ADD CONSTRAINT "reponses_quiz_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "options_quiz"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reponses_quiz" ADD CONSTRAINT "reponses_quiz_participation_id_fkey" FOREIGN KEY ("participation_id") REFERENCES "participations_quiz"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reponses_quiz" ADD CONSTRAINT "reponses_quiz_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions_quiz"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reservations_cantine" ADD CONSTRAINT "reservations_cantine_eleve_id_fkey" FOREIGN KEY ("eleve_id") REFERENCES "eleves"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reservations_cantine" ADD CONSTRAINT "reservations_cantine_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "menus_cantine"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reserves_cantine" ADD CONSTRAINT "reserves_cantine_eleve_id_fkey" FOREIGN KEY ("eleve_id") REFERENCES "eleves"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "soumissions_devoirs" ADD CONSTRAINT "soumissions_devoirs_devoir_id_fkey" FOREIGN KEY ("devoir_id") REFERENCES "devoirs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "soumissions_devoirs" ADD CONSTRAINT "soumissions_devoirs_eleve_id_fkey" FOREIGN KEY ("eleve_id") REFERENCES "eleves"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transactions_cantine" ADD CONSTRAINT "transactions_cantine_eleve_id_fkey" FOREIGN KEY ("eleve_id") REFERENCES "eleves"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ventes_librairie" ADD CONSTRAINT "ventes_librairie_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles_librairie"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ventes_librairie" ADD CONSTRAINT "ventes_librairie_eleve_id_fkey" FOREIGN KEY ("eleve_id") REFERENCES "eleves"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ventes_librairie" ADD CONSTRAINT "ventes_librairie_vendu_par_fkey" FOREIGN KEY ("vendu_par") REFERENCES "utilisateurs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
