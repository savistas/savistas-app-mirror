# Débogage du Professeur Virtuel 🔍

## Problème 1: La conversation démarre puis s'arrête instantanément

### Toutes les possibilités identifiées :

#### 🔴 Possibilités liées aux Overrides

1. **Structure des overrides incorrecte**
   - L'API ElevenLabs peut avoir une structure différente de celle documentée
   - Les overrides ne sont peut-être pas supportés avec `signedUrl`
   - Format JSON invalide ou champs manquants

2. **System prompt trop long**
   - Limite API potentielle (tester avec prompt < 5000 caractères)
   - Le prompt généré peut faire 3000-5000 caractères avec contexte complet

3. **Caractères invalides**
   - Quotes non échappées dans le prompt
   - Newlines (`\n`) mal gérés
   - Caractères spéciaux qui cassent le JSON
   - Emojis dans le prompt

4. **Compatibilité SDK**
   - Version du SDK `@elevenlabs/react` pas à jour
   - Documentation obsolète vs API réelle
   - Différence entre Web SDK et React SDK

#### 🟡 Possibilités liées à l'Agent

5. **Configuration de l'agent de base**
   - L'agent `agent_5901k7s57ptne94thf6jaf9ngqas` peut refuser les overrides
   - Permissions manquantes sur l'agent
   - Agent configuré pour bloquer les modifications dynamiques

6. **Type d'agent incompatible**
   - Certains agents ElevenLabs ne supportent peut-être pas les overrides
   - Besoin d'un agent spécifique "customizable"

#### 🟢 Possibilités liées aux Erreurs

7. **Erreur silencieuse**
   - `onError` pas déclenché ou erreur non catchée
   - `onDisconnect` appelé immédiatement après `onConnect`
   - Promise rejetée sans catch

8. **Validation API côté ElevenLabs**
   - Validation stricte des champs
   - Format de langue invalide (`'fr'` vs `'fr-FR'`)
   - Champs requis manquants

#### 🔵 Possibilités liées au Réseau/API

9. **Problème de signed URL**
   - Signed URL expirée
   - Permissions insuffisantes
   - Rate limiting API

10. **Timeout ou déconnexion réseau**
    - WebSocket qui se ferme immédiatement
    - Firewall qui bloque la connexion
    - CORS issues

#### 🟣 Possibilités liées au Code

11. **Race condition**
    - État React non synchronisé
    - `conversationIdRef` pas encore set
    - Multiple appels simultanés

12. **Effet de bord inattendu**
    - `useEffect` qui interfère
    - Re-render qui cause une déconnexion
    - Memory leak

## Problème 2: Table `ai_teacher_agent_configs` jamais modifiée

### Analyse :

Cette table a été créée pour **cacher les agents créés dynamiquement**. Elle devait stocker :
- `elevenlabs_agent_id` : L'ID de l'agent créé
- `system_prompt` : Le prompt utilisé
- `learning_style` : Les styles de l'utilisateur
- `troubles_context` : Contexte des troubles

**Pourquoi elle est vide ?**

1. **On ne crée plus d'agents dynamiques**
   - On utilise maintenant l'agent de base avec overrides
   - Donc pas d'agent_id à stocker

2. **Approche actuelle différente**
   - Les prompts sont stockés dans `ai_teacher_conversations.agent_config`
   - Pas besoin de cache car on régénère à chaque fois

### Solutions possibles :

#### Option A : Supprimer la table
```sql
DROP TABLE ai_teacher_agent_configs CASCADE;
```
✅ Plus simple, table inutilisée

#### Option B : Réutiliser la table différemment
Stocker les configurations réutilisables par utilisateur :
```typescript
// Après génération du prompt, le sauvegarder
await supabase.from('ai_teacher_agent_configs').upsert({
  user_id: user.id,
  learning_style: learningStyles.top3.map(s => s.name).join(','),
  troubles_context: {}, // Troubles si détectés
  system_prompt: agentConfig.systemPrompt,
  last_used_at: new Date().toISOString(),
});
```

#### Option C : Créer des agents réutilisables
Si on revient au système de création d'agents :
- Créer 1 agent par utilisateur (pas par conversation)
- Le réutiliser pour toutes les conversations
- Mettre à jour l'agent quand le profil change

## Solutions de débogage implémentées

### 1. Logging détaillé
```typescript
console.log('🔧 [DEBUG] System prompt length:', agentConfig.systemPrompt.length);
console.log('✅ [ELEVENLABS] Connecté');
console.log('❌ [ELEVENLABS] Erreur détaillée:', JSON.stringify(error, null, 2));
```

### 2. Système de fallback
```typescript
try {
  // Essayer avec overrides
  await conversation.startSession({ signedUrl, overrides });
} catch {
  // Fallback sans overrides
  await conversation.startSession({ signedUrl });
}
```

### 3. Vérifications préventives
- Vérifier longueur du prompt
- Logger tous les événements
- Catcher toutes les erreurs

## Tests à faire

### Test 1: Sans overrides (baseline)
```typescript
await conversation.startSession({ signedUrl });
```
✅ Si ça marche → Le problème est les overrides

### Test 2: Avec overrides minimalistes
```typescript
overrides: {
  agent: {
    firstMessage: "Bonjour test"
  }
}
```
✅ Si ça marche → Le system prompt est trop long ou invalide

### Test 3: Avec prompt court
```typescript
overrides: {
  agent: {
    prompt: {
      prompt: "Tu es un professeur."
    }
  }
}
```
✅ Si ça marche → Le prompt généré a un problème

### Test 4: Vérifier les logs console
Ouvrir la console navigateur et chercher :
- `[ELEVENLABS]` pour voir tous les événements
- `[DEBUG]` pour les infos de débogage
- Erreurs non catchées

### Test 5: Vérifier l'API ElevenLabs
```bash
# Tester l'API directement
curl -X GET \
  "https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=agent_5901k7s57ptne94thf6jaf9ngqas" \
  -H "xi-api-key: sk_634179baf28c2e9e6b47f016522d147f7d4aaebcee2000e8"
```

## Recommandations

1. **Immédiatement** : Tester et regarder les logs console
2. **Si ça échoue** : Le fallback sans overrides devrait marcher
3. **Contacter ElevenLabs** : Demander la bonne structure pour overrides
4. **Alternative** : Revenir au système de création d'agents si overrides impossibles

## Documentation officielle à vérifier

- [ ] React SDK docs: https://elevenlabs.io/docs/agents-platform/libraries/react
- [ ] Conversational AI API: https://elevenlabs.io/docs/conversational-ai/
- [ ] Overrides documentation (si disponible)
- [ ] GitHub issues du SDK: https://github.com/elevenlabs/packages

## Hypothèse la plus probable

**Les overrides ne fonctionnent pas avec signed URL.**

Raison : La signed URL contient déjà toute la configuration de l'agent, et l'API peut refuser de la modifier.

**Solution alternative** : Créer des agents temporaires avec le bon prompt, ou utiliser les Dynamic Variables au lieu des overrides.
