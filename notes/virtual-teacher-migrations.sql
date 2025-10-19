-- ============================================================================
-- MIGRATIONS SQL POUR PROFESSEUR VIRTUEL
-- ============================================================================
--
-- Ce fichier contient toutes les migrations nécessaires pour la feature
-- Professeur Virtuel.
--
-- IMPORTANT: N'exécutez pas ce fichier directement !
--
-- Pour appliquer ces migrations:
-- 1. Via Supabase CLI (local):
--    npx supabase migration new create_virtual_teacher_tables
--    Copier le contenu ci-dessous dans le fichier créé
--    npx supabase db push
--
-- 2. Via Dashboard Supabase:
--    SQL Editor → Copier-coller ce code → Run
--
-- ============================================================================

-- ============================================================================
-- Table: ai_teacher_conversations
-- Stocke les sessions de conversation avec le professeur virtuel
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_teacher_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  conversation_type TEXT NOT NULL CHECK (conversation_type IN ('general', 'course', 'quiz', 'exercise')),
  context_id UUID NULL,  -- Référence à course_id, quiz_id, etc.
  context_data JSONB NULL,  -- Données contextuelles supplémentaires
  agent_config JSONB NOT NULL,  -- Configuration de l'agent utilisé
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_conversations_user ON ai_teacher_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_type ON ai_teacher_conversations(conversation_type);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON ai_teacher_conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON ai_teacher_conversations(created_at DESC);

-- Commentaires
COMMENT ON TABLE ai_teacher_conversations IS 'Sessions de conversation avec le professeur virtuel IA';
COMMENT ON COLUMN ai_teacher_conversations.conversation_type IS 'Type: general, course, quiz, exercise';
COMMENT ON COLUMN ai_teacher_conversations.context_id IS 'ID du contexte (course_id, quiz_id, etc.)';
COMMENT ON COLUMN ai_teacher_conversations.context_data IS 'Données JSON du contexte';
COMMENT ON COLUMN ai_teacher_conversations.agent_config IS 'Configuration JSON de l''agent ElevenLabs';

-- ============================================================================
-- Table: ai_teacher_messages
-- Stocke les messages de chaque conversation
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_teacher_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES ai_teacher_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  audio_url TEXT NULL,  -- URL Supabase Storage si l'audio est stocké
  metadata JSONB NULL,  -- Métadonnées (durée audio, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON ai_teacher_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_role ON ai_teacher_messages(role);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON ai_teacher_messages(created_at);

-- Commentaires
COMMENT ON TABLE ai_teacher_messages IS 'Messages échangés dans les conversations';
COMMENT ON COLUMN ai_teacher_messages.role IS 'Rôle: user ou assistant';
COMMENT ON COLUMN ai_teacher_messages.audio_url IS 'URL de l''audio si stocké';

-- ============================================================================
-- Table: ai_teacher_agent_configs
-- Cache les configurations d'agents pour réutilisation
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_teacher_agent_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  learning_style TEXT NOT NULL,
  troubles_context JSONB NOT NULL,  -- { "dyslexie": "Élevé", "tdah": "Modéré", ... }
  system_prompt TEXT NOT NULL,  -- Prompt système généré
  elevenlabs_agent_id TEXT NULL,  -- ID de l'agent ElevenLabs créé
  voice_id TEXT DEFAULT 'default',
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agent_configs_user ON ai_teacher_agent_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_configs_elevenlabs ON ai_teacher_agent_configs(elevenlabs_agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_configs_last_used ON ai_teacher_agent_configs(last_used_at DESC);

-- Index composite pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_agent_configs_user_style ON ai_teacher_agent_configs(user_id, learning_style);

-- Commentaires
COMMENT ON TABLE ai_teacher_agent_configs IS 'Configurations d''agents personnalisés (cache)';
COMMENT ON COLUMN ai_teacher_agent_configs.learning_style IS 'Style d''apprentissage de l''utilisateur';
COMMENT ON COLUMN ai_teacher_agent_configs.troubles_context IS 'Contexte JSON des troubles détectés';
COMMENT ON COLUMN ai_teacher_agent_configs.elevenlabs_agent_id IS 'ID de l''agent ElevenLabs pour réutilisation';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Activer RLS sur toutes les tables
ALTER TABLE ai_teacher_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_teacher_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_teacher_agent_configs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Policies pour ai_teacher_conversations
-- ============================================================================

-- Policy: Les utilisateurs peuvent voir leurs propres conversations
CREATE POLICY "Users can view own conversations"
  ON ai_teacher_conversations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent créer leurs propres conversations
CREATE POLICY "Users can create own conversations"
  ON ai_teacher_conversations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent mettre à jour leurs propres conversations
CREATE POLICY "Users can update own conversations"
  ON ai_teacher_conversations
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent supprimer leurs propres conversations
CREATE POLICY "Users can delete own conversations"
  ON ai_teacher_conversations
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- Policies pour ai_teacher_messages
-- ============================================================================

-- Policy: Les utilisateurs peuvent voir les messages de leurs conversations
CREATE POLICY "Users can view messages of own conversations"
  ON ai_teacher_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ai_teacher_conversations
      WHERE id = conversation_id AND user_id = auth.uid()
    )
  );

