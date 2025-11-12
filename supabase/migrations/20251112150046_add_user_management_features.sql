-- Migration: add_user_management_features
-- Description: Ajoute le champ is_blocked à profiles et crée la fonction admin_delete_user

-- Ajouter le champ is_blocked à la table profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_blocked boolean DEFAULT false;

-- Commentaire pour documenter la colonne
COMMENT ON COLUMN profiles.is_blocked IS 'Indique si l''utilisateur est bloqué par un administrateur';

-- Créer un index pour améliorer les performances des requêtes filtrant par is_blocked
CREATE INDEX IF NOT EXISTS idx_profiles_is_blocked ON profiles(is_blocked);

-- Fonction RPC pour supprimer un utilisateur (admin seulement)
-- Cette fonction supprime toutes les données de l'utilisateur de la base de données
CREATE OR REPLACE FUNCTION admin_delete_user(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Vérifier que l'utilisateur qui appelle cette fonction est l'admin
  -- (contact.savistas@gmail.com)
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid()
    AND email = 'contact.savistas@gmail.com'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only admin can delete users';
  END IF;

  -- Ne pas permettre à l'admin de se supprimer lui-même
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot delete your own account';
  END IF;

  -- Supprimer les données liées à l'utilisateur
  -- L'ordre est important à cause des contraintes de clés étrangères

  -- Supprimer les réponses aux questionnaires
  DELETE FROM troubles_questionnaire_reponses WHERE user_id = target_user_id;
  DELETE FROM troubles_detection_scores WHERE user_id = target_user_id;
  DELETE FROM styles_apprentissage WHERE user_id = target_user_id;
  DELETE FROM profiles_infos WHERE user_id = target_user_id;

  -- Supprimer les données d'apprentissage
  DELETE FROM user_quiz_attempts WHERE user_id = target_user_id;
  DELETE FROM user_progress WHERE user_id = target_user_id;

  -- Supprimer les abonnements
  DELETE FROM user_subscriptions WHERE user_id = target_user_id;

  -- Supprimer les membres d'organisation
  DELETE FROM organization_members WHERE user_id = target_user_id;

  -- Supprimer les organisations créées par cet utilisateur
  DELETE FROM organizations WHERE created_by = target_user_id;

  -- Supprimer les demandes d'organisation
  DELETE FROM organization_requests WHERE created_by = target_user_id;

  -- Supprimer le profil
  DELETE FROM profiles WHERE user_id = target_user_id;

  -- Note: La suppression du compte auth.users doit être faite via l'API Admin Supabase
  -- car elle nécessite des privilèges spéciaux
END;
$$;

-- Commenter la fonction
COMMENT ON FUNCTION admin_delete_user IS 'Fonction admin pour supprimer toutes les données d''un utilisateur (sauf auth.users qui doit être supprimé via l''API Admin)';
