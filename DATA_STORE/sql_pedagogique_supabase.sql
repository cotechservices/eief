-- ============================================================
-- SQL PÉDAGOGIQUE EIEF — À exécuter dans Supabase SQL Editor
-- Fonctionnalités : Notes, Devoirs, QCM, Leçons, Soumissions
-- Date : 2026-06-24
-- ============================================================

-- ============================================================
-- ÉTAPE 1 : Vérifier / Créer l'année scolaire active
-- ============================================================
INSERT INTO public.annees_scolaires (libelle, date_debut, date_fin, est_active)
VALUES ('2025-2026', '2025-09-01', '2026-06-30', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- ÉTAPE 2 : S'assurer que les contraintes CHECK sur utilisateurs
--           incluent bien ENSEIGNANT et ELEVE
-- ============================================================
-- (Déjà présent dans votre BD selon le backup — pas besoin de recréer)

-- ============================================================
-- ÉTAPE 3 : Ajouter des utilisateurs de test si inexistants
-- ============================================================
-- Mot de passe pour tous : "test1234" (bcrypt hash)
-- Hash généré avec bcrypt cost=10 : $2b$10$rQOJuMJ9B.XvTw2zijkxYOvLsM4F.kF0dRKp1z4cjBU/RFBQ3yw5S

-- Enseignant de test
INSERT INTO public.utilisateurs (email, password, prenom, nom, telephone, role, est_actif)
VALUES (
  'enseignant.test@eief.gn',
  '$2b$10$rQOJuMJ9B.XvTw2zijkxYOvLsM4F.kF0dRKp1z4cjBU/RFBQ3yw5S',
  'Mamadou', 'Diallo', '+224 620 000 001',
  'ENSEIGNANT', true
)
ON CONFLICT (email) DO NOTHING;

-- Élève de test
INSERT INTO public.utilisateurs (email, password, prenom, nom, telephone, role, est_actif)
VALUES (
  'eleve.test@eief.gn',
  '$2b$10$rQOJuMJ9B.XvTw2zijkxYOvLsM4F.kF0dRKp1z4cjBU/RFBQ3yw5S',
  'Ibrahim', 'Konaté', '+224 620 000 002',
  'ELEVE', true
)
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- ÉTAPE 4 : Créer une classe de test
-- ============================================================
INSERT INTO public.classes (nom, niveau, salle, capacite_max, annee_scolaire_id)
SELECT '5ème A', '5ème', 'Salle 12', 30, as2.id
FROM public.annees_scolaires as2 WHERE as2.est_active = true
ON CONFLICT DO NOTHING;

-- ============================================================
-- ÉTAPE 5 : Créer le personnel enseignant lié à l'utilisateur
-- ============================================================
INSERT INTO public.personnels (utilisateur_id, matricule_personnel, type, date_embauche, salaire_base, statut)
SELECT u.id, 'ENS-2025-001', 'enseignant', '2025-09-01', 2500000, 'actif'
FROM public.utilisateurs u
WHERE u.email = 'enseignant.test@eief.gn'
AND NOT EXISTS (SELECT 1 FROM public.personnels p WHERE p.utilisateur_id = u.id);

-- ============================================================
-- ÉTAPE 6 : Créer l'élève lié à l'utilisateur + classe
-- ============================================================
INSERT INTO public.eleves (utilisateur_id, matricule, date_naissance, lieu_naissance, sexe, nationalite, classe_id, est_inscrit)
SELECT u.id, 'EL-2025-001', '2012-03-15', 'Conakry', 'M', 'Guinéenne', c.id, true
FROM public.utilisateurs u, public.classes c
WHERE u.email = 'eleve.test@eief.gn'
AND c.nom = '5ème A'
AND NOT EXISTS (SELECT 1 FROM public.eleves e WHERE e.utilisateur_id = u.id);

-- ============================================================
-- ÉTAPE 7 : Matières
-- ============================================================
INSERT INTO public.matieres (nom, coefficient, description) VALUES
  ('Mathématiques', 3, 'Algèbre, géométrie, calcul'),
  ('Français', 3, 'Grammaire, rédaction, littérature'),
  ('Anglais', 2, 'Langue anglaise'),
  ('Histoire-Géographie', 2, 'Histoire et géographie'),
  ('Sciences de la Vie et de la Terre', 2, 'SVT'),
  ('Physique-Chimie', 2, 'Sciences physiques'),
  ('Éducation Civique', 1, 'Citoyenneté')
ON CONFLICT DO NOTHING;

-- ============================================================
-- ÉTAPE 8 : Enseignements (lier enseignant → classe → matière)
-- ============================================================
INSERT INTO public.enseignements (enseignant_id, classe_id, matiere_id, heures_semaine, annee_scolaire_id)
SELECT p.id, c.id, m.id, 
  CASE m.nom
    WHEN 'Mathématiques' THEN 6
    WHEN 'Français' THEN 6
    WHEN 'Anglais' THEN 4
    WHEN 'Histoire-Géographie' THEN 3
    WHEN 'Sciences de la Vie et de la Terre' THEN 3
    WHEN 'Physique-Chimie' THEN 3
    WHEN 'Éducation Civique' THEN 2
  END,
  an.id
FROM public.personnels p
JOIN public.utilisateurs u ON u.id = p.utilisateur_id
CROSS JOIN public.classes c
CROSS JOIN public.matieres m
CROSS JOIN public.annees_scolaires an
WHERE u.email = 'enseignant.test@eief.gn'
  AND c.nom = '5ème A'
  AND an.est_active = true
  AND m.nom IN ('Mathématiques', 'Français', 'Anglais', 'Histoire-Géographie', 'Sciences de la Vie et de la Terre', 'Physique-Chimie', 'Éducation Civique')
ON CONFLICT DO NOTHING;

-- ============================================================
-- ÉTAPE 9 : Notes de l'élève
-- ============================================================
INSERT INTO public.notes (eleve_id, enseignement_id, type_note, valeur, coefficient, date_saisie, commentaire, enseignant_id)
SELECT e.id, en.id, 'devoir', note_val, m.coefficient, note_date, commentaire, p.id
FROM public.eleves e
JOIN public.utilisateurs ue ON ue.id = e.utilisateur_id
CROSS JOIN public.enseignements en
JOIN public.matieres m ON m.id = en.matiere_id
JOIN public.personnels p ON p.id = en.enseignant_id
JOIN public.utilisateurs up ON up.id = p.utilisateur_id
CROSS JOIN (VALUES 
  ('Mathématiques', 15.5, '2025-10-15'::date, 'Très bon travail'),
  ('Mathématiques', 13.0, '2025-11-20'::date, 'Bien, quelques erreurs'),
  ('Français', 14.0, '2025-10-18'::date, 'Bonne rédaction'),
  ('Français', 12.5, '2025-11-25'::date, 'À améliorer'),
  ('Anglais', 16.0, '2025-10-22'::date, 'Excellent'),
  ('Histoire-Géographie', 11.5, '2025-11-05'::date, 'Passable'),
  ('Sciences de la Vie et de la Terre', 13.5, '2025-11-10'::date, 'Bien'),
  ('Physique-Chimie', 10.5, '2025-11-15'::date, 'Peut mieux faire'),
  ('Éducation Civique', 17.0, '2025-11-28'::date, 'Très engagé')
) AS v(mat_nom, note_val, note_date, commentaire)
WHERE ue.email = 'eleve.test@eief.gn'
  AND up.email = 'enseignant.test@eief.gn'
  AND m.nom = v.mat_nom
ON CONFLICT DO NOTHING;

-- Notes compositions (2ème trimestre)
INSERT INTO public.notes (eleve_id, enseignement_id, type_note, valeur, coefficient, date_saisie, commentaire, enseignant_id)
SELECT e.id, en.id, 'composition', note_val, m.coefficient * 2, note_date, commentaire, p.id
FROM public.eleves e
JOIN public.utilisateurs ue ON ue.id = e.utilisateur_id
CROSS JOIN public.enseignements en
JOIN public.matieres m ON m.id = en.matiere_id
JOIN public.personnels p ON p.id = en.enseignant_id
JOIN public.utilisateurs up ON up.id = p.utilisateur_id
CROSS JOIN (VALUES 
  ('Mathématiques', 14.0, '2026-01-20'::date, 'Bonne composition'),
  ('Français', 13.5, '2026-01-22'::date, 'Bien'),
  ('Anglais', 15.0, '2026-01-23'::date, 'Très bien'),
  ('Histoire-Géographie', 12.0, '2026-01-24'::date, 'Correct'),
  ('Sciences de la Vie et de la Terre', 14.5, '2026-01-25'::date, 'Bien'),
  ('Physique-Chimie', 11.0, '2026-01-26'::date, 'À travailler'),
  ('Éducation Civique', 16.5, '2026-01-27'::date, 'Excellent')
) AS v(mat_nom, note_val, note_date, commentaire)
WHERE ue.email = 'eleve.test@eief.gn'
  AND up.email = 'enseignant.test@eief.gn'
  AND m.nom = v.mat_nom
ON CONFLICT DO NOTHING;

-- ============================================================
-- ÉTAPE 10 : Leçons (espace révision)
-- ============================================================
INSERT INTO public.lecons (enseignement_id, titre, description, contenu, date_publication)
SELECT en.id, lecon_titre, lecon_desc, lecon_contenu, lecon_date
FROM public.enseignements en
JOIN public.matieres m ON m.id = en.matiere_id
JOIN public.personnels p ON p.id = en.enseignant_id
JOIN public.utilisateurs u ON u.id = p.utilisateur_id
CROSS JOIN (VALUES
  ('Mathématiques', 'Les équations du premier degré', 'Résolution d''équations ax+b=0', 
   '# Les équations du premier degré

## Définition
Une équation du premier degré est de la forme **ax + b = 0** où a ≠ 0.

## Méthode de résolution
1. Isoler le terme en x
2. Diviser par le coefficient a
3. Vérifier la solution

## Exemple
Résoudre : 3x + 6 = 0
- 3x = -6
- x = -6/3
- **x = -2**

## Exercices
1. Résoudre : 2x - 8 = 0
2. Résoudre : 5x + 15 = 0
3. Résoudre : -x + 4 = 0',
   '2025-10-01'::date),
   
  ('Mathématiques', 'Les fractions et opérations', 'Addition, soustraction, multiplication et division de fractions',
   '# Les fractions

## Addition de fractions
Pour additionner des fractions, il faut un **dénominateur commun**.

Exemple : 1/3 + 1/4 = 4/12 + 3/12 = **7/12**

## Multiplication de fractions
Multiplier numérateur par numérateur et dénominateur par dénominateur.

Exemple : 2/3 × 3/4 = 6/12 = **1/2**',
   '2025-10-15'::date),
   
  ('Français', 'La rédaction descriptive', 'Techniques de description en français',
   '# La rédaction descriptive

## Qu''est-ce qu''une description ?
La description peint un tableau d''un lieu, d''un personnage ou d''un objet.

## Les outils de la description
- **Adjectifs qualificatifs** : grand, beau, mystérieux
- **Comparaisons** : comme, tel que
- **Métaphores** : La mer est un miroir

## Plan d''une description
1. Vue d''ensemble
2. Détails importants
3. Atmosphère / impression finale',
   '2025-10-05'::date),
   
  ('Français', 'La conjugaison : passé composé', 'Formation et emploi du passé composé',
   '# Le Passé Composé

## Formation
**Auxiliaire (avoir/être) au présent + participe passé**

## Avec AVOIR
J''ai mangé, tu as parlé, il a fini...

## Avec ÊTRE (verbes de mouvement et pronominaux)
Je suis allé(e), tu es venu(e), il est parti...

## Accord du participe passé
Avec être : accord avec le sujet
Avec avoir : accord avec le COD placé avant',
   '2025-10-20'::date),
   
  ('Anglais', 'Present Simple vs Present Continuous', 'Différence et utilisation des deux temps du présent',
   '# Present Simple vs Present Continuous

## Present Simple
**Usage** : habitudes, vérités générales
**Forme** : Subject + V (+ s à la 3ème personne)
**Exemple** : She goes to school every day.

## Present Continuous
**Usage** : action en cours
**Forme** : Subject + to be + V-ing
**Exemple** : She is studying right now.

## Signal words
- Simple : always, usually, every day
- Continuous : now, at the moment, currently',
   '2025-10-10'::date),
   
  ('Histoire-Géographie', 'La Première Guerre Mondiale', 'Causes, déroulement et conséquences de la Grande Guerre',
   '# La Première Guerre Mondiale (1914-1918)

## Les causes
1. **Nationalisme** exacerbé en Europe
2. **Alliances** : Triple Entente vs Triple Alliance
3. **Impérialisme** et rivalités coloniales
4. **L''étincelle** : assassinat de François-Ferdinand (28 juin 1914)

## Les grandes étapes
- 1914 : Guerre de mouvement
- 1915-1917 : Guerre de tranchées
- 1918 : Victoire des Alliés

## Les conséquences
- 18 millions de morts
- Traité de Versailles (1919)
- Début du déclin européen',
   '2025-11-01'::date),
   
  ('Sciences de la Vie et de la Terre', 'La cellule : unité du vivant', 'Structure et fonctions de la cellule',
   '# La cellule

## Définition
La cellule est la plus petite unité structurale et fonctionnelle du vivant.

## Types de cellules
1. **Cellule procaryote** : sans noyau (bactéries)
2. **Cellule eucaryote** : avec noyau (animaux, plantes)

## Les organites principaux
- **Noyau** : contient l''ADN
- **Mitochondries** : production d''énergie (ATP)
- **Membrane cellulaire** : protection et échanges
- **Cytoplasme** : milieu intérieur

## Cellule végétale vs animale
La cellule végétale possède en plus : chloroplastes et paroi cellulaire',
   '2025-11-05'::date),
   
  ('Physique-Chimie', 'Les états de la matière', 'Solide, liquide et gaz : propriétés et changements',
   '# Les états de la matière

## Les 3 états
- **Solide** : forme et volume définis
- **Liquide** : volume défini, forme variable
- **Gaz** : forme et volume variables

## Les changements d''état
| Changement | Nom |
|-----------|-----|
| Solide → Liquide | Fusion |
| Liquide → Gaz | Vaporisation |
| Gaz → Liquide | Condensation |
| Liquide → Solide | Solidification |
| Solide → Gaz | Sublimation |

## L''eau
- Fusion : 0°C
- Ébullition : 100°C (à pression normale)',
   '2025-11-10'::date)
) AS v(mat_nom, lecon_titre, lecon_desc, lecon_contenu, lecon_date)
WHERE u.email = 'enseignant.test@eief.gn'
  AND m.nom = v.mat_nom
ON CONFLICT DO NOTHING;

-- ============================================================
-- ÉTAPE 11 : Devoirs envoyés par l'enseignant
-- ============================================================
INSERT INTO public.devoirs (enseignement_id, titre, description, date_limite, date_publication)
SELECT en.id, devoir_titre, devoir_desc, devoir_limite, devoir_pub
FROM public.enseignements en
JOIN public.matieres m ON m.id = en.matiere_id
JOIN public.personnels p ON p.id = en.enseignant_id
JOIN public.utilisateurs u ON u.id = p.utilisateur_id
CROSS JOIN (VALUES
  ('Mathématiques', 'Exercices sur les équations', 
   'Résoudre les exercices 1 à 10 de la page 45 du manuel. Montrer toutes les étapes de résolution.',
   '2026-07-05'::date, '2026-06-24'::date),
  ('Mathématiques', 'Problème de géométrie', 
   'Calculer l''aire et le périmètre des figures géométriques de la fiche distribuée en classe.',
   '2026-07-10'::date, '2026-06-24'::date),
  ('Français', 'Rédaction : Ma ville idéale', 
   'Écrire une rédaction descriptive de 300 mots décrivant votre ville idéale. Utiliser les figures de style étudiées.',
   '2026-07-08'::date, '2026-06-24'::date),
  ('Anglais', 'Write about your daily routine', 
   'Write a paragraph of 150 words describing your daily routine using Present Simple and Present Continuous.',
   '2026-07-07'::date, '2026-06-24'::date),
  ('Histoire-Géographie', 'Dissertation : Causes de la 1ère Guerre Mondiale', 
   'Rédiger une dissertation structurée (introduction, développement, conclusion) sur les causes de la Première Guerre Mondiale.',
   '2026-07-12'::date, '2026-06-24'::date),
  ('Sciences de la Vie et de la Terre', 'Schéma de la cellule animale', 
   'Dessiner et légender un schéma complet de la cellule animale avec tous les organites vus en cours.',
   '2026-07-06'::date, '2026-06-24'::date)
) AS v(mat_nom, devoir_titre, devoir_desc, devoir_limite, devoir_pub)
WHERE u.email = 'enseignant.test@eief.gn'
  AND m.nom = v.mat_nom
ON CONFLICT DO NOTHING;

-- ============================================================
-- ÉTAPE 12 : Examens QCM
-- ============================================================
INSERT INTO public.examens (enseignement_id, titre, duree_minutes, date_debut, date_fin, est_actif)
SELECT en.id, examen_titre, duree, debut, fin, true
FROM public.enseignements en
JOIN public.matieres m ON m.id = en.matiere_id
JOIN public.personnels p ON p.id = en.enseignant_id
JOIN public.utilisateurs u ON u.id = p.utilisateur_id
CROSS JOIN (VALUES
  ('Mathématiques', 'QCM — Équations du premier degré', 20, 
   '2026-07-01 08:00:00'::timestamp, '2026-07-15 23:59:00'::timestamp),
  ('Français', 'QCM — Conjugaison et grammaire', 15, 
   '2026-07-01 08:00:00'::timestamp, '2026-07-15 23:59:00'::timestamp),
  ('Anglais', 'QCM — Present Simple & Continuous', 15, 
   '2026-07-01 08:00:00'::timestamp, '2026-07-15 23:59:00'::timestamp),
  ('Sciences de la Vie et de la Terre', 'QCM — La cellule', 15,
   '2026-07-01 08:00:00'::timestamp, '2026-07-15 23:59:00'::timestamp)
) AS v(mat_nom, examen_titre, duree, debut, fin)
WHERE u.email = 'enseignant.test@eief.gn'
  AND m.nom = v.mat_nom
ON CONFLICT DO NOTHING;

-- ============================================================
-- ÉTAPE 13 : Questions QCM — Mathématiques
-- ============================================================
DO $$
DECLARE
  v_examen_id INTEGER;
  v_q1_id INTEGER; v_q2_id INTEGER; v_q3_id INTEGER; v_q4_id INTEGER; v_q5_id INTEGER;
BEGIN
  -- Trouver l'examen Mathématiques QCM
  SELECT ex.id INTO v_examen_id
  FROM public.examens ex
  JOIN public.enseignements en ON en.id = ex.enseignement_id
  JOIN public.matieres m ON m.id = en.matiere_id
  WHERE m.nom = 'Mathématiques' AND ex.titre LIKE '%Équations%'
  LIMIT 1;

  IF v_examen_id IS NULL THEN RETURN; END IF;

  -- Question 1
  INSERT INTO public.questions_qcm (examen_id, question, points, ordre)
  VALUES (v_examen_id, 'Quelle est la solution de l''équation 2x + 4 = 0 ?', 2, 1)
  RETURNING id INTO v_q1_id;
  
  INSERT INTO public.options_qcm (question_id, option_texte, est_correcte) VALUES
    (v_q1_id, 'x = 2', false),
    (v_q1_id, 'x = -2', true),
    (v_q1_id, 'x = 4', false),
    (v_q1_id, 'x = -4', false);

  -- Question 2
  INSERT INTO public.questions_qcm (examen_id, question, points, ordre)
  VALUES (v_examen_id, 'Si 3x - 9 = 0, alors x vaut :', 2, 2)
  RETURNING id INTO v_q2_id;
  
  INSERT INTO public.options_qcm (question_id, option_texte, est_correcte) VALUES
    (v_q2_id, 'x = 9', false),
    (v_q2_id, 'x = -3', false),
    (v_q2_id, 'x = 3', true),
    (v_q2_id, 'x = 6', false);

  -- Question 3
  INSERT INTO public.questions_qcm (examen_id, question, points, ordre)
  VALUES (v_examen_id, 'Laquelle de ces équations n''a pas de solution dans R ?', 2, 3)
  RETURNING id INTO v_q3_id;
  
  INSERT INTO public.options_qcm (question_id, option_texte, est_correcte) VALUES
    (v_q3_id, '2x + 6 = 0', false),
    (v_q3_id, '0x + 5 = 0', true),
    (v_q3_id, '4x - 8 = 0', false),
    (v_q3_id, 'x + 1 = 0', false);

  -- Question 4
  INSERT INTO public.questions_qcm (examen_id, question, points, ordre)
  VALUES (v_examen_id, 'Résoudre : -x + 7 = 0. La réponse est :', 2, 4)
  RETURNING id INTO v_q4_id;
  
  INSERT INTO public.options_qcm (question_id, option_texte, est_correcte) VALUES
    (v_q4_id, 'x = -7', false),
    (v_q4_id, 'x = 0', false),
    (v_q4_id, 'x = 7', true),
    (v_q4_id, 'x = 1', false);

  -- Question 5
  INSERT INTO public.questions_qcm (examen_id, question, points, ordre)
  VALUES (v_examen_id, 'Une équation du premier degré ax + b = 0 a toujours une solution unique si :', 2, 5)
  RETURNING id INTO v_q5_id;
  
  INSERT INTO public.options_qcm (question_id, option_texte, est_correcte) VALUES
    (v_q5_id, 'a = 0', false),
    (v_q5_id, 'b = 0', false),
    (v_q5_id, 'a ≠ 0', true),
    (v_q5_id, 'a = b', false);
END $$;

-- ============================================================
-- ÉTAPE 14 : Questions QCM — Français
-- ============================================================
DO $$
DECLARE
  v_examen_id INTEGER;
  v_q1_id INTEGER; v_q2_id INTEGER; v_q3_id INTEGER; v_q4_id INTEGER; v_q5_id INTEGER;
BEGIN
  SELECT ex.id INTO v_examen_id
  FROM public.examens ex
  JOIN public.enseignements en ON en.id = ex.enseignement_id
  JOIN public.matieres m ON m.id = en.matiere_id
  WHERE m.nom = 'Français' AND ex.titre LIKE '%QCM%'
  LIMIT 1;

  IF v_examen_id IS NULL THEN RETURN; END IF;

  INSERT INTO public.questions_qcm (examen_id, question, points, ordre)
  VALUES (v_examen_id, 'Le passé composé se forme avec :', 2, 1)
  RETURNING id INTO v_q1_id;
  INSERT INTO public.options_qcm (question_id, option_texte, est_correcte) VALUES
    (v_q1_id, 'L''imparfait + infinitif', false),
    (v_q1_id, 'L''auxiliaire avoir/être + participe passé', true),
    (v_q1_id, 'Le présent + participe passé', false),
    (v_q1_id, 'Le futur + infinitif', false);

  INSERT INTO public.questions_qcm (examen_id, question, points, ordre)
  VALUES (v_examen_id, 'Avec le verbe "aller", le passé composé utilise l''auxiliaire :', 2, 2)
  RETURNING id INTO v_q2_id;
  INSERT INTO public.options_qcm (question_id, option_texte, est_correcte) VALUES
    (v_q2_id, 'Avoir', false),
    (v_q2_id, 'Être', true),
    (v_q2_id, 'Les deux', false),
    (v_q2_id, 'Aucun des deux', false);

  INSERT INTO public.questions_qcm (examen_id, question, points, ordre)
  VALUES (v_examen_id, 'Quelle est la bonne forme au passé composé de "manger" (je) ?', 2, 3)
  RETURNING id INTO v_q3_id;
  INSERT INTO public.options_qcm (question_id, option_texte, est_correcte) VALUES
    (v_q3_id, 'J''ai mangé', true),
    (v_q3_id, 'Je suis mangé', false),
    (v_q3_id, 'J''avais mangé', false),
    (v_q3_id, 'J''ai manger', false);

  INSERT INTO public.questions_qcm (examen_id, question, points, ordre)
  VALUES (v_examen_id, 'Un adjectif qualificatif sert à :', 2, 4)
  RETURNING id INTO v_q4_id;
  INSERT INTO public.options_qcm (question_id, option_texte, est_correcte) VALUES
    (v_q4_id, 'Remplacer un nom', false),
    (v_q4_id, 'Qualifier un nom', true),
    (v_q4_id, 'Indiquer une action', false),
    (v_q4_id, 'Relier deux propositions', false);

  INSERT INTO public.questions_qcm (examen_id, question, points, ordre)
  VALUES (v_examen_id, '"La mer est un miroir" est un exemple de :', 2, 5)
  RETURNING id INTO v_q5_id;
  INSERT INTO public.options_qcm (question_id, option_texte, est_correcte) VALUES
    (v_q5_id, 'Comparaison', false),
    (v_q5_id, 'Métaphore', true),
    (v_q5_id, 'Personnification', false),
    (v_q5_id, 'Hyperbole', false);
END $$;

-- ============================================================
-- ÉTAPE 15 : Questions QCM — Anglais
-- ============================================================
DO $$
DECLARE
  v_examen_id INTEGER;
  v_q1_id INTEGER; v_q2_id INTEGER; v_q3_id INTEGER; v_q4_id INTEGER; v_q5_id INTEGER;
BEGIN
  SELECT ex.id INTO v_examen_id
  FROM public.examens ex
  JOIN public.enseignements en ON en.id = ex.enseignement_id
  JOIN public.matieres m ON m.id = en.matiere_id
  WHERE m.nom = 'Anglais' AND ex.titre LIKE '%QCM%'
  LIMIT 1;

  IF v_examen_id IS NULL THEN RETURN; END IF;

  INSERT INTO public.questions_qcm (examen_id, question, points, ordre)
  VALUES (v_examen_id, 'Which sentence uses Present Simple correctly?', 2, 1)
  RETURNING id INTO v_q1_id;
  INSERT INTO public.options_qcm (question_id, option_texte, est_correcte) VALUES
    (v_q1_id, 'She is going to school every day.', false),
    (v_q1_id, 'She goes to school every day.', true),
    (v_q1_id, 'She go to school every day.', false),
    (v_q1_id, 'She have gone to school every day.', false);

  INSERT INTO public.questions_qcm (examen_id, question, points, ordre)
  VALUES (v_examen_id, 'Which sentence uses Present Continuous correctly?', 2, 2)
  RETURNING id INTO v_q2_id;
  INSERT INTO public.options_qcm (question_id, option_texte, est_correcte) VALUES
    (v_q2_id, 'I study right now.', false),
    (v_q2_id, 'I am studying right now.', true),
    (v_q2_id, 'I studying right now.', false),
    (v_q2_id, 'I does study right now.', false);

  INSERT INTO public.questions_qcm (examen_id, question, points, ordre)
  VALUES (v_examen_id, '"Always" is a signal word for :', 2, 3)
  RETURNING id INTO v_q3_id;
  INSERT INTO public.options_qcm (question_id, option_texte, est_correcte) VALUES
    (v_q3_id, 'Present Continuous', false),
    (v_q3_id, 'Present Simple', true),
    (v_q3_id, 'Past Simple', false),
    (v_q3_id, 'Future Simple', false);

  INSERT INTO public.questions_qcm (examen_id, question, points, ordre)
  VALUES (v_examen_id, 'Complete: "He ___ (play) football at the moment."', 2, 4)
  RETURNING id INTO v_q4_id;
  INSERT INTO public.options_qcm (question_id, option_texte, est_correcte) VALUES
    (v_q4_id, 'plays', false),
    (v_q4_id, 'is playing', true),
    (v_q4_id, 'play', false),
    (v_q4_id, 'has played', false);

  INSERT INTO public.questions_qcm (examen_id, question, points, ordre)
  VALUES (v_examen_id, 'Which word is NOT a Present Continuous signal word?', 2, 5)
  RETURNING id INTO v_q5_id;
  INSERT INTO public.options_qcm (question_id, option_texte, est_correcte) VALUES
    (v_q5_id, 'Now', false),
    (v_q5_id, 'At the moment', false),
    (v_q5_id, 'Every day', true),
    (v_q5_id, 'Currently', false);
END $$;

-- ============================================================
-- ÉTAPE 16 : Questions QCM — SVT (La cellule)
-- ============================================================
DO $$
DECLARE
  v_examen_id INTEGER;
  v_q1_id INTEGER; v_q2_id INTEGER; v_q3_id INTEGER; v_q4_id INTEGER; v_q5_id INTEGER;
BEGIN
  SELECT ex.id INTO v_examen_id
  FROM public.examens ex
  JOIN public.enseignements en ON en.id = ex.enseignement_id
  JOIN public.matieres m ON m.id = en.matiere_id
  WHERE m.nom = 'Sciences de la Vie et de la Terre' AND ex.titre LIKE '%cellule%'
  LIMIT 1;

  IF v_examen_id IS NULL THEN RETURN; END IF;

  INSERT INTO public.questions_qcm (examen_id, question, points, ordre)
  VALUES (v_examen_id, 'Quel organite contient l''ADN de la cellule ?', 2, 1)
  RETURNING id INTO v_q1_id;
  INSERT INTO public.options_qcm (question_id, option_texte, est_correcte) VALUES
    (v_q1_id, 'Les mitochondries', false),
    (v_q1_id, 'Le noyau', true),
    (v_q1_id, 'La membrane cellulaire', false),
    (v_q1_id, 'Le cytoplasme', false);

  INSERT INTO public.questions_qcm (examen_id, question, points, ordre)
  VALUES (v_examen_id, 'La cellule procaryote se distingue de l''eucaryote par :', 2, 2)
  RETURNING id INTO v_q2_id;
  INSERT INTO public.options_qcm (question_id, option_texte, est_correcte) VALUES
    (v_q2_id, 'Elle est plus grande', false),
    (v_q2_id, 'Elle n''a pas de noyau délimité', true),
    (v_q2_id, 'Elle n''a pas de membrane', false),
    (v_q2_id, 'Elle ne contient pas d''ADN', false);

  INSERT INTO public.questions_qcm (examen_id, question, points, ordre)
  VALUES (v_examen_id, 'Les mitochondries ont pour rôle :', 2, 3)
  RETURNING id INTO v_q3_id;
  INSERT INTO public.options_qcm (question_id, option_texte, est_correcte) VALUES
    (v_q3_id, 'La photosynthèse', false),
    (v_q3_id, 'La production d''énergie (ATP)', true),
    (v_q3_id, 'La division cellulaire', false),
    (v_q3_id, 'La synthèse des protéines', false);

  INSERT INTO public.questions_qcm (examen_id, question, points, ordre)
  VALUES (v_examen_id, 'Qu''est-ce que la cellule végétale possède en plus par rapport à la cellule animale ?', 2, 4)
  RETURNING id INTO v_q4_id;
  INSERT INTO public.options_qcm (question_id, option_texte, est_correcte) VALUES
    (v_q4_id, 'Des mitochondries supplémentaires', false),
    (v_q4_id, 'Des chloroplastes et une paroi cellulaire', true),
    (v_q4_id, 'Un noyau plus grand', false),
    (v_q4_id, 'Plus de cytoplasme', false);

  INSERT INTO public.questions_qcm (examen_id, question, points, ordre)
  VALUES (v_examen_id, 'La membrane cellulaire assure :', 2, 5)
  RETURNING id INTO v_q5_id;
  INSERT INTO public.options_qcm (question_id, option_texte, est_correcte) VALUES
    (v_q5_id, 'Uniquement la protection de la cellule', false),
    (v_q5_id, 'La protection et les échanges avec l''extérieur', true),
    (v_q5_id, 'La production d''ATP', false),
    (v_q5_id, 'La synthèse de l''ADN', false);
END $$;

-- ============================================================
-- ÉTAPE 17 : Inscription de l'élève (table inscriptions)
-- ============================================================
INSERT INTO public.inscriptions (eleve_id, numero_matricule, date_inscription, annee_scolaire_id, statut)
SELECT e.id, 'EL-2025-001', CURRENT_DATE, an.id, 'active'
FROM public.eleves e
JOIN public.utilisateurs u ON u.id = e.utilisateur_id
CROSS JOIN public.annees_scolaires an
WHERE u.email = 'eleve.test@eief.gn'
  AND an.est_active = true
ON CONFLICT DO NOTHING;

-- ============================================================
-- VÉRIFICATION FINALE
-- ============================================================
SELECT 'Résumé des données créées :' AS info;
SELECT 'Annees scolaires:' AS table_name, COUNT(*) AS nb FROM public.annees_scolaires
UNION ALL SELECT 'Classes:', COUNT(*) FROM public.classes
UNION ALL SELECT 'Matieres:', COUNT(*) FROM public.matieres
UNION ALL SELECT 'Utilisateurs:', COUNT(*) FROM public.utilisateurs WHERE role IN ('ENSEIGNANT','ELEVE')
UNION ALL SELECT 'Personnels:', COUNT(*) FROM public.personnels
UNION ALL SELECT 'Eleves:', COUNT(*) FROM public.eleves
UNION ALL SELECT 'Enseignements:', COUNT(*) FROM public.enseignements
UNION ALL SELECT 'Notes:', COUNT(*) FROM public.notes
UNION ALL SELECT 'Lecons:', COUNT(*) FROM public.lecons
UNION ALL SELECT 'Devoirs:', COUNT(*) FROM public.devoirs
UNION ALL SELECT 'Examens:', COUNT(*) FROM public.examens
UNION ALL SELECT 'Questions QCM:', COUNT(*) FROM public.questions_qcm
UNION ALL SELECT 'Options QCM:', COUNT(*) FROM public.options_qcm;