-- Policy: Les utilisateurs peuvent créer des messages dans leurs conversations
CREATE POLICY "Users can create messages in own conversations"
  ON ai_teacher_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_teacher_conversations
      WHERE id = conversation_id AND user_id = auth.uid()
    )
  );

-- Policy: Les utilisateurs peuvent mettre à jour leurs propres messages
CREATE POLICY "Users can update messages in own conversations"
  ON ai_teacher_messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM ai_teacher_conversations
      WHERE id = conversation_id AND user_id = auth.uid()
    )
  );

-- Policy: Les utilisateurs peuvent supprimer leurs propres messages
CREATE POLICY "Users can delete messages in own conversations"
  ON ai_teacher_messages
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM ai_teacher_conversations
      WHERE id = conversation_id AND user_id = auth.uid()
    )
  );

-- ============================================================================
-- Policies pour ai_teacher_agent_configs
-- ============================================================================

-- Policy: Les utilisateurs peuvent gérer leurs propres configs d'agents
CREATE POLICY "Users can manage own agent configs"
  ON ai_teacher_agent_configs
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- FONCTIONS UTILITAIRES
-- ============================================================================

-- Fonction: Mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update updated_at sur ai_teacher_conversations
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON ai_teacher_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VUES UTILES (OPTIONNEL)
-- ============================================================================

-- Vue: Statistiques de conversation par utilisateur
CREATE OR REPLACE VIEW ai_teacher_user_stats AS
SELECT
  user_id,
  COUNT(*) AS total_conversations,
  COUNT(*) FILTER (WHERE status = 'active') AS active_conversations,
  COUNT(*) FILTER (WHERE status = 'ended') AS ended_conversations,
  COUNT(*) FILTER (WHERE conversation_type = 'general') AS general_conversations,
  COUNT(*) FILTER (WHERE conversation_type = 'course') AS course_conversations,
  COUNT(*) FILTER (WHERE conversation_type = 'quiz') AS quiz_conversations,
  COUNT(*) FILTER (WHERE conversation_type = 'exercise') AS exercise_conversations,
  MAX(created_at) AS last_conversation_at
FROM ai_teacher_conversations
GROUP BY user_id;

-- Commentaire sur la vue
COMMENT ON VIEW ai_teacher_user_stats IS 'Statistiques d''utilisation du professeur virtuel par utilisateur';

-- ============================================================================
-- SEED DATA (OPTIONNEL - Pour tests)
-- ============================================================================

-- Vous pouvez ajouter des données de test ici si nécessaire
-- Par exemple:
-- INSERT INTO ai_teacher_conversations (user_id, conversation_type, agent_config, status)
-- VALUES ('...', 'general', '{"system_prompt": "..."}', 'active');

-- ============================================================================
-- VÉRIFICATION
-- ============================================================================

-- Vérifier que les tables sont créées
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'ai_teacher%';

-- Vérifier que RLS est activé
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE 'ai_teacher%';

-- Vérifier les policies
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename LIKE 'ai_teacher%';

-- ============================================================================
-- FIN DES MIGRATIONS
-- ============================================================================

-- Note: Si vous devez rollback ces migrations:
-- DROP VIEW IF EXISTS ai_teacher_user_stats;
-- DROP TRIGGER IF EXISTS update_conversations_updated_at ON ai_teacher_conversations;
-- DROP FUNCTION IF EXISTS update_updated_at_column();
-- DROP TABLE IF EXISTS ai_teacher_messages CASCADE;
-- DROP TABLE IF EXISTS ai_teacher_conversations CASCADE;
-- DROP TABLE IF EXISTS ai_teacher_agent_configs CASCADE;
