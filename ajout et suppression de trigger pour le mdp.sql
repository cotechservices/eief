-- Supprimer l'ancien trigger et la fonction
DROP TRIGGER IF EXISTS trigger_definir_mot_de_passe_eleve ON eleves;
DROP FUNCTION IF EXISTS definir_mot_de_passe_eleve();

-- Recréer la fonction
CREATE OR REPLACE FUNCTION definir_mot_de_passe_eleve()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE utilisateurs 
    SET 
        password = '$2b$10$ZZLKcyJu9q1b.9BQO05Oqe5/FRon2xgodS6eGrn9tOlTNxcuYf1gq'
    WHERE id = NEW.utilisateur_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recréer le trigger
CREATE TRIGGER trigger_definir_mot_de_passe_eleve
AFTER INSERT ON eleves
FOR EACH ROW
EXECUTE FUNCTION definir_mot_de_passe_eleve();

-- Vérifier la création
SELECT 
    tgname,
    pg_get_triggerdef(oid) 
FROM pg_trigger 
WHERE tgname = 'trigger_definir_mot_de_passe_eleve';