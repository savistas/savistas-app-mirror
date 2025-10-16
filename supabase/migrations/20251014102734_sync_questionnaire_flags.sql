-- Migration: Automatic synchronization of questionnaire completion flags
-- This migration creates triggers to automatically update completion flags in the profiles table
-- based on the actual data in the questionnaire tables.

-- ============================================================================
-- TRIGGER 1: Sync troubles_detection_completed flag
-- ============================================================================

-- Function to sync troubles detection completion flag
CREATE OR REPLACE FUNCTION sync_troubles_detection_flag()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get the user_id from the affected row
  v_user_id := COALESCE(NEW.user_id, OLD.user_id);

  -- Update the profile flag based on complete data in both tables
  UPDATE profiles
  SET
    troubles_detection_completed = (
      -- Check if all 13 questions are answered in troubles_questionnaire_reponses
      EXISTS (
        SELECT 1 FROM troubles_questionnaire_reponses
        WHERE user_id = v_user_id
        AND q1_attention IS NOT NULL
        AND q2_lecture IS NOT NULL
        AND q3_communication IS NOT NULL
        AND q4_motricite_fine IS NOT NULL
        AND q5_motricite_globale IS NOT NULL
        AND q6_interaction_sociale IS NOT NULL
        AND q7_sensibilite_sensorielle IS NOT NULL
        AND q8_regulation_emotionnelle IS NOT NULL
        AND q9_memoire IS NOT NULL
        AND q10_calcul IS NOT NULL
        AND q11_tics IS NOT NULL
        AND q12_fluidite_parole IS NOT NULL
        AND q13_sensibilites_isolees IS NOT NULL
      )
      -- AND scores have been calculated in troubles_detection_scores
      AND EXISTS (
        SELECT 1 FROM troubles_detection_scores
        WHERE user_id = v_user_id
      )
    ),
    updated_at = now()
  WHERE user_id = v_user_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger to troubles_questionnaire_reponses table
DROP TRIGGER IF EXISTS trigger_sync_troubles_reponses ON troubles_questionnaire_reponses;
CREATE TRIGGER trigger_sync_troubles_reponses
AFTER INSERT OR UPDATE OR DELETE ON troubles_questionnaire_reponses
FOR EACH ROW EXECUTE FUNCTION sync_troubles_detection_flag();

-- Apply trigger to troubles_detection_scores table
DROP TRIGGER IF EXISTS trigger_sync_troubles_scores ON troubles_detection_scores;
CREATE TRIGGER trigger_sync_troubles_scores
AFTER INSERT OR UPDATE OR DELETE ON troubles_detection_scores
FOR EACH ROW EXECUTE FUNCTION sync_troubles_detection_flag();

-- ============================================================================
-- TRIGGER 2: Sync learning_styles_completed flag
-- ============================================================================

-- Function to sync learning styles completion flag
CREATE OR REPLACE FUNCTION sync_learning_styles_flag()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get the user_id from the affected row
  v_user_id := COALESCE(NEW.user_id, OLD.user_id);

  -- Update the profile flag based on complete data in styles_apprentissage
  UPDATE profiles
  SET
    learning_styles_completed = (
      -- Check if all 12 scores are calculated and not null
      EXISTS (
        SELECT 1 FROM styles_apprentissage
        WHERE user_id = v_user_id
        AND score_visuel IS NOT NULL
        AND score_spatial IS NOT NULL
        AND score_auditif IS NOT NULL
        AND score_linguistique IS NOT NULL
        AND score_kinesthésique IS NOT NULL
        AND score_lecture IS NOT NULL
        AND score_ecriture IS NOT NULL
        AND score_logique_mathematique IS NOT NULL
        AND score_interpersonnelle IS NOT NULL
        AND score_musicale IS NOT NULL
        AND score_naturaliste IS NOT NULL
        AND score_intrapersonnelle IS NOT NULL
      )
    ),
    updated_at = now()
  WHERE user_id = v_user_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger to styles_apprentissage table
DROP TRIGGER IF EXISTS trigger_sync_learning_styles ON styles_apprentissage;
CREATE TRIGGER trigger_sync_learning_styles
AFTER INSERT OR UPDATE OR DELETE ON styles_apprentissage
FOR EACH ROW EXECUTE FUNCTION sync_learning_styles_flag();

-- ============================================================================
-- TRIGGER 3: Sync survey_completed flag
-- ============================================================================

