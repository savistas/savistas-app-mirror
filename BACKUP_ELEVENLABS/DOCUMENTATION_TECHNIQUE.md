# 📚 Documentation Technique - Solution ElevenLabs

## 🎯 Vue d'ensemble

Cette solution utilise **ElevenLabs Conversational AI** avec la fonctionnalité **Dynamic Variables** pour créer un professeur virtuel entièrement personnalisé selon le profil de chaque étudiant.

---

## 🏗️ Architecture

### Composants principaux

```
┌─────────────────────────────────────────────────────────────┐
│                    VirtualTeacher.tsx                       │
│  (Page principale du professeur virtuel)                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
┌───────────────┐ ┌──────────┐ ┌────────────────┐
│ ElevenLabs    │ │ Supabase │ │ Services       │
│ SDK           │ │ Database │ │ - Analyzer     │
│ (@elevenlabs/ │ │          │ │ - Generator    │
│  react)       │ │          │ │ - Agent Svc    │
└───────────────┘ └──────────┘ └────────────────┘
        │
        ▼
┌───────────────────────────────────┐
│   ElevenLabs API                  │
│   - Agent: agent_5901k7s...       │
│   - Variables dynamiques          │
│   - Voix IA                       │
└───────────────────────────────────┘
```

---

## 📦 Dépendances

### Package.json

```json
{
  "dependencies": {
    "@elevenlabs/react": "^0.x.x"
  }
}
```

### Imports clés dans VirtualTeacher.tsx

```typescript
import { useConversation } from '@elevenlabs/react';
import { supabase } from '@/integrations/supabase/client';
import { analyzeLearningStyles } from '@/services/learningStylesAnalyzer';
import { generateAgentConfig } from '@/services/systemPromptGenerator';
import { getElevenLabsSignedUrl } from '@/services/elevenLabsAgentService';
```

---

## 🔧 Services

### 1. elevenLabsAgentService.ts

**Rôle** : Gérer l'interaction avec l'API ElevenLabs

**Fonctions :**

#### `getElevenLabsSignedUrl(agentId: string): Promise<string>`

Récupère une signed URL pour démarrer une session WebSocket avec ElevenLabs.

```typescript
export async function getElevenLabsSignedUrl(agentId: string): Promise<string> {
  const response = await fetch(
    `${ELEVENLABS_API_BASE}/convai/conversation/get_signed_url?agent_id=${agentId}`,
    {
      method: 'GET',
      headers: { 'xi-api-key': ELEVENLABS_API_KEY }
    }
  );

  const data = await response.json();
  return data.signed_url;
}
```

**⚠️ Note** : La fonction `createElevenLabsAgent()` existe mais ne fonctionne pas sans abonnement payant (HTTP 405).

---

### 2. systemPromptGenerator.ts

**Rôle** : Générer des prompts personnalisés selon le contexte

**Types :**

```typescript
export type ConversationType = 'general' | 'course' | 'exercise' | 'error';

export interface PromptContext {
  conversationType: ConversationType;
  courseName?: string;
  courseContent?: string;
  exerciseTitle?: string;
  exerciseContent?: string;
  errorDescription?: string;
  errorCategory?: string;
  errorContext?: string;
  professorRole?: string;
  additionalInstructions?: string;
}

export interface ElevenLabsAgentConfig {
  systemPrompt: string;
  firstMessage: string;
  voiceId?: string;
  language?: string;
}
```

**Fonction principale :**

```typescript
export function generateAgentConfig(
  learningStyles: Array<{ name: string; score: number } | null>,
  context: PromptContext
): ElevenLabsAgentConfig
```

**Fonctionnement :**
1. Reçoit les styles d'apprentissage et le contexte
2. Génère un prompt personnalisé selon le type de conversation
3. Retourne une configuration d'agent (systemPrompt + firstMessage)

**⚠️ Note** : Avec Dynamic Variables, le systemPrompt généré n'est plus utilisé directement, mais sauvegardé en DB pour référence.

---

### 3. learningStylesAnalyzer.ts

**Rôle** : Analyser les styles d'apprentissage à partir des scores

**Interface :**

```typescript
interface StylesApprentissageData {
  visuel: number;
  auditif: number;
  kinesthesique: number;
  linguistique: number;
  logique: number;
  social: number;
  solitaire: number;
  naturaliste: number;
}
```

