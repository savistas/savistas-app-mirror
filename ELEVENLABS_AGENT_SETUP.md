# Configuration Alternative - ElevenLabs Agents

## ⚠️ Si la création dynamique d'agents ne fonctionne pas

L'API publique ElevenLabs peut ne pas supporter la création d'agents conversationnels via code. Dans ce cas, voici deux solutions alternatives:

---

## Solution 1: Agent de base avec Dynamic Variables (RECOMMANDÉ)

### Étape 1: Créer un agent via le dashboard

1. Aller sur https://elevenlabs.io/app/conversational-ai
2. Créer un nouvel agent
3. Configurer:
   - **Name**: "Savistas Virtual Teacher"
   - **System Prompt**: Laisser vide ou mettre un prompt générique
   - **First Message**: "Bonjour ! Je suis votre professeur virtuel."
   - **Voice**: Sélectionner une voix française
   - **LLM**: GPT-4

4. Copier l'**Agent ID** généré

### Étape 2: Ajouter l'Agent ID dans .env.local

```env
VITE_ELEVENLABS_AGENT_ID=agent_YOUR_ID_HERE
```

### Étape 3: Utiliser cet agent avec overrides

Modifier `startConversation()` dans VirtualTeacher.tsx pour utiliser l'agent de base avec le prompt personnalisé en dynamic variable:

```typescript
// Au lieu de créer un nouvel agent, utiliser l'agent de base
const signedUrl = await getElevenLabsSignedUrl(ELEVENLABS_AGENT_ID);

// Passer le prompt personnalisé via overrides (si supporté)
await conversation.startSession({
  signedUrl,
  clientTools: {
    custom_instructions: agentConfig.systemPrompt
  }
});
```

---

## Solution 2: Créer plusieurs agents manuellement

### Créer 4 agents via le dashboard:

1. **Agent "Général"** - Pour conversations générales
   - ID: `agent_general_xxx`
   - System Prompt: Prompt générique bienveillant

2. **Agent "Cours"** - Pour étude de cours
   - ID: `agent_course_xxx`
   - System Prompt: "Tu es un professeur qui explique des cours..."

3. **Agent "Exercice"** - Pour résolution d'exercices
   - ID: `agent_exercise_xxx`
   - System Prompt: "Tu es un professeur qui guide pour les exercices..."

4. **Agent "Erreur"** - Pour analyse d'erreurs
   - ID: `agent_error_xxx`
   - System Prompt: "Tu es un professeur qui aide à corriger les erreurs..."

### Configuration dans le code:

```typescript
// Dans VirtualTeacher.tsx

const AGENT_IDS = {
  general: 'agent_general_xxx',
  course: 'agent_course_xxx',
  exercise: 'agent_exercise_xxx',
  error: 'agent_error_xxx'
};

// Dans startConversation():
const agentId = AGENT_IDS[conversationType];
const signedUrl = await getElevenLabsSignedUrl(agentId);
```

---

## Solution 3: Vérifier les permissions de l'API Key

Il est possible que votre clé API n'ait pas les permissions pour créer des agents.

### Vérifier:
1. Aller sur https://elevenlabs.io/app/settings/api-keys
2. Vérifier les permissions de la clé `sk_634179baf28c2e9e6b47f016522d147f7d4aaebcee2000e8`
3. S'assurer que "Conversational AI" est activé

### Si nécessaire:
Créer une nouvelle clé avec toutes les permissions nécessaires.

---

## Test rapide: Vérifier si l'API supporte la création d'agents

Exécutez ce script Node.js pour tester:

```javascript
// test-elevenlabs-api.js
const ELEVENLABS_API_KEY = 'sk_634179baf28c2e9e6b47f016522d147f7d4aaebcee2000e8';

fetch('https://api.elevenlabs.io/v1/convai/agents', {
  method: 'GET',
  headers: {
    'xi-api-key': ELEVENLABS_API_KEY
  }
})
.then(r => r.json())
.then(data => console.log('Agents existants:', data))
.catch(err => console.error('Erreur:', err));
```

Si cela retourne une liste d'agents → L'API fonctionne ✅
Si cela retourne une erreur 404 → L'endpoint n'existe pas ❌

---

## Quelle solution choisir ?

- **Solution 1** : Meilleure UX, un seul agent, mais moins de personnalisation
- **Solution 2** : Personnalisation moyenne, 4 agents à gérer manuellement
- **Solution 3** : Si le problème vient juste des permissions

**Recommandation**: Essayer Solution 3 d'abord, puis Solution 1 si nécessaire.

Une fois que vous me donnez les nouveaux logs d'erreur, je peux implémenter automatiquement la solution appropriée.