-- Function to sync general survey completion flag
CREATE OR REPLACE FUNCTION sync_survey_flag()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get the user_id from the affected row
  v_user_id := COALESCE(NEW.user_id, OLD.user_id);

  -- Update the profile flag based on complete data in profiles_infos
  UPDATE profiles
  SET
    survey_completed = (
      -- Check if all 10 questions are answered
      EXISTS (
        SELECT 1 FROM profiles_infos
        WHERE user_id = v_user_id
        AND pref_apprendre_idee IS NOT NULL
        AND memoire_poesie IS NOT NULL
        AND resoudre_maths IS NOT NULL
        AND temps_libre_pref IS NOT NULL
        AND travail_groupe_role IS NOT NULL
        AND retenir_info IS NOT NULL
        AND pref_enseignant IS NOT NULL
        AND decouvrir_endroit IS NOT NULL
        AND reussir_definition IS NOT NULL
        AND souvenir_important IS NOT NULL
      )
    ),
    updated_at = now()
  WHERE user_id = v_user_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger to profiles_infos table
DROP TRIGGER IF EXISTS trigger_sync_survey ON profiles_infos;
CREATE TRIGGER trigger_sync_survey
AFTER INSERT OR UPDATE OR DELETE ON profiles_infos
FOR EACH ROW EXECUTE FUNCTION sync_survey_flag();

-- ============================================================================
-- DATA CLEANUP: Reset and fix existing inconsistent flags
-- ============================================================================

-- First, reset all flags to false
UPDATE profiles
SET
  survey_completed = false,
  troubles_detection_completed = false,
  learning_styles_completed = false,
  updated_at = now();

-- Then re-enable troubles_detection_completed where data is complete
UPDATE profiles p
SET
  troubles_detection_completed = true,
  updated_at = now()
WHERE EXISTS (
  SELECT 1 FROM troubles_questionnaire_reponses tqr
  WHERE tqr.user_id = p.user_id
  AND tqr.q1_attention IS NOT NULL
  AND tqr.q2_lecture IS NOT NULL
  AND tqr.q3_communication IS NOT NULL
  AND tqr.q4_motricite_fine IS NOT NULL
  AND tqr.q5_motricite_globale IS NOT NULL
  AND tqr.q6_interaction_sociale IS NOT NULL
  AND tqr.q7_sensibilite_sensorielle IS NOT NULL
  AND tqr.q8_regulation_emotionnelle IS NOT NULL
  AND tqr.q9_memoire IS NOT NULL
  AND tqr.q10_calcul IS NOT NULL
  AND tqr.q11_tics IS NOT NULL
  AND tqr.q12_fluidite_parole IS NOT NULL
  AND tqr.q13_sensibilites_isolees IS NOT NULL
)
AND EXISTS (
  SELECT 1 FROM troubles_detection_scores tds
  WHERE tds.user_id = p.user_id
);

-- Re-enable learning_styles_completed where data is complete
UPDATE profiles p
SET
  learning_styles_completed = true,
  updated_at = now()
WHERE EXISTS (
  SELECT 1 FROM styles_apprentissage sa
  WHERE sa.user_id = p.user_id
  AND sa.score_visuel IS NOT NULL
  AND sa.score_spatial IS NOT NULL
  AND sa.score_auditif IS NOT NULL
  AND sa.score_linguistique IS NOT NULL
  AND sa.score_kinesthésique IS NOT NULL
  AND sa.score_lecture IS NOT NULL
  AND sa.score_ecriture IS NOT NULL
  AND sa.score_logique_mathematique IS NOT NULL
  AND sa.score_interpersonnelle IS NOT NULL
  AND sa.score_musicale IS NOT NULL
  AND sa.score_naturaliste IS NOT NULL
  AND sa.score_intrapersonnelle IS NOT NULL
);

-- Re-enable survey_completed where data is complete
UPDATE profiles p
SET
  survey_completed = true,
  updated_at = now()
WHERE EXISTS (
  SELECT 1 FROM profiles_infos pi
  WHERE pi.user_id = p.user_id
  AND pi.pref_apprendre_idee IS NOT NULL
  AND pi.memoire_poesie IS NOT NULL
  AND pi.resoudre_maths IS NOT NULL
  AND pi.temps_libre_pref IS NOT NULL
  AND pi.travail_groupe_role IS NOT NULL
  AND pi.retenir_info IS NOT NULL
  AND pi.pref_enseignant IS NOT NULL
  AND pi.decouvrir_endroit IS NOT NULL
  AND pi.reussir_definition IS NOT NULL
  AND pi.souvenir_important IS NOT NULL
);
