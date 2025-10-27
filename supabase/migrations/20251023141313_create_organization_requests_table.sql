-- Migration: create_organization_requests_table
-- Description: Cr�e la table pour stocker les demandes de cr�ation d'organisation en attente de validation

-- Cr�er la table organization_requests
CREATE TABLE organization_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Informations de l'organisation demand�e
  organization_name text NOT NULL CHECK (char_length(organization_name) >= 3),
  organization_description text NOT NULL,
  organization_website text NOT NULL,
  organization_type text CHECK (organization_type IN ('school', 'company')) NOT NULL,

  -- Informations de l'administrateur/cr�ateur
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_full_name text NOT NULL,
  admin_date_of_birth date NOT NULL,
  admin_phone text NOT NULL,
  admin_country text NOT NULL,
  admin_city text,
  admin_email text NOT NULL,

  -- Statut de la demande
  status text CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',

  -- Informations de traitement
  reviewed_at timestamp with time zone,
  reviewed_by uuid REFERENCES auth.users(id),
  rejection_reason text,

  -- Organisation cr��e (si approuv�e)
  created_organization_id uuid REFERENCES organizations(id),

  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- RLS Policies
ALTER TABLE organization_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Les cr�ateurs peuvent voir leur propre demande
CREATE POLICY "Users can view own organization requests"
  ON organization_requests FOR SELECT
  USING (auth.uid() = created_by);

-- Policy: Les utilisateurs authentifi�s peuvent cr�er une demande
CREATE POLICY "Authenticated users can create organization requests"
  ON organization_requests FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND status = 'pending'
  );

-- Policy: Seul contact.savistas@gmail.com peut voir toutes les demandes
CREATE POLICY "Admin can view all organization requests"
  ON organization_requests FOR SELECT
  USING (
    auth.jwt() ->> 'email' = 'contact.savistas@gmail.com'
  );

-- Policy: Seul contact.savistas@gmail.com peut modifier les demandes
CREATE POLICY "Admin can update organization requests"
  ON organization_requests FOR UPDATE
  USING (
    auth.jwt() ->> 'email' = 'contact.savistas@gmail.com'
  );

-- Trigger pour updated_at
CREATE TRIGGER trigger_update_organization_requests_updated_at
BEFORE UPDATE ON organization_requests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Index pour optimiser les requ�tes
CREATE INDEX idx_organization_requests_created_by ON organization_requests(created_by);
CREATE INDEX idx_organization_requests_status ON organization_requests(status);
CREATE INDEX idx_organization_requests_created_at ON organization_requests(created_at);

-- Commentaires
COMMENT ON TABLE organization_requests IS 'Demandes de cr�ation d''organisation en attente de validation par un admin Savistas';
COMMENT ON COLUMN organization_requests.status IS 'Statut de la demande: pending, approved, rejected';
COMMENT ON COLUMN organization_requests.rejection_reason IS 'Raison du rejet (optionnel)';
COMMENT ON COLUMN organization_requests.created_organization_id IS 'ID de l''organisation cr��e si la demande est approuv�e';
