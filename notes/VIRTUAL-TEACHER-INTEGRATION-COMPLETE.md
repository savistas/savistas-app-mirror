# Intégration Complète du Professeur Virtuel ✅

## Vue d'ensemble

L'intégration du **Professeur Virtuel** est maintenant complète. Cette fonctionnalité crée dynamiquement des agents ElevenLabs personnalisés pour chaque conversation, adaptés :
- Aux **3 styles d'apprentissage dominants** de l'utilisateur
- Au **contexte** de la conversation (cours, exercice, quiz, erreur, ou général)
- Au **contenu spécifique** (cours, exercice, etc.)

## 🎯 Fonctionnalités

### 1. Création d'agents dynamiques
À chaque nouvelle conversation, un agent ElevenLabs unique est créé avec :
- Un **system prompt personnalisé** basé sur les styles d'apprentissage
- Un **contexte adapté** (cours, exercice, quiz, erreur)
- Des **directives pédagogiques** spécifiques

### 2. Analyse des styles d'apprentissage
Le système analyse automatiquement les 12 styles d'apprentissage possibles :
- Visuel
- Spatial
- Auditif
- Linguistique
- Kinesthésique
- Lecture
- Écriture
- Logique/Mathématique
- Social/Interpersonnel
- Musical
- Naturaliste
- Solitaire/Intrapersonnel

Les 3 styles dominants sont utilisés pour personnaliser l'agent.

### 3. Types de conversations supportés

#### Conversation générale
- Discussion libre avec le professeur
- Pas de contexte spécifique

#### Étude d'un cours
- Sélection d'un cours existant
- L'agent connaît le contenu du cours
- L'agent adopte le rôle du professeur défini dans le cours

#### Résolution d'exercice
- Saisie du titre et de l'énoncé de l'exercice
- L'agent guide sans donner directement la réponse
- Encourage le raisonnement

#### Préparation quiz
- Saisie du titre du quiz
- L'agent aide à réviser les concepts
- Propose des questions de préparation

#### Analyse d'erreur
- Description de l'erreur commise
- L'agent analyse l'erreur avec bienveillance
- Propose une méthode pour éviter l'erreur

## 📁 Structure du code

### Services créés

```
src/services/
├── learningStylesAnalyzer.ts       # Analyse des styles d'apprentissage
├── systemPromptGenerator.ts        # Génération des prompts personnalisés
└── elevenLabsAgentService.ts      # Création d'agents ElevenLabs
```

### 1. `learningStylesAnalyzer.ts`

**Fonctions principales :**

```typescript
analyzeLearningStyles(userData: Record<string, any>): DominantStyles
```
- Extrait les scores des 12 styles depuis `profiles`
- Retourne les 3 styles dominants triés par score

```typescript
generateStyleDirectives(dominantStyles: LearningStyleScore[]): string
```
- Génère les directives pédagogiques pour les styles dominants

**Exemple d'utilisation :**
```typescript
const dominantStyles = analyzeLearningStyles(profileData);
console.log(dominantStyles.top3); // [{ name: 'Visuel', score: 8, ... }, ...]
```

### 2. `systemPromptGenerator.ts`

**Types principaux :**

```typescript
type ConversationType = 'general' | 'course' | 'exercise' | 'quiz' | 'error';

interface PromptContext {
  conversationType: ConversationType;
  courseName?: string;
  courseContent?: string;
  professorRole?: string;
  exerciseTitle?: string;
  exerciseContent?: string;
  quizTitle?: string;
  errorDescription?: string;
}

interface AgentConfig {
  systemPrompt: string;
  firstMessage: string;
  conversationType: ConversationType;
  contextSummary: string;
}
```

**Fonction principale :**

```typescript
generateAgentConfig(
  dominantStyles: LearningStyleScore[],
  context: PromptContext
): AgentConfig
```
- Génère un system prompt complet
- Combine styles d'apprentissage + contexte
- Crée un message d'accueil adapté

**Exemple d'utilisation :**
```typescript
const context: PromptContext = {
  conversationType: 'course',
  courseName: 'JavaScript Avancé',
  courseContent: '...',
  professorRole: 'Expert en développement web'
};

const agentConfig = generateAgentConfig(dominantStyles.top3, context);
console.log(agentConfig.systemPrompt); // Prompt complet personnalisé
```

### 3. `elevenLabsAgentService.ts`

**Fonctions principales :**

```typescript
createElevenLabsAgent(
  agentConfig: AgentConfig,
  agentName: string,
  voiceId: string = 'default'
): Promise<CreateAgentResponse>
```
- Crée un agent ElevenLabs via l'API
- Retourne l'agent ID

