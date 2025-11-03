-- Create error_single_revision table for manual error uploads
CREATE TABLE error_single_revision (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,

  -- Document de cours uploadé (référence dans table documents)
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,

  -- Photo de l'erreur (stockée dans bucket 'error_revision')
  error_image_url TEXT NOT NULL,

  -- Métadonnées du formulaire
  subject TEXT NOT NULL,
  course_name TEXT NOT NULL,
  user_message TEXT,

  -- Statut de génération de la révision
  status TEXT NOT NULL DEFAULT 'generating' CHECK (status IN ('generating', 'completed', 'error')),

  -- Réponse du webhook (optionnel, pour stocker l'analyse)
  analysis_response JSONB,

  -- Métadonnées système
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX idx_error_single_revision_user ON error_single_revision(user_id);
CREATE INDEX idx_error_single_revision_status ON error_single_revision(status);
CREATE INDEX idx_error_single_revision_document ON error_single_revision(document_id);
CREATE INDEX idx_error_single_revision_created_at ON error_single_revision(created_at DESC);

-- Enable RLS
ALTER TABLE error_single_revision ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own error revisions"
  ON error_single_revision FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own error revisions"
  ON error_single_revision FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own error revisions"
  ON error_single_revision FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own error revisions"
  ON error_single_revision FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_error_single_revision_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_error_single_revision_updated_at_trigger
  BEFORE UPDATE ON error_single_revision
  FOR EACH ROW
  EXECUTE FUNCTION update_error_single_revision_updated_at();
