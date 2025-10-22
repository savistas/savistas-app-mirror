-- Migration: create_organizations_table
-- Description: Crée la table organizations avec fonction de génération de code et policies RLS

-- Créer la table organizations
CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  organization_code text UNIQUE NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- Métadonnées
  type text CHECK (type IN ('school', 'company')) DEFAULT 'school',
  max_members integer DEFAULT 100,
  
  CONSTRAINT organizations_name_check CHECK (char_length(name) >= 3),
  CONSTRAINT organizations_code_check CHECK (organization_code ~ '^ORG-[A-Z0-9]{6}$')
);

-- Fonction de génération de code organisation
CREATE OR REPLACE FUNCTION generate_organization_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  LOOP
    -- Générer un code au format ORG-ABC123
    new_code := 'ORG-' || upper(substring(md5(random()::text) from 1 for 6));
    
    -- Vérifier si le code existe déjà
    SELECT EXISTS(
      SELECT 1 FROM organizations WHERE organization_code = new_code
    ) INTO code_exists;
    
    -- Si le code n'existe pas, le retourner
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$;

-- Trigger pour auto-générer le code
CREATE OR REPLACE FUNCTION set_organization_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.organization_code IS NULL OR NEW.organization_code = '' THEN
    NEW.organization_code := generate_organization_code();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_organization_code
BEFORE INSERT ON organizations
FOR EACH ROW
EXECUTE FUNCTION set_organization_code();

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_organizations_updated_at
BEFORE UPDATE ON organizations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Policy: Les créateurs peuvent lire leur organisation
CREATE POLICY "Organizations are viewable by creator"
  ON organizations FOR SELECT
  USING (auth.uid() = created_by);

-- Policy: Tout le monde peut lire les organisations (pour validation du code)
CREATE POLICY "Organizations are viewable by code"
  ON organizations FOR SELECT
  USING (true);

-- Policy: Les créateurs peuvent modifier leur organisation
CREATE POLICY "Organizations can be updated by creator"
  ON organizations FOR UPDATE
  USING (auth.uid() = created_by);

-- Policy: Les utilisateurs authentifiés peuvent créer une organisation
CREATE POLICY "Organizations can be inserted by authenticated users"
  ON organizations FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Index
CREATE INDEX idx_organizations_code ON organizations(organization_code);
CREATE INDEX idx_organizations_created_by ON organizations(created_by);
CREATE INDEX idx_organizations_type ON organizations(type);