```typescript
getSignedUrl(agentId: string): Promise<string>
```
- Récupère une signed URL pour un agent
- Nécessaire pour démarrer une conversation

```typescript
createConversationAgent(
  agentConfig: AgentConfig,
  conversationName: string,
  voiceId: string = 'default'
): Promise<{ agentId: string; signedUrl: string }>
```
- **Fonction complète** qui crée l'agent ET récupère la signed URL
- C'est la fonction recommandée à utiliser

**Exemple d'utilisation :**
```typescript
const { agentId, signedUrl } = await createConversationAgent(
  agentConfig,
  'User123 - Course - JavaScript',
  'default'
);

// Utiliser signedUrl pour startSession
await conversation.startSession({ signedUrl });
```

## 🔄 Flow complet d'une conversation

### Étapes détaillées

1. **Utilisateur sélectionne le type et le contexte**
   - Choix du type : general, course, exercise, quiz, error
   - Remplissage des champs contextuels (cours, exercice, etc.)

2. **Clic sur "Démarrer la conversation"**

3. **Récupération du profil utilisateur**
   ```typescript
   const { data: profileData } = await supabase
     .from('profiles')
     .select('*')
     .eq('user_id', user.id)
     .single();
   ```

4. **Analyse des styles d'apprentissage**
   ```typescript
   const learningStyles = analyzeLearningStyles(profileData);
   // Retourne les 3 styles dominants
   ```

5. **Construction du contexte**
   ```typescript
   const promptContext = buildPromptContext(); // Basé sur la sélection
   ```

6. **Génération de la configuration agent**
   ```typescript
   const agentConfig = generateAgentConfig(learningStyles.top3, promptContext);
   ```

7. **Création de l'agent ElevenLabs**
   ```typescript
   const { agentId, signedUrl } = await createConversationAgent(
     agentConfig,
     conversationName,
     'default'
   );
   ```

8. **Sauvegarde dans Supabase**
   ```typescript
   const { data: newConversation } = await supabase
     .from('ai_teacher_conversations')
     .insert({
       user_id: user.id,
       conversation_type: promptContext.conversationType,
       context_id: selectedCourseId,
       context_data: { ... },
       agent_config: {
         agent_id: agentId,
         learning_styles: learningStyles.top3.map(s => s.name),
         system_prompt: agentConfig.systemPrompt
       },
       status: 'active'
     })
     .select()
     .single();
   ```

9. **Démarrage de la session ElevenLabs**
   ```typescript
   await conversation.startSession({ signedUrl });
   ```

10. **Conversation en cours**
    - Messages utilisateur et assistant sont sauvegardés en temps réel
    - Stockés dans `ai_teacher_messages`

11. **Fin de conversation**
    - Marquée comme "ended" dans `ai_teacher_conversations`

## 🗄️ Base de données

### Tables utilisées

#### `profiles`
Contient les scores des styles d'apprentissage :
- `score_visuel`, `score_spatial`, `score_auditif`, etc.
- 12 champs de scores au total

