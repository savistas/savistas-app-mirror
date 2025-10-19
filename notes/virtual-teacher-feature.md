# 🎓 Feature: Professeur Virtuel IA

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture technique](#architecture-technique)
3. [Configuration ElevenLabs API](#configuration-elevenlabs-api)
4. [Configuration Equos.ai](#configuration-equosai)
5. [Guide de déploiement](#guide-de-déploiement)
6. [Structure des fichiers](#structure-des-fichiers)
7. [Base de données](#base-de-données)
8. [Utilisation](#utilisation)
9. [Troubleshooting](#troubleshooting)

---

## Vue d'ensemble

### Objectif
Créer un assistant pédagogique virtuel avec avatar animé qui permet aux étudiants de converser vocalement avec un professeur IA personnalisé selon leur profil d'apprentissage et leurs troubles détectés.

### Technologies utilisées
- **ElevenLabs Conversational AI**: Voix naturelle et intelligence conversationnelle
- **Equos.ai**: Avatar animé synchronisé avec la voix
- **React + TypeScript**: Frontend
- **Supabase**: Backend (base de données + Edge Functions)
- **WebRTC/WebSocket**: Communication temps réel

### Fonctionnalités principales
1. **Conversation générale**: Discussion libre avec le professeur
2. **Aide sur un cours**: Assistance contextuelle sur un cours spécifique
3. **Explication d'erreurs**: Comprendre pourquoi certaines réponses de quiz sont incorrectes
4. **Personnalisation dynamique**: Agent adapté au style d'apprentissage et aux troubles de l'étudiant

---

## Architecture technique

### Diagramme de flux de données

```
┌─────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (React)                            │
│  /professeur-virtuel page                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │ Mode Selector│  │ Avatar Display│  │ Voice Control │             │
│  └──────┬───────┘  └──────▲───────┘  └──────┬───────┘             │
└─────────┼──────────────────┼──────────────────┼───────────────────┘
          │                  │                  │
          ▼                  │                  ▼
    [Select Mode]            │           [Record Audio]
          │                  │                  │
          ▼                  │                  ▼
    [Load Context]           │         [Send to Edge Function]
          │                  │                  │
          ▼                  │                  ▼
┌──────────────────────────────────┐  ┌──────────────────────┐
│  Supabase Edge Function          │  │ Audio Processing     │
│  /virtual-teacher-proxy          │  └────────┬─────────────┘
│  - Authenticate user             │           │
│  - Build personalized prompt     │           ▼
│  - Create/get ElevenLabs agent   │  ┌──────────────────────┐
│  - Proxy API calls               │  │ ElevenLabs API       │
└──────────┬───────────────────────┘  │ - Speech-to-Text     │
           │                           │ - AI Response        │
           ▼                           │ - Text-to-Speech     │
┌──────────────────────────┐         └────────┬─────────────┘
│  Supabase Database       │                  │
│  - profiles              │                  │ Audio Stream
│  - troubles_detection    │                  ▼
│  - courses               │         ┌──────────────────────┐
│  - ai_teacher_*          │         │ Equos.ai API         │
└──────────────────────────┘         │ - Animate Avatar     │
                                     │ - Sync Lips          │
                                     └────────┬─────────────┘
                                              │
                                              │ Video Stream
                                              ▼
                                     ┌──────────────────────┐
                                     │ Frontend Display     │
                                     │ <video> + transcript │
                                     └──────────────────────┘
```

### Stack technique

**Frontend:**
- React 18 + TypeScript
- Custom hooks pour logique métier
- WebSocket pour communication temps réel
- MediaRecorder API pour enregistrement audio
- shadcn/ui pour les composants UI

**Backend:**
- Supabase Edge Functions (Deno runtime)
- PostgreSQL avec RLS
- Row Level Security pour isolation des données

**APIs externes:**
- ElevenLabs Conversational AI
- Equos.ai Avatar Engine

---

## Configuration ElevenLabs API

### Étape 1: Créer un compte ElevenLabs

1. Aller sur [https://elevenlabs.io](https://elevenlabs.io)
2. Cliquer sur "Sign Up" et créer un compte
3. Choisir un plan:
   - **Free**: 10,000 caractères/mois (suffisant pour tests)
   - **Starter**: $5/mois - 30,000 caractères
   - **Creator**: $22/mois - 100,000 caractères
   - **Pro**: $99/mois - 500,000 caractères

### Étape 2: Obtenir la clé API

1. Une fois connecté, aller dans **Profile Settings** (icône en haut à droite)
2. Cliquer sur l'onglet **API Keys**
3. Cliquer sur **"Create API Key"**
4. Donner un nom à votre clé (ex: "Savistas AI-Cademy")
5. Copier la clé générée (format: `sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)

⚠️ **IMPORTANT**: Cette clé est secrète et ne doit JAMAIS être exposée dans le code frontend ou commitée dans Git.

### Étape 3: Ajouter la clé dans Supabase

**Option A: Via le Dashboard Supabase (Recommandé)**

1. Aller sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionner votre projet (`vvmkbpkoccxpmfpxhacv`)
3. Aller dans **Settings** → **Edge Functions** → **Environment Variables**
4. Cliquer sur **"Add new secret"**
5. Nom: `ELEVENLABS_API_KEY`
6. Valeur: Coller votre clé API ElevenLabs
7. Cliquer sur **"Save"**

**Option B: Via CLI Supabase**

```bash
cd /Users/elliotestrade/Desktop/Documents/03.\ ESST-SOLUTIONS/Coding/savistas-ai-cademy-main

# Vérifier que Supabase CLI est installé
npx supabase --version

# Ajouter le secret
npx supabase secrets set ELEVENLABS_API_KEY=sk_votre_cle_ici
```

### Étape 4: Comprendre l'API Conversational AI

ElevenLabs propose plusieurs APIs. Pour notre cas, nous utilisons **Conversational AI** qui permet de créer des agents conversationnels complets.

**Endpoints principaux:**

#### 1. Créer un agent conversationnel

```bash
POST https://api.elevenlabs.io/v1/convai/agents
```

**Headers:**
```json
{
  "xi-api-key": "sk_xxxxx",
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "name": "Professeur Math - User 123",
  "voice_id": "21m00Tcm4TlvDq8ikWAM",
  "system_prompt": "Tu es un professeur de mathématiques bienveillant...",
  "temperature": 0.7,
  "max_tokens": 500,
  "language": "fr"
}
```

**Response:**
```json
{
  "agent_id": "agent_abc123xyz",
  "name": "Professeur Math - User 123",
  "voice_id": "21m00Tcm4TlvDq8ikWAM",
  "created_at": "2025-10-17T10:00:00Z"
}
```

#### 2. Lister les voix disponibles

```bash
GET https://api.elevenlabs.io/v1/voices
```

**Voix françaises recommandées:**
- `21m00Tcm4TlvDq8ikWAM` - Rachel (féminine, mature, anglais mais adaptable)
- `pNInz6obpgDQGcFmaJgB` - Adam (masculine, mature)
- `EXAVITQu4vr4xnSDxMaL` - Sarah (féminine, jeune)

Pour des voix françaises natives, utiliser l'option de clonage de voix ou les voix multilingues.

#### 3. Démarrer une conversation (WebSocket)

```javascript
const ws = new WebSocket('wss://api.elevenlabs.io/v1/convai/conversation');

ws.onopen = () => {
  // Initialiser la conversation
  ws.send(JSON.stringify({
    type: 'init',
    agent_id: 'agent_abc123xyz',
    audio_format: 'pcm_16000'
  }));
};

// Envoyer l'audio de l'utilisateur
ws.send(JSON.stringify({
  type: 'audio',
  data: base64EncodedAudio
}));

// Recevoir la réponse
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  if (message.type === 'audio') {
    const audioData = base64ToArrayBuffer(message.data);
    const transcript = message.transcript;
    // Jouer l'audio et afficher la transcription
  }
};
```

### Étape 5: Tester l'API avec curl

```bash
# 1. Créer un agent de test
curl -X POST "https://api.elevenlabs.io/v1/convai/agents" \
  -H "xi-api-key: sk_votre_cle_ici" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Professor",
    "voice_id": "21m00Tcm4TlvDq8ikWAM",
    "system_prompt": "Tu es un professeur bienveillant qui aide les étudiants.",
    "language": "fr"
  }'

# Note: L'agent_id retourné sera utilisé pour les conversations
```

### Étape 6: Limites et quotas

**Free Plan:**
- 10,000 caractères/mois
- ~7 minutes d'audio généré
- Accès à toutes les voix
- Vitesse standard

**Paid Plans:**
- Caractères supplémentaires
- Priorité de traitement
- Voix premium
- Support technique

**Monitoring de l'usage:**
- Dashboard ElevenLabs → Usage
- Voir les caractères consommés en temps réel
- Alertes quand quota atteint

---

## Configuration Equos.ai

### Étape 1: Créer un compte Equos.ai

1. Aller sur [https://equos.ai](https://equos.ai)
2. S'inscrire avec votre email professionnel
3. Vérifier votre email

### Étape 2: Obtenir l'accès à l'API

⚠️ **Note**: Equos.ai est une plateforme B2B qui nécessite généralement un contact avec leur équipe commerciale.

**Option A: Contact commercial**
1. Aller sur [https://equos.ai/contact](https://equos.ai/contact)
2. Remplir le formulaire de contact
3. Mentionner votre cas d'usage: "Professeur virtuel pour plateforme éducative"
4. Demander l'accès API et les informations de tarification

**Option B: Utiliser une alternative (si Equos.ai n'est pas disponible)**

Alternatives possibles:
- **D-ID** ([https://www.d-id.com](https://www.d-id.com)) - API similaire, plus accessible
- **Synthesia** ([https://www.synthesia.io](https://www.synthesia.io)) - Génération vidéo avec avatar
- **HeyGen** ([https://www.heygen.com](https://www.heygen.com)) - Avatar parlant avec API

### Étape 3: Configuration avec ElevenLabs

Equos.ai s'intègre directement avec ElevenLabs. Le flow est:

```
ElevenLabs Audio → Equos.ai → Video avec avatar animé
```

**Configuration typique:**

```javascript
// Après avoir reçu l'audio de ElevenLabs
const response = await fetch('https://api.equos.ai/v1/avatar/animate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${EQUOS_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    audio_source: 'elevenlabs',
    audio_url: elevenLabsAudioUrl,
    avatar_id: 'default_teacher',
    quality: 'high'
  })
});

const videoUrl = await response.json();
```

### Étape 4: Ajouter la clé API dans Supabase

Une fois que vous avez obtenu votre clé API Equos.ai:

```bash
npx supabase secrets set EQUOS_API_KEY=votre_cle_equos
```

### Étape 5: Alternative - D-ID (Plus accessible)

Si Equos.ai n'est pas disponible immédiatement, voici comment configurer D-ID:

1. Créer un compte sur [https://studio.d-id.com](https://studio.d-id.com)
2. Aller dans **Settings** → **API Keys**
3. Créer une clé API
4. Ajouter dans Supabase:

```bash
npx supabase secrets set DID_API_KEY=votre_cle_did
```

**Exemple d'utilisation D-ID:**

```javascript
const response = await fetch('https://api.d-id.com/talks', {
  method: 'POST',
  headers: {
    'Authorization': `Basic ${DID_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    source_url: 'https://d-id-public-bucket.s3.amazonaws.com/alice.jpg',
    script: {
      type: 'audio',
      audio_url: elevenLabsAudioUrl
    },
    config: {
      fluent: true,
      pad_audio: 0
    }
  })
});
```

---

## Guide de déploiement

### Prérequis

1. **Node.js 18+** installé
2. **Supabase CLI** installé: `npm install -g supabase`
3. **Docker Desktop** (pour Supabase local)
4. **Clés API** obtenues (ElevenLabs + Equos.ai/D-ID)

### Étape 1: Installation des dépendances

```bash
cd /Users/elliotestrade/Desktop/Documents/03.\ ESST-SOLUTIONS/Coding/savistas-ai-cademy-main

# Installer les dépendances npm
npm install
```

### Étape 2: Configuration de la base de données

**A. Créer les migrations**

Les fichiers de migration sont dans `supabase/migrations/`. Appliquer les migrations:

```bash
# Si vous utilisez Supabase local
npx supabase start
npx supabase db push

# Si vous utilisez Supabase cloud
npx supabase db push --db-url postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```

**B. Vérifier les tables créées**

```bash
npx supabase db dump --schema public
```

Vous devriez voir les tables:
- `ai_teacher_conversations`
- `ai_teacher_messages`
- `ai_teacher_agent_configs`

### Étape 3: Déployer les Edge Functions

**A. Créer l'Edge Function**

```bash
# Créer la fonction si elle n'existe pas déjà
npx supabase functions new virtual-teacher-proxy
```

**B. Déployer la fonction**

```bash
npx supabase functions deploy virtual-teacher-proxy
```

**C. Vérifier le déploiement**

```bash
npx supabase functions list
```

Vous devriez voir `virtual-teacher-proxy` dans la liste.

### Étape 4: Configurer les secrets

```bash
# ElevenLabs API Key
npx supabase secrets set ELEVENLABS_API_KEY=sk_xxxxx

# Equos.ai API Key (ou D-ID)
npx supabase secrets set EQUOS_API_KEY=xxxxx
# OU
npx supabase secrets set DID_API_KEY=xxxxx
```

### Étape 5: Tester localement

```bash
# Démarrer le serveur de développement
npm run dev

# Ouvrir http://localhost:8080
# Naviguer vers /professeur-virtuel
```

### Étape 6: Build et déploiement production

```bash
# Build optimisé
npm run build

# Les fichiers statiques sont dans dist/
# Déployer sur votre hébergeur (Vercel, Netlify, etc.)
```

**Exemple avec Vercel:**

```bash
npm install -g vercel
vercel deploy --prod
```

---

## Structure des fichiers

```
savistas-ai-cademy-main/
├── notes/
│   └── virtual-teacher-feature.md          # Ce fichier
│
├── src/
│   ├── pages/
│   │   └── VirtualTeacher.tsx              # Page principale
│   │
│   ├── components/
│   │   └── virtual-teacher/
│   │       ├── ConversationModeSelector.tsx
│   │       ├── AvatarDisplay.tsx
│   │       ├── VoiceControls.tsx
│   │       ├── ConversationHistory.tsx
│   │       ├── ContextSelector.tsx
│   │       ├── CourseSelector.tsx
│   │       ├── QuizErrorSelector.tsx
│   │       └── ConversationSettings.tsx
│   │
│   ├── hooks/
│   │   ├── useVirtualTeacher.ts            # Hook principal
│   │   ├── useElevenLabs.ts                # Connexion ElevenLabs
│   │   ├── useEquosAvatar.ts               # Intégration Equos.ai
│   │   ├── useVoiceRecording.ts            # Enregistrement audio
│   │   └── useConversationHistory.ts       # Historique
│   │
│   ├── services/
│   │   ├── elevenLabsService.ts            # API ElevenLabs
│   │   ├── equosService.ts                 # API Equos.ai
│   │   └── agentConfigService.ts           # Génération prompts
│   │
│   └── App.tsx                             # Ajout de la route
│
└── supabase/
    ├── functions/
    │   └── virtual-teacher-proxy/
    │       └── index.ts                     # Edge Function
    │
    └── migrations/
        └── YYYYMMDDHHMMSS_create_virtual_teacher_tables.sql
```

---

## Base de données

### Tables créées

#### 1. `ai_teacher_conversations`

Stocke les sessions de conversation.

```sql
CREATE TABLE ai_teacher_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  conversation_type TEXT NOT NULL CHECK (conversation_type IN ('general', 'course', 'quiz', 'exercise')),
  context_id UUID NULL,
  context_data JSONB NULL,
  agent_config JSONB NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Colonnes:**
- `id`: Identifiant unique de la conversation
- `user_id`: Référence au profil de l'utilisateur
- `conversation_type`: Type de conversation (general, course, quiz, exercise)
- `context_id`: ID du contexte (course_id, quiz_id, etc.)
- `context_data`: Données contextuelles (JSON)
- `agent_config`: Configuration de l'agent utilisé (JSON)
- `status`: État de la conversation (active/ended)

#### 2. `ai_teacher_messages`

Stocke les messages de chaque conversation.

```sql
CREATE TABLE ai_teacher_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES ai_teacher_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  audio_url TEXT NULL,
  metadata JSONB NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Colonnes:**
- `id`: Identifiant unique du message
- `conversation_id`: Référence à la conversation
- `role`: Rôle (user ou assistant)
- `content`: Contenu texte du message
- `audio_url`: URL de l'audio (optionnel)
- `metadata`: Métadonnées (durée, etc.)

#### 3. `ai_teacher_agent_configs`

Cache les configurations d'agents pour réutilisation.

```sql
CREATE TABLE ai_teacher_agent_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  learning_style TEXT NOT NULL,
  troubles_context JSONB NOT NULL,
  system_prompt TEXT NOT NULL,
  elevenlabs_agent_id TEXT NULL,
  voice_id TEXT DEFAULT 'default',
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Colonnes:**
- `id`: Identifiant unique de la config
- `user_id`: Référence au profil
- `learning_style`: Style d'apprentissage (visuel, auditif, etc.)
- `troubles_context`: Contexte des troubles (JSON)
- `system_prompt`: Prompt système généré
- `elevenlabs_agent_id`: ID de l'agent ElevenLabs créé
- `voice_id`: ID de la voix utilisée

### Sécurité (RLS Policies)

Toutes les tables ont Row Level Security (RLS) activé:

```sql
-- Exemple pour ai_teacher_conversations
ALTER TABLE ai_teacher_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations"
  ON ai_teacher_conversations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations"
  ON ai_teacher_conversations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

---

## Utilisation

### Pour l'utilisateur final

#### 1. Accéder au professeur virtuel

1. Se connecter à l'application
2. Cliquer sur "Professeur Virtuel" dans le menu de navigation
3. La page `/professeur-virtuel` s'ouvre

#### 2. Choisir un mode de conversation

**Mode A: Conversation générale**
- Cliquer sur "Conversation libre"
- L'avatar apparaît et écoute
- Cliquer sur le bouton micro et parler
- L'avatar répond avec sa voix et ses animations

**Mode B: Aide sur un cours**
- Cliquer sur "Aide sur un cours"
- Sélectionner un cours dans la liste
- Poser des questions spécifiques au cours
- Le professeur répond en se basant sur le contenu du cours

**Mode C: Comprendre mes erreurs**
- Cliquer sur "Comprendre mes erreurs"
- Sélectionner un quiz où vous avez fait des erreurs
- Le professeur explique pourquoi vos réponses étaient incorrectes
- Poser des questions de clarification

#### 3. Interagir avec le professeur

- **Parler**: Cliquer sur le bouton micro, parler, relâcher
- **Écouter**: L'avatar s'anime et parle
- **Lire**: La transcription apparaît dans le chat
- **Historique**: Voir toutes les conversations passées

### Pour le développeur

#### 1. Créer un nouvel agent personnalisé

```typescript
import { agentConfigService } from '@/services/agentConfigService';

const config = await agentConfigService.generateAgentConfig(
  userId,
  conversationType,
  contextData
);
```

#### 2. Ajouter un nouveau type de conversation

1. Modifier l'enum dans la base de données:

```sql
ALTER TABLE ai_teacher_conversations
DROP CONSTRAINT ai_teacher_conversations_conversation_type_check;

ALTER TABLE ai_teacher_conversations
ADD CONSTRAINT ai_teacher_conversations_conversation_type_check
CHECK (conversation_type IN ('general', 'course', 'quiz', 'exercise', 'nouveau_type'));
```

2. Ajouter le type dans le frontend:

```typescript
// src/types/virtual-teacher.ts
export type ConversationType = 'general' | 'course' | 'quiz' | 'exercise' | 'nouveau_type';
```

3. Ajouter le mode dans le sélecteur:

```tsx
// src/components/virtual-teacher/ConversationModeSelector.tsx
<ModeButton
  type="nouveau_type"
  label="Nouveau Mode"
  icon={<NewIcon />}
  onSelect={handleModeSelect}
/>
```

#### 3. Personnaliser le prompt système

```typescript
// src/services/agentConfigService.ts
const customPrompt = `
Tu es un professeur ${subject} spécialisé en ${specialization}.

Style d'apprentissage de l'étudiant: ${learningStyle}

Adaptations nécessaires:
${troublesAdaptations}

Instructions:
- Utilise un langage simple et clair
- Donne des exemples concrets
- Encourage l'étudiant régulièrement
`;
```

---

## Troubleshooting

### Problème 1: WebSocket ne se connecte pas

**Symptôme:**
```
WebSocket connection failed: Error during WebSocket handshake
```

**Solutions:**
1. Vérifier que la clé API ElevenLabs est correcte:
   ```bash
   npx supabase secrets list
   ```

2. Vérifier que l'Edge Function est déployée:
   ```bash
   npx supabase functions list
   ```

3. Vérifier les logs de l'Edge Function:
   ```bash
   npx supabase functions logs virtual-teacher-proxy
   ```

### Problème 2: Le microphone ne fonctionne pas

**Symptôme:**
```
NotAllowedError: Permission denied
```

**Solutions:**
1. Vérifier que le navigateur a l'autorisation d'accéder au micro
2. Utiliser HTTPS (le microphone ne fonctionne qu'en HTTPS ou localhost)
3. Tester avec un autre navigateur

**Code de debug:**
```typescript
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => console.log('Microphone OK', stream))
  .catch(error => console.error('Erreur micro:', error));
```

### Problème 3: L'avatar ne s'affiche pas

**Symptôme:**
L'audio fonctionne mais pas l'avatar vidéo.

**Solutions:**
1. Vérifier que la clé Equos.ai/D-ID est configurée
2. Vérifier les logs de la console:
   ```javascript
   console.log('Avatar status:', avatarStream);
   ```

3. Mode fallback: Afficher uniquement l'audio sans avatar

### Problème 4: Quota API dépassé

**Symptôme:**
```json
{
  "error": "quota_exceeded",
  "message": "Monthly character limit reached"
}
```

**Solutions:**
1. Vérifier l'usage dans le dashboard ElevenLabs
2. Upgrader le plan si nécessaire
3. Implémenter un système de limite côté application:

```typescript
// Limiter à 10 conversations/jour par user
const dailyLimit = 10;
const count = await supabase
  .from('ai_teacher_conversations')
  .select('id', { count: 'exact' })
  .eq('user_id', userId)
  .gte('created_at', startOfDay)
  .lte('created_at', endOfDay);

if (count >= dailyLimit) {
  throw new Error('Limite quotidienne atteinte');
}
```

### Problème 5: Latence élevée

**Symptôme:**
L'avatar met plus de 5 secondes à répondre.

**Solutions:**
1. Vérifier la qualité de la connexion internet
2. Réduire la longueur des prompts système
3. Utiliser le streaming audio (chunk par chunk):

```typescript
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  if (message.type === 'audio_chunk') {
    // Jouer immédiatement sans attendre la fin
    playAudioChunk(message.data);
  }
};
```

### Problème 6: L'agent répond en anglais au lieu de français

**Symptôme:**
Malgré le prompt en français, l'agent répond en anglais.

**Solutions:**
1. Ajouter explicitement la langue dans la configuration:
   ```json
   {
     "language": "fr",
     "system_prompt": "Tu dois TOUJOURS répondre en français."
   }
   ```

2. Utiliser une voix française native

3. Ajouter des exemples de réponses en français dans le prompt:
   ```
   Exemple de réponse:
   User: "Comment résoudre cette équation ?"
   Assistant: "Pour résoudre cette équation, commençons par..."
   ```

---

## Checklist de déploiement

### Avant de déployer en production

- [ ] Clé API ElevenLabs configurée dans Supabase
- [ ] Clé API Equos.ai/D-ID configurée dans Supabase
- [ ] Migrations de base de données appliquées
- [ ] Edge Functions déployées
- [ ] RLS policies testées
- [ ] Tests de bout en bout réalisés
- [ ] Limites de quotas configurées
- [ ] Monitoring des erreurs activé (Sentry)
- [ ] Logs ElevenLabs/Equos configurés
- [ ] Documentation utilisateur créée
- [ ] Tests de performance réalisés (latence < 3s)
- [ ] Tests multi-navigateurs (Chrome, Firefox, Safari)
- [ ] Tests mobile (responsive)
- [ ] Plan de backup si API tombe
- [ ] Support contact configuré

### Tester la feature complète

1. **Test de conversation générale:**
   - Créer un nouveau compte utilisateur
   - Compléter les questionnaires (troubles + styles)
   - Aller sur /professeur-virtuel
   - Sélectionner "Conversation libre"
   - Parler dans le micro
   - Vérifier que l'avatar répond correctement

2. **Test de conversation sur cours:**
   - Créer un cours de test
   - Sélectionner "Aide sur un cours"
   - Choisir le cours
   - Poser une question sur le contenu
   - Vérifier que la réponse est contextualisée

3. **Test de conversation sur erreurs:**
   - Faire un quiz avec des erreurs volontaires
   - Sélectionner "Comprendre mes erreurs"
   - Choisir le quiz
   - Demander explication d'une erreur
   - Vérifier que l'explication est pertinente

4. **Test de personnalisation:**
   - Créer 2 comptes avec profils différents:
     * Compte A: Style visuel + dyslexie élevée
     * Compte B: Style auditif + TDAH modéré
   - Comparer les réponses du professeur
   - Vérifier que les adaptations sont présentes

---

## Roadmap future

### Phase 1 (Actuelle): MVP
- ✅ Conversation générale
- ✅ Aide sur cours
- ✅ Explication d'erreurs
- ✅ Personnalisation basique

### Phase 2: Améliorations
- [ ] Historique des conversations avec recherche
- [ ] Mode texte (fallback si pas de micro)
- [ ] Choix de plusieurs voix
- [ ] Avatar personnalisable (genre, apparence)
- [ ] Export des conversations en PDF
- [ ] Partage de conversations avec professeur humain

### Phase 3: Fonctionnalités avancées
- [ ] Mode "correction de devoirs" (upload fichier)
- [ ] Génération de quiz basée sur conversation
- [ ] Recommandations de cours basées sur discussions
- [ ] Multi-langue (anglais, espagnol, etc.)
- [ ] Intégration avec calendrier (rappels)
- [ ] Statistiques d'utilisation

### Phase 4: IA avancée
- [ ] Détection automatique de difficultés
- [ ] Adaptation dynamique du niveau
- [ ] Suggestions proactives
- [ ] Mode "professeur expert" par matière
- [ ] Intégration avec ChatGPT/Claude pour raisonnement complexe

---

## Support et ressources

### Documentation officielle

- **ElevenLabs**: [https://docs.elevenlabs.io](https://docs.elevenlabs.io)
- **Equos.ai**: [https://docs.equos.ai](https://docs.equos.ai) (si disponible)
- **D-ID**: [https://docs.d-id.com](https://docs.d-id.com)
- **Supabase**: [https://supabase.com/docs](https://supabase.com/docs)

### Communauté

- **ElevenLabs Discord**: [https://discord.gg/elevenlabs](https://discord.gg/elevenlabs)
- **Supabase Discord**: [https://discord.supabase.com](https://discord.supabase.com)

### Contact

Pour toute question sur cette feature:
- Email: votre-email@example.com
- GitHub Issues: [lien vers repo]

---

## Conclusion

Cette feature de Professeur Virtuel IA apporte une dimension interactive et personnalisée à la plateforme Savistas AI-Cademy. En combinant ElevenLabs pour la voix naturelle et Equos.ai pour l'avatar animé, nous créons une expérience d'apprentissage immersive qui s'adapte à chaque étudiant.

Les prochaines étapes sont:
1. Configurer vos clés API ElevenLabs et Equos.ai
2. Déployer les Edge Functions Supabase
3. Créer les tables de base de données
4. Tester la feature avec des utilisateurs pilotes
5. Itérer selon les retours

Bonne mise en œuvre ! 🚀
