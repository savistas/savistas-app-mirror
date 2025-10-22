-- Migration: add_role_to_profiles
-- Description: Ajoute le champ role à la table profiles

-- Ajouter la colonne role
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role text
CHECK (role IN ('student', 'school', 'company', 'parent', 'professor'))
DEFAULT 'student';

-- Mettre à jour les utilisateurs existants avec le rôle 'student'
UPDATE profiles
SET role = 'student'
WHERE role IS NULL;

-- Créer un index pour les requêtes par rôle
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
