-- Migration: add_validation_fields_to_organizations
-- Description: Ajoute les colonnes de validation manquantes dans la table organizations

-- Ajouter les colonnes de validation
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS validation_status text
  CHECK (validation_status IN ('pending', 'approved', 'rejected'))
  DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS validated_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS validated_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS website text;

-- Index pour optimiser les requ�tes de validation
CREATE INDEX IF NOT EXISTS idx_organizations_validation_status ON organizations(validation_status);

-- Commentaires
COMMENT ON COLUMN organizations.validation_status IS 'Statut de validation de l''organisation par un admin Savistas';
COMMENT ON COLUMN organizations.validated_at IS 'Date de validation/rejet de l''organisation';
COMMENT ON COLUMN organizations.validated_by IS 'ID de l''admin qui a valid�/rejet� l''organisation';
COMMENT ON COLUMN organizations.website IS 'Site web de l''organisation';
