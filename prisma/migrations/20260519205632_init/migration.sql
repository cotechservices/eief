-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'DIRECTEUR_GENERAL', 'DIRECTEUR_ETUDES', 'COMPTABLE', 'SECRETARIAT', 'SURVEILLANT', 'ENSEIGNANT', 'PARENT', 'ELEVE');

-- CreateTable
CREATE TABLE "Utilisateur" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "telephone" TEXT,
    "role" "Role" NOT NULL DEFAULT 'PARENT',
    "estActif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Utilisateur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Eleve" (
    "id" SERIAL NOT NULL,
    "utilisateurId" INTEGER NOT NULL,
    "matricule" TEXT NOT NULL,
    "dateNaissance" TIMESTAMP(3) NOT NULL,
    "classeId" INTEGER,
    "dateInscription" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estInscrit" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Eleve_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Classe" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "niveau" TEXT NOT NULL,
    "salle" TEXT,
    "capaciteMax" INTEGER NOT NULL DEFAULT 30,
    "titulaireId" INTEGER,
    "anneeScolaireId" INTEGER NOT NULL,

    CONSTRAINT "Classe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enseignement" (
    "id" SERIAL NOT NULL,
    "enseignantId" INTEGER NOT NULL,
    "classeId" INTEGER NOT NULL,
    "matiereId" INTEGER NOT NULL,
    "heuresSemaine" DECIMAL(5,2),
    "anneeScolaireId" INTEGER NOT NULL,

    CONSTRAINT "Enseignement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Matiere" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "coefficient" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Matiere_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lecon" (
    "id" SERIAL NOT NULL,
    "enseignementId" INTEGER NOT NULL,
    "titre" TEXT NOT NULL,
    "contenu" TEXT,
    "fichierUrl" TEXT,
    "videoUrl" TEXT,
    "datePublication" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lecon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Devoir" (
    "id" SERIAL NOT NULL,
    "enseignementId" INTEGER NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "fichierUrl" TEXT,
    "dateLimite" TIMESTAMP(3) NOT NULL,
    "datePublication" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Devoir_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SoumissionDevoir" (
    "id" SERIAL NOT NULL,
    "devoirId" INTEGER NOT NULL,
    "eleveId" INTEGER NOT NULL,
    "fichierUrl" TEXT NOT NULL,
    "dateSoumission" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" DECIMAL(5,2),
    "commentaire" TEXT,
    "isOffline" BOOLEAN NOT NULL DEFAULT false,
    "syncId" TEXT,

    CONSTRAINT "SoumissionDevoir_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Presence" (
    "id" SERIAL NOT NULL,
    "eleveId" INTEGER NOT NULL,
    "classeId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "statut" TEXT NOT NULL,
    "heureArrivee" TIMESTAMP(3),
    "enseignantId" INTEGER,
    "isOffline" BOOLEAN NOT NULL DEFAULT false,
    "syncId" TEXT,

    CONSTRAINT "Presence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Paiement" (
    "id" SERIAL NOT NULL,
    "eleveId" INTEGER NOT NULL,
    "montant" INTEGER NOT NULL,
    "typeFrais" TEXT NOT NULL,
    "modePaiement" TEXT NOT NULL,
    "referenceTransaction" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'valide',
    "datePaiement" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recuUrl" TEXT,
    "saisiePar" INTEGER,

    CONSTRAINT "Paiement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" SERIAL NOT NULL,
    "eleveId" INTEGER NOT NULL,
    "enseignementId" INTEGER NOT NULL,
    "valeur" DECIMAL(5,2) NOT NULL,
    "coefficient" INTEGER NOT NULL DEFAULT 1,
    "dateSaisie" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "commentaire" TEXT,
    "enseignantId" INTEGER,
    "isOffline" BOOLEAN NOT NULL DEFAULT false,
    "syncId" TEXT,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" SERIAL NOT NULL,
    "expediteurId" INTEGER NOT NULL,
    "destinataireId" INTEGER NOT NULL,
    "sujet" TEXT,
    "contenu" TEXT NOT NULL,
    "estLu" BOOLEAN NOT NULL DEFAULT false,
    "dateEnvoi" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isOffline" BOOLEAN NOT NULL DEFAULT false,
    "syncId" TEXT,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Parent" (
    "id" SERIAL NOT NULL,
    "utilisateurId" INTEGER NOT NULL,
    "profession" TEXT,

    CONSTRAINT "Parent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LienParentEleve" (
    "parentId" INTEGER NOT NULL,
    "eleveId" INTEGER NOT NULL,
    "lien" TEXT NOT NULL DEFAULT 'parent',

    CONSTRAINT "LienParentEleve_pkey" PRIMARY KEY ("parentId","eleveId")
);

-- CreateTable
CREATE TABLE "Personnel" (
    "id" SERIAL NOT NULL,
    "utilisateurId" INTEGER NOT NULL,
    "matriculePersonnel" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "dateEmbauche" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "salaireBase" INTEGER,

    CONSTRAINT "Personnel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Utilisateur_email_key" ON "Utilisateur"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Eleve_utilisateurId_key" ON "Eleve"("utilisateurId");

-- CreateIndex
CREATE UNIQUE INDEX "Eleve_matricule_key" ON "Eleve"("matricule");

-- CreateIndex
CREATE UNIQUE INDEX "Parent_utilisateurId_key" ON "Parent"("utilisateurId");

-- CreateIndex
CREATE UNIQUE INDEX "Personnel_utilisateurId_key" ON "Personnel"("utilisateurId");

-- CreateIndex
CREATE UNIQUE INDEX "Personnel_matriculePersonnel_key" ON "Personnel"("matriculePersonnel");

-- AddForeignKey
ALTER TABLE "Eleve" ADD CONSTRAINT "Eleve_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Eleve" ADD CONSTRAINT "Eleve_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "Classe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enseignement" ADD CONSTRAINT "Enseignement_enseignantId_fkey" FOREIGN KEY ("enseignantId") REFERENCES "Personnel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enseignement" ADD CONSTRAINT "Enseignement_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "Classe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enseignement" ADD CONSTRAINT "Enseignement_matiereId_fkey" FOREIGN KEY ("matiereId") REFERENCES "Matiere"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lecon" ADD CONSTRAINT "Lecon_enseignementId_fkey" FOREIGN KEY ("enseignementId") REFERENCES "Enseignement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Devoir" ADD CONSTRAINT "Devoir_enseignementId_fkey" FOREIGN KEY ("enseignementId") REFERENCES "Enseignement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoumissionDevoir" ADD CONSTRAINT "SoumissionDevoir_devoirId_fkey" FOREIGN KEY ("devoirId") REFERENCES "Devoir"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoumissionDevoir" ADD CONSTRAINT "SoumissionDevoir_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "Eleve"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presence" ADD CONSTRAINT "Presence_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "Eleve"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presence" ADD CONSTRAINT "Presence_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "Classe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paiement" ADD CONSTRAINT "Paiement_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "Eleve"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "Eleve"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_enseignementId_fkey" FOREIGN KEY ("enseignementId") REFERENCES "Enseignement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_expediteurId_fkey" FOREIGN KEY ("expediteurId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_destinataireId_fkey" FOREIGN KEY ("destinataireId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parent" ADD CONSTRAINT "Parent_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LienParentEleve" ADD CONSTRAINT "LienParentEleve_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LienParentEleve" ADD CONSTRAINT "LienParentEleve_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "Eleve"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Personnel" ADD CONSTRAINT "Personnel_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
