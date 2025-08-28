CREATE TABLE styles_apprentissage (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    score_visuel INTEGER DEFAULT 0,
    score_spatial INTEGER DEFAULT 0,
    score_auditif INTEGER DEFAULT 0,
    score_linguistique INTEGER DEFAULT 0,
    score_kinesthésique INTEGER DEFAULT 0,
    score_lecture INTEGER DEFAULT 0,
    score_ecriture INTEGER DEFAULT 0,
    score_logique_mathematique INTEGER DEFAULT 0,
    score_interpersonnelle INTEGER DEFAULT 0,
    score_musicale INTEGER DEFAULT 0,
    score_naturaliste INTEGER DEFAULT 0,
    score_intrapersonnelle INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE styles_apprentissage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own learning styles."
ON styles_apprentissage FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own learning styles."
ON styles_apprentissage FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own learning styles."
ON styles_apprentissage FOR UPDATE
USING (auth.uid() = user_id);
