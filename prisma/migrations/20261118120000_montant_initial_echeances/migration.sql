-- ============================================================
-- EIEF - Correction des montants de scolarité / fournitures
-- Date : 2026-11-18
--
-- Problème : echeances_paiement.montant était diminué à chaque
-- paiement partiel. Il servait à la fois de montant d'origine et
-- de reste à payer, ce qui faussait tous les totaux.
--
-- Solution :
--   1. Ajout de montant_initial (montant d'origine, immuable)
--   2. Trigger : toute nouvelle échéance mémorise son montant initial
--   3. Réparation des montants d'origine depuis le plan de la classe
--      et des services (fournitures / cantine / transport)
--   4. Recalcul de montant_total_plan et montant_restant_plan
-- ============================================================

BEGIN;

-- 1. Colonne "montant d'origine"
ALTER TABLE echeances_paiement
  ADD COLUMN IF NOT EXISTS montant_initial integer;

-- 2. Backfill de sécurité pour les lignes existantes
UPDATE echeances_paiement
SET montant_initial = montant
WHERE montant_initial IS NULL;

-- 3. Trigger : une nouvelle échéance capture son montant d'origine
CREATE OR REPLACE FUNCTION set_echeance_montant_initial()
RETURNS trigger AS $$
BEGIN
  IF NEW.montant_initial IS NULL THEN
    NEW.montant_initial := NEW.montant;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_echeances_montant_initial ON echeances_paiement;
CREATE TRIGGER trg_echeances_montant_initial
BEFORE INSERT ON echeances_paiement
FOR EACH ROW EXECUTE FUNCTION set_echeance_montant_initial();

-- 4. Réparation de la scolarité des PRÉ-INSCRIPTIONS
--    (uniquement si aucune remise n'a été accordée au parent,
--     car une remise modifie volontairement les montants)
UPDATE echeances_paiement ep
SET montant_initial = CASE ep.echeance
    WHEN '1er_versement'  THEN COALESCE(c.premier_versement,  ep.montant_initial, ep.montant)
    WHEN '2eme_versement' THEN COALESCE(c.deuxieme_versement, ep.montant_initial, ep.montant)
    WHEN '3eme_versement' THEN COALESCE(c.troisieme_versement, ep.montant_initial, ep.montant)
    ELSE ep.montant_initial
  END
FROM preinscriptions p
JOIN classes c ON LOWER(c.nom) = LOWER(p.classe)
WHERE ep.preinscription_id = p.id
  AND ep.type = 'inscription'
  AND ep.echeance IN ('1er_versement', '2eme_versement', '3eme_versement')
  AND NOT EXISTS (
    SELECT 1 FROM remises_familles rf WHERE rf.parent_id = p.parent_id
  );

-- 5. Réparation de la scolarité des RÉ-INSCRIPTIONS
UPDATE echeances_paiement ep
SET montant_initial = CASE ep.echeance
    WHEN '1er_versement'  THEN COALESCE(c.reinscription_premier_versement,  c.premier_versement,  ep.montant_initial, ep.montant)
    WHEN '2eme_versement' THEN COALESCE(c.reinscription_deuxieme_versement, c.deuxieme_versement, ep.montant_initial, ep.montant)
    WHEN '3eme_versement' THEN COALESCE(c.reinscription_troisieme_versement, c.troisieme_versement, ep.montant_initial, ep.montant)
    ELSE ep.montant_initial
  END
FROM reinscriptions r
JOIN classes c ON c.id = r.classe_id
WHERE ep.reinscription_id = r.id
  AND ep.type IN ('reinscription', 'scolarite')
  AND ep.echeance IN ('1er_versement', '2eme_versement', '3eme_versement')
  AND NOT EXISTS (
    SELECT 1 FROM remises_familles rf WHERE rf.parent_id = r.parent_id
  );

-- 6. Réparation des FOURNITURES depuis les commandes réelles
UPDATE echeances_paiement ep
SET montant_initial = src.total
FROM (
  SELECT preinscription_id, SUM(quantite * prix_unitaire)::int AS total
  FROM commandes_fournitures
  WHERE preinscription_id IS NOT NULL
  GROUP BY preinscription_id
) src
WHERE ep.preinscription_id = src.preinscription_id
  AND ep.type = 'fournitures'
  AND src.total > 0;

-- 7. Réparation de la CANTINE depuis les inscriptions réelles
UPDATE echeances_paiement ep
SET montant_initial = src.total
FROM (
  SELECT preinscription_id, SUM(prix)::int AS total
  FROM preinscription_cantine
  WHERE preinscription_id IS NOT NULL
  GROUP BY preinscription_id
) src
WHERE ep.preinscription_id = src.preinscription_id
  AND ep.type = 'cantine'
  AND src.total > 0;

-- 8. Réparation du TRANSPORT depuis les inscriptions réelles
UPDATE echeances_paiement ep
SET montant_initial = src.total
FROM (
  SELECT preinscription_id, SUM(prix)::int AS total
  FROM preinscription_transport
  WHERE preinscription_id IS NOT NULL
  GROUP BY preinscription_id
) src
WHERE ep.preinscription_id = src.preinscription_id
  AND ep.type = 'transport'
  AND src.total > 0;

-- 9. Recalcul des totaux de scolarité des PRÉ-INSCRIPTIONS
UPDATE preinscriptions p
SET montant_total_plan   = sc.total,
    montant_restant_plan = sc.restant,
    frais_statut = CASE
      WHEN sc.restant <= 0 THEN 'paye'
      WHEN sc.total - sc.restant > 0 THEN 'partiel'
      ELSE 'non_paye'
    END
FROM (
  SELECT preinscription_id,
         SUM(COALESCE(montant_initial, montant))::int AS total,
         SUM(CASE WHEN statut IN ('en_attente', 'partiel') THEN montant ELSE 0 END)::int AS restant
  FROM echeances_paiement
  WHERE preinscription_id IS NOT NULL
    AND type IN ('inscription', 'scolarite', 'reinscription')
  GROUP BY preinscription_id
) sc
WHERE p.id = sc.preinscription_id
  AND sc.total > 0;

-- 10. Recalcul des totaux de scolarité des RÉ-INSCRIPTIONS
UPDATE reinscriptions r
SET montant_total_plan   = sc.total,
    montant_restant_plan = sc.restant,
    frais_statut = CASE
      WHEN sc.restant <= 0 THEN 'paye'
      WHEN sc.total - sc.restant > 0 THEN 'partiel'
      ELSE 'non_paye'
    END
FROM (
  SELECT reinscription_id,
         SUM(COALESCE(montant_initial, montant))::int AS total,
         SUM(CASE WHEN statut IN ('en_attente', 'partiel') THEN montant ELSE 0 END)::int AS restant
  FROM echeances_paiement
  WHERE reinscription_id IS NOT NULL
    AND type IN ('inscription', 'scolarite', 'reinscription')
  GROUP BY reinscription_id
) sc
WHERE r.id = sc.reinscription_id
  AND sc.total > 0;

COMMIT;
