-- Migration: fix_organization_members_role_constraint
-- Description: Ajoute le r�le 'admin' � la contrainte CHECK de organization_members

-- Supprimer l'ancienne contrainte
ALTER TABLE organization_members
DROP CONSTRAINT IF EXISTS organization_members_role_check;

-- Cr�er la nouvelle contrainte avec 'admin' inclus
ALTER TABLE organization_members
ADD CONSTRAINT organization_members_role_check
  CHECK (role IN ('student', 'parent', 'professor', 'admin'));

-- Commentaire
COMMENT ON COLUMN organization_members.role IS 'R�le du membre : student, parent, professor, ou admin (cr�ateur de l''organisation)';
