-- Créer la table emails_registry pour stocker uniquement les emails
CREATE TABLE IF NOT EXISTS public.emails_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Activer RLS sur la table
ALTER TABLE public.emails_registry ENABLE ROW LEVEL SECURITY;

-- Policy pour permettre à tout le monde de lire les emails (pour vérification)
CREATE POLICY "Public can check emails"
  ON public.emails_registry
  FOR SELECT
  USING (true);

-- Policy pour permettre uniquement aux utilisateurs authentifiés d'insérer
CREATE POLICY "Authenticated users can insert emails"
  ON public.emails_registry
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Fonction trigger pour synchroniser les emails
CREATE OR REPLACE FUNCTION public.sync_email_to_registry()
RETURNS TRIGGER AS $$
BEGIN
  -- Insérer l'email dans la table emails_registry
  INSERT INTO public.emails_registry (email)
  VALUES (NEW.email)
  ON CONFLICT (email) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger sur la table profiles
DROP TRIGGER IF EXISTS sync_email_trigger ON public.profiles;
CREATE TRIGGER sync_email_trigger
  AFTER INSERT OR UPDATE OF email ON public.profiles
  FOR EACH ROW
  WHEN (NEW.email IS NOT NULL)
  EXECUTE FUNCTION public.sync_email_to_registry();

-- Peupler la table avec les emails existants
INSERT INTO public.emails_registry (email)
SELECT DISTINCT email FROM public.profiles WHERE email IS NOT NULL
ON CONFLICT (email) DO NOTHING;