**Fonction principale :**

```typescript
export function analyzeLearningStyles(data: StylesApprentissageData) {
  const styles = [
    { name: 'Visuel', score: data.visuel },
    { name: 'Auditif', score: data.auditif },
    // ... etc
  ];

  const top3 = styles
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return { top3, formatted: ... };
}
```

---

## 🔄 Flux de données complet

### Phase 1 : Préparation (au clic sur "Démarrer la conversation")

```typescript
// ÉTAPE 1 : Construire le contexte
const promptContext = await buildPromptContext();
// → Récupère cours/exercice/erreur selon le type sélectionné

// ÉTAPE 2 : Récupérer styles d'apprentissage
const { data: stylesData } = await supabase
  .from('styles_apprentissage')
  .select('*')
  .eq('user_id', user.id)
  .single();

const learningStyles = analyzeLearningStyles(stylesData);
// → Analyse et retourne top 3 styles

// ÉTAPE 2b : Récupérer profil complet
const { data: profileData } = await supabase
  .from('profiles')
  .select('full_name, email, education_level, classes, subjects')
  .eq('user_id', user.id)
  .single();

// ÉTAPE 2c : Récupérer troubles détectés
const { data: troublesData } = await supabase
  .from('troubles_detection_scores')
  .select('*')
  .eq('user_id', user.id)
  .single();

// Formater les troubles
let troublesText = 'Aucun trouble détecté';
if (troublesData) {
  const troublesList = [];
  // Parcourir tous les troubles et garder ceux != "Faible"
  // ...
  troublesText = troublesList.join(', ');
}
```

### Phase 2 : Génération des variables

```typescript
const dynamicVariables = {
  username: profileData?.full_name || user.email?.split('@')[0] || 'étudiant',
  learning_styles: learningStyles.top3.map(s => s?.name).join(', '),
  troubles: troublesText,
  custom_message: additionalInstructions.trim() || 'Aucune instruction supplémentaire',
  user_infos: `
Niveau d'éducation: ${profileData?.education_level || 'Non renseigné'}
Classe: ${profileData?.classes || 'Non renseigné'}
Matières: ${profileData?.subjects || 'Non renseigné'}
  `.trim()
};
```

### Phase 3 : Sauvegarde en base

```typescript
const { data: newConversation } = await supabase
  .from('ai_teacher_conversations')
  .insert({
    user_id: user.id,
    conversation_type: promptContext.conversationType,
    context_data: { ... },
    agent_config: {
      elevenlabs_agent_id: ELEVENLABS_AGENT_ID,
      learning_styles: learningStyles.top3.map(s => s?.name),
      system_prompt: agentConfig.systemPrompt, // Sauvegardé pour référence
      first_message: agentConfig.firstMessage
    },
    status: 'active'
  })
  .select()
  .single();

conversationIdRef.current = newConversation.id;
```

### Phase 4 : Démarrage de la session ElevenLabs

```typescript
// Récupérer signed URL
const signedUrl = await getElevenLabsSignedUrl(ELEVENLABS_AGENT_ID);

// Démarrer session avec variables dynamiques
await conversation.startSession({
  signedUrl,
  dynamicVariables // ← INJECTION DES VARIABLES
});
```

### Phase 5 : Conversation

Le hook `useConversation` gère automatiquement :

```typescript
const conversation = useConversation({
  onConnect: async () => {
    // Connexion établie
  },
  onDisconnect: async () => {
    // Marquer conversation comme terminée
    await supabase
      .from('ai_teacher_conversations')
      .update({ status: 'ended' })
      .eq('id', conversationIdRef.current);
  },
  onMessage: async (message) => {
    // Message reçu (user ou AI)
    if (message.source === 'user') {
      setMessages(prev => [...prev, { role: 'user', content: message.message }]);
      await saveMessage('user', message.message);
    } else if (message.source === 'ai') {
      setMessages(prev => [...prev, { role: 'assistant', content: message.message }]);
      await saveMessage('assistant', message.message);
    }
  },
  onError: (error) => {
    // Gestion des erreurs
  }
});
```

---

## 📊 Schéma de base de données

### Tables utilisées

#### `profiles`