#### `ai_teacher_conversations`
Stocke chaque session de conversation :
- `id` (UUID)
- `user_id`
- `conversation_type` (general, course, quiz, exercise, error)
- `context_id` (UUID du cours, quiz, etc.)
- `context_data` (JSONB - données supplémentaires)
- `agent_config` (JSONB - config de l'agent créé)
- `status` (active, ended)
- `created_at`, `updated_at`

#### `ai_teacher_messages`
Stocke chaque message échangé :
- `id` (UUID)
- `conversation_id` (référence à `ai_teacher_conversations`)
- `role` ('user' ou 'assistant')
- `content` (texte du message)
- `audio_url` (optionnel - URL audio)
- `created_at`

#### `courses`
Utilisé pour récupérer le contenu des cours :
- `id`, `title`, `course_content`, `professor_role`

## 🎨 Interface utilisateur

### Page VirtualTeacher (`/professeur-virtuel`)

**Sections principales :**

1. **Contexte de conversation** (Card gauche)
   - Sélecteur de type
   - Champs contextuels conditionnels

2. **Contrôles** (Card droite)
   - Status de connexion
   - État de l'agent (parle/écoute)
   - Boutons démarrer/terminer
   - Instructions

3. **Transcription** (Card en bas)
   - Historique des messages en temps réel
   - Messages utilisateur (droite, bleu)
   - Messages professeur (gauche, gris)

4. **Info** (Card tout en bas)
   - Explication de la personnalisation

## 🔐 Sécurité et permissions

### Row Level Security (RLS)

Toutes les tables `ai_teacher_*` ont des policies RLS :
- Les utilisateurs ne voient que leurs propres données
- Basé sur `auth.uid() = user_id`

### Permissions requises

- **Microphone** : Demandé avant de démarrer la conversation
- **API ElevenLabs** : Clé API stockée dans `.env.local`

## 🚀 Déploiement

### Variables d'environnement

Ajouter dans `.env.local` :
```
VITE_ELEVENLABS_API_KEY=sk_634179baf28c2e9e6b47f016522d147f7d4aaebcee2000e8
```

### Migrations Supabase

Les migrations SQL sont déjà appliquées. Si besoin de les ré-appliquer :
```bash
# Voir le fichier notes/virtual-teacher-migrations.sql
npx supabase migration new virtual_teacher_tables
# Copier le contenu du fichier SQL
npx supabase db push
```

## 🧪 Tests recommandés

### 1. Test conversation générale
- Sélectionner "Conversation générale"
- Démarrer
- Vérifier que l'agent répond de manière appropriée

### 2. Test avec cours
- Créer un cours d'abord (via Upload Course)
- Sélectionner "Étude d'un cours"
- Choisir un cours
- Vérifier que l'agent connaît le contenu du cours

### 3. Test styles d'apprentissage
- Compléter le questionnaire de styles d'apprentissage
- Vérifier dans les logs que les 3 styles dominants sont bien identifiés
- Vérifier que le system prompt contient les directives correspondantes

### 4. Test sauvegarde
- Vérifier dans Supabase que :
  - La conversation est créée dans `ai_teacher_conversations`
  - Les messages sont sauvegardés dans `ai_teacher_messages`
  - Les données sont associées au bon `user_id`

## 📊 Monitoring

### Logs console

Le système log plusieurs étapes :
- `📊 Styles d'apprentissage analysés:` - Styles identifiés
- `🤖 Configuration agent générée` - Agent config créé
- `✅ Agent ElevenLabs créé:` - Agent ID
- `💾 Conversation créée dans Supabase:` - Conversation ID
- `🎙️ Conversation démarrée avec agent personnalisé`
- `✅ Message sauvegardé:` - Chaque message

### Vérification base de données

```sql
-- Voir les conversations récentes
SELECT * FROM ai_teacher_conversations
ORDER BY created_at DESC
LIMIT 10;

-- Voir les messages d'une conversation
SELECT * FROM ai_teacher_messages
WHERE conversation_id = 'conversation-uuid'
ORDER BY created_at;

-- Statistiques par utilisateur
SELECT * FROM ai_teacher_user_stats
WHERE user_id = 'user-uuid';
```

## 🛠️ Personnalisation future

### Ajouter d'autres voix

Modifier dans `VirtualTeacher.tsx` :
```typescript
const { agentId, signedUrl } = await createConversationAgent(
  agentConfig,
  conversationName,
  'voice-id-here' // Remplacer par ID voix ElevenLabs
);
```

### Modifier le modèle LLM

Modifier dans `elevenLabsAgentService.ts` :
```typescript
llm: 'gpt-4', // Changer en 'gpt-3.5-turbo' ou autre
```

### Ajouter d'autres types de contextes

1. Ajouter un type dans `systemPromptGenerator.ts` :
   ```typescript
   type ConversationType = 'general' | 'course' | 'exercise' | 'quiz' | 'error' | 'debate';
   ```

2. Ajouter la logique dans `generateBasePrompt()`

3. Ajouter l'UI dans `VirtualTeacher.tsx`

## 📝 Notes importantes

1. **Coûts ElevenLabs** : Chaque conversation crée un nouvel agent. Surveiller les quotas API.

2. **Alternative recommandée** : Si les coûts sont trop élevés, utiliser un seul agent avec override du system prompt (voir commentaires dans `elevenLabsAgentService.ts`).

3. **Cleanup agents** : Pour le moment, les agents ne sont pas supprimés automatiquement. Envisager un système de cleanup périodique.

4. **Styles d'apprentissage** : L'utilisateur doit avoir complété le questionnaire de styles d'apprentissage pour que la personnalisation fonctionne.

## ✅ Statut d'intégration

- ✅ Service d'analyse des styles d'apprentissage
- ✅ Service de génération de system prompts
- ✅ Service de création d'agents ElevenLabs
- ✅ Interface utilisateur avec sélecteur de contexte
- ✅ Flow complet fonctionnel
- ✅ Sauvegarde dans Supabase
- ✅ Tests de build réussis

## 🎉 Conclusion

L'intégration du Professeur Virtuel est **complète et fonctionnelle**. Chaque conversation bénéficie maintenant d'un agent IA personnalisé adapté aux besoins spécifiques de l'utilisateur.

Pour tester :
1. Accéder à `/professeur-virtuel`
2. Sélectionner un type de conversation
3. Cliquer sur "Démarrer la conversation"
4. Profiter de l'expérience personnalisée !
