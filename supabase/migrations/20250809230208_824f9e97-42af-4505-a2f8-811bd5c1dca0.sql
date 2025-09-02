-- Créer la table profiles pour les informations utilisateur
CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Informations personnelles (étape 4)
  full_name text,
  email text,
  phone text,
  
  -- Informations du formulaire (étape 1, 2, 3)
  role text CHECK (role IN ('student', 'teacher', 'parent', 'school', 'company')),
  subscription text CHECK (subscription IN ('basic', 'premium', 'pro')),
  
  -- Localisation
  country text,
  city text,
  postal_code text,
  
  -- Informations académiques
  education_level text CHECK (education_level IN ('primaire', 'college', 'lycee', 'superieur')),
  classes text,
  subjects text,
  
  -- Liaison et outils
  link_code text,
  link_relation text CHECK (link_relation IN ('parent', 'tuteur', 'enseignant', 'autre')),
  ent text,
  ai_level text CHECK (ai_level IN ('debutant', 'intermediaire', 'avance', 'expert')),
  
  -- Photo de profil
  profile_photo_url text,
  
  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS pour la table profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile" 
ON public.profiles 
FOR DELETE 
USING (auth.uid() = user_id);

-- Créer une fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger pour updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Créer une fonction qui se déclenche automatiquement lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', '')
  );
  RETURN new;
END;
$$;

-- Créer le trigger pour créer automatiquement un profile lors de l'inscription
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Créer le bucket de stockage pour les photos de profil
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-photos', 'profile-photos', true);

-- Créer les politiques de stockage pour les photos de profil
CREATE POLICY "Profile photos are viewable by everyone" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'profile-photos');

CREATE POLICY "Users can upload their own profile photo" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'profile-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own profile photo" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'profile-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own profile photo" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'profile-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