| Colonne | Type | Description |
|---------|------|-------------|
| user_id | uuid | ID de l'utilisateur (FK) |
| full_name | text | Nom complet |
| email | varchar | Email |
| education_level | text | Niveau d'éducation (Primaire, Collège, Lycée, etc.) |
| classes | text | Classe (CP, 6ème, Seconde, etc.) |
| subjects | text | Matières (Mathématiques, Français, etc.) |

#### `styles_apprentissage`

| Colonne | Type | Description |
|---------|------|-------------|
| user_id | uuid | ID de l'utilisateur (FK) |
| visuel | integer | Score 0-100 |
| auditif | integer | Score 0-100 |
| kinesthesique | integer | Score 0-100 |
| linguistique | integer | Score 0-100 |
| logique | integer | Score 0-100 |
| social | integer | Score 0-100 |
| solitaire | integer | Score 0-100 |
| naturaliste | integer | Score 0-100 |

#### `troubles_detection_scores`

| Colonne | Type | Description |
|---------|------|-------------|
| user_id | uuid | ID de l'utilisateur (FK) |
| tdah_score | text | "Faible", "Modéré", "Élevé", "Très élevé" |
| dyslexie_score | text | Idem |
| dyscalculie_score | text | Idem |
| dyspraxie_score | text | Idem |
| tsa_score | text | Idem (Autisme) |
| trouble_langage_score | text | Idem |
| tdi_score | text | Idem |
| tics_tourette_score | text | Idem |
| begaiement_score | text | Idem |
| trouble_sensoriel_isole_score | text | Idem |
| has_medical_diagnosis | boolean | Diagnostic médical confirmé |
| medical_diagnosis_details | text | Détails du diagnostic |

#### `ai_teacher_conversations`

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | ID unique de la conversation |
| user_id | uuid | ID de l'utilisateur (FK) |
| conversation_type | text | "general", "course", "exercise", "error" |
| context_id | uuid | ID du cours/exercice/erreur (nullable) |
| context_data | jsonb | Données contextuelles |
| agent_config | jsonb | Configuration de l'agent |
| status | text | "active", "ended" |
| created_at | timestamp | Date de création |
| updated_at | timestamp | Date de modification |

**Structure de `agent_config` :**

```json
{
  "elevenlabs_agent_id": "agent_5901k7s57ptne94thf6jaf9ngqas",
  "ecos_agent_id": null,
  "ecos_session_id": null,
  "learning_styles": ["Visuel", "Auditif", "Kinesthésique"],
  "system_prompt": "Tu es un professeur...",
  "first_message": "Bonjour ! Comment puis-je..."
}
```

#### `ai_teacher_messages`

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | ID unique du message |
| conversation_id | uuid | ID de la conversation (FK) |
| role | text | "user" ou "assistant" |
| content | text | Contenu du message |
| created_at | timestamp | Date de création |

---

## 🎨 Configuration ElevenLabs Dashboard

### Agent ID

```
agent_5901k7s57ptne94thf6jaf9ngqas
```

### System Prompt configuré

Le system prompt dans le dashboard contient les **placeholders de variables** :

- `{{username}}`
- `{{learning_styles}}`
- `{{troubles}}`
- `{{custom_message}}`
- `{{user_infos}}`

Ces variables sont **remplacées au runtime** lors de l'appel à `startSession()`.

### Voix

Voix française configurée dans le dashboard (Charlotte, Bella, ou Adam selon préférence).

### LLM

GPT-4 (configuré dans le dashboard).

---

## 🔍 Débogage

### Logs clés à surveiller

Dans la console (F12), vous devriez voir :

```javascript
// Phase 1 : Récupération des données
📊 Styles d'apprentissage: ['Visuel', 'Auditif', 'Kinesthésique']
🏥 Troubles: Aucun trouble détecté
👤 Infos utilisateur: Niveau d'éducation: Lycée...

// Phase 2 : Injection des variables
🔧 [DYNAMIC VARS] Variables injectées: ['username', 'learning_styles', 'troubles', 'custom_message', 'user_infos']
📋 username: Marie Dupont
🎨 learning_styles: Visuel, Auditif
🏥 troubles: Aucun trouble détecté
💬 custom_message: Aucune instruction supplémentaire
👤 user_infos: Niveau d'éducation: Lycée...

// Phase 3 : Connexion
✅ [ELEVENLABS] Connecté à ElevenLabs
✅ [ELEVENLABS] Status: connected

// Phase 4 : Messages
📨 [ELEVENLABS] Message reçu: { source: 'user', message: '...' }
📨 [ELEVENLABS] Message reçu: { source: 'ai', message: '...' }

// Phase 5 : Déconnexion
❌ [ELEVENLABS] Déconnecté de ElevenLabs
✅ Conversation marquée comme terminée: conv_xxx
```

