-- Migration: create_organization_members_table
-- Description: Crée la table organization_members et la vue organization_members_details

-- Créer la table organization_members
CREATE TABLE organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text CHECK (status IN ('pending', 'active', 'rejected', 'removed')) DEFAULT 'pending',
  role text CHECK (role IN ('student', 'parent', 'professor')) DEFAULT 'student',
  requested_at timestamp with time zone DEFAULT now(),
  approved_at timestamp with time zone,
  approved_by uuid REFERENCES auth.users(id),
  
  -- Contrainte: un user ne peut être que dans une seule organisation
  UNIQUE(user_id)
);

-- RLS Policies
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Policy: Les membres peuvent voir leur propre entrée
CREATE POLICY "Members can view own membership"
  ON organization_members FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Les admins d'orga peuvent voir tous les membres
CREATE POLICY "Organization admins can view all members"
  ON organization_members FOR SELECT
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE created_by = auth.uid()
    )
  );

-- Policy: Les admins d'orga peuvent modifier les membres
CREATE POLICY "Organization admins can update members"
  ON organization_members FOR UPDATE
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE created_by = auth.uid()
    )
  );

-- Policy: Les admins d'orga peuvent supprimer des membres
CREATE POLICY "Organization admins can delete members"
  ON organization_members FOR DELETE
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE created_by = auth.uid()
    )
  );

-- Policy: Les users peuvent créer leur demande
CREATE POLICY "Users can create membership request"
  ON organization_members FOR INSERT
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Index
CREATE INDEX idx_organization_members_org ON organization_members(organization_id);
CREATE INDEX idx_organization_members_user ON organization_members(user_id);
CREATE INDEX idx_organization_members_status ON organization_members(status);

-- Vue pour faciliter les requêtes
CREATE OR REPLACE VIEW organization_members_details AS
SELECT 
  om.id,
  om.organization_id,
  om.user_id,
  om.status,
  om.role,
  om.requested_at,
  om.approved_at,
  p.full_name,
  p.email,
  p.profile_photo_url,
  o.name as organization_name,
  o.organization_code
FROM organization_members om
JOIN profiles p ON om.user_id = p.user_id
JOIN organizations o ON om.organization_id = o.id;