### Erreurs communes

#### 1. HTTP 405 Method Not Allowed

**Cause** : Tentative de créer un agent dynamiquement via API sans abonnement payant.

**Solution** : Utiliser l'agent de base configuré dans le dashboard avec Dynamic Variables (solution actuelle).

#### 2. Variables non remplacées

**Symptôme** : Le professeur répond de manière générique, n'utilise pas le nom de l'étudiant.

**Causes possibles** :
- System prompt dans le dashboard ne contient pas les `{{variables}}`
- Variables non injectées dans `startSession()`
- Nom de variable incorrect (case-sensitive)

**Solution** :
- Vérifier le system prompt dans le dashboard ElevenLabs
- Vérifier les logs `[DYNAMIC VARS]`
- Vérifier que les noms de variables correspondent exactement

#### 3. Microphone bloqué

**Symptôme** : Permission denied pour le microphone.

**Solution** :
- Cliquer sur l'icône 🔒 dans la barre d'adresse
- Autoriser le microphone
- Rafraîchir la page

#### 4. Pas de transcription

**Symptôme** : Vous parlez mais rien n'apparaît.

**Causes possibles** :
- WebSocket non connecté
- Microphone non actif
- Bruit ambiant trop faible

**Solution** :
- Vérifier les logs console
- Vérifier Network → WS (WebSocket)
- Parler plus fort et plus clairement

---

## 💰 Coûts ElevenLabs

### Tarification

**Compte gratuit** :
- Limité en minutes par mois
- Qualité voix standard

**Compte Starter** (~$5-11/mois) :
- Plus de minutes
- Qualité voix améliorée
- Utilisation de l'API Conversational

**Compte Professional** (~$99-330/mois) :
- Création d'agents via API (non utilisé dans cette solution)
- Minutes illimitées
- Voix personnalisées

### Facturation

Facturation basée sur :
- Durée de conversation (en minutes)
- Qualité de la voix sélectionnée
- Nombre de caractères générés

---

## 📈 Performance

### Latence

- **Connexion initiale** : ~1-2 secondes
- **Réponse vocale** : ~500ms-1s (selon la longueur)
- **Transcription** : Temps réel

### Limitations

- **Pas d'avatar visuel** : Voix uniquement
- **Dépendance réseau** : WebSocket doit rester connecté
- **Coût** : Facturation au temps de conversation

---

## 🔒 Sécurité

### API Key

```env
VITE_ELEVENLABS_API_KEY=sk_634179baf28c2e9e6b47f016522d147f7d4aaebcee2000e8
```

**⚠️ IMPORTANT** : Ne jamais commiter cette clé dans un repo public !

### Données utilisateur

Toutes les données personnelles (profil, troubles, conversations) sont stockées dans Supabase avec Row Level Security (RLS).

---

## 🎯 Résumé technique

### Ce qui fonctionne

✅ Conversation vocale bidirectionnelle
✅ Personnalisation via 5 variables dynamiques
✅ Adaptation aux troubles d'apprentissage
✅ Adaptation aux styles d'apprentissage
✅ Sauvegarde complète en DB
✅ Historique des conversations
✅ Transcription en temps réel

### Ce qui ne fonctionne pas (limitations)

❌ Création d'agents dynamiques via API (HTTP 405)
❌ Avatar visuel Écos (nécessite version Écos uniquement)
❌ Modification du system prompt par conversation (solution : Dynamic Variables)

### Technologies utilisées

- **React** + TypeScript
- **@elevenlabs/react** - SDK ElevenLabs
- **Supabase** - Base de données PostgreSQL
- **WebSocket** - Communication temps réel
- **Vite** - Build tool

---

**Date de création** : 2025-01-XX
**Auteur** : Claude Code
**Version** : 1.0 (Solution avec Dynamic Variables)
