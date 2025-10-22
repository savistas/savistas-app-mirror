# 🎯 Guide Complet - Dynamic Variables ElevenLabs

## ✅ **Solution Finale Implémentée**

Votre système utilise maintenant les **Dynamic Variables** d'ElevenLabs pour personnaliser les conversations sans abonnement payant.

### **Architecture :**

```
1. Agent ElevenLabs (dashboard)
   ↓ System Prompt avec {{custom_context}}
   ↓ First Message avec {{user_name}} et {{first_message_context}}

2. Code TypeScript génère le contexte personnalisé
   ↓ Analyse profil utilisateur
   ↓ Génère prompt selon type de conversation

3. startSession() injecte les variables
   ↓ custom_context = prompt personnalisé complet
   ↓ user_name = nom de l'étudiant
   ↓ first_message_context = message d'accueil personnalisé

4. Agent utilise le contexte personnalisé ✅
```

---

## 📝 **ÉTAPE 1 : Configurer l'agent dans ElevenLabs**

### **1.1 Accéder au dashboard**

Aller sur : https://elevenlabs.io/app/conversational-ai

### **1.2 Créer un nouvel agent**

Cliquer sur **"Create Agent"** ou **"New Agent"**

### **1.3 Configuration de base**

#### **Name (Nom)**
```
Savistas Virtual Teacher
```

#### **Description**
```
Professeur virtuel personnalisé pour la plateforme Savistas AI-Cademy
```

---

### **1.4 System Prompt pour Agent "Général" (COPIER EXACTEMENT) ⭐**

```
Tu es un professeur virtuel bienveillant et pédagogue sur la plateforme Savistas AI-Cademy.
Ta mission est d'accompagner l'apprenant dans son parcours d'apprentissage de manière personnalisée.

## 👤 Profil de l'apprenant

**Nom**: {{username}}

**Informations scolaires**:
{{user_infos}}

**Styles d'apprentissage**: {{learning_styles}}
Adapte ta pédagogie en fonction de ces styles pour maximiser la compréhension.

**Troubles détectés**: {{troubles}}
Sois attentif à ces troubles et adapte ton approche pédagogique en conséquence. Si un trouble est présent, utilise des stratégies adaptées (ex: pour la dyslexie, privilégie les explications orales et les exemples concrets ; pour le TDAH, structure tes réponses en points courts).

**Instructions de l'apprenant**:
{{custom_message}}

## 🎯 Directives générales

- Sois patient, encourageant et positif
- Adapte ton vocabulaire au niveau de l'apprenant
- Fournis des explications progressives et structurées
- Vérifie régulièrement la compréhension
- Encourage la curiosité et la réflexion
- Tiens compte des troubles détectés dans ta manière d'enseigner

## 📝 Style de conversation

- Réponds de manière concise (3-7 phrases maximum)
- Utilise des exemples concrets quand nécessaire
- Pose des questions pour vérifier la compréhension
- Célèbre les réussites et encourage en cas de difficulté
- Adapte-toi aux styles d'apprentissage et aux éventuels troubles

## 🚫 Limitations

- Reste dans le cadre du sujet abordé
- Si tu ne connais pas la réponse, dis-le honnêtement
- Ne donne pas directement les réponses aux exercices, guide plutôt la réflexion
```

**⚠️ IMPORTANT :** Ce system prompt utilise 5 variables dynamiques injectées automatiquement :
- `{{username}}` - Nom complet de l'utilisateur
- `{{user_infos}}` - Niveau d'éducation, classe, matières
- `{{learning_styles}}` - Styles d'apprentissage préférés
- `{{troubles}}` - Troubles d'apprentissage détectés
- `{{custom_message}}` - Message personnalisé de l'utilisateur

---

### **1.5 First Message (COPIER EXACTEMENT) ⭐**

```
Bonjour {{username}} ! Je suis ravi de t'accompagner aujourd'hui. Comment puis-je t'aider ?
```

**Variable utilisée :**
- `{{username}}` : Nom complet de l'étudiant (ou nom d'utilisateur si non renseigné)

---

### **1.6 Configuration avancée**

#### **Language**
```
French (fr)
```

#### **Voice**
Choisir une voix française, par exemple :
- **Charlotte** (voix féminine, claire)
- **Bella** (voix féminine, chaleureuse)
- **Adam** (voix masculine, professionnelle)

Vous pouvez tester les voix dans le playground.

#### **LLM (Model)**
```
GPT-4
```

#### **Temperature**
```
0.7
```
(Équilibre entre créativité et cohérence)

#### **Max Tokens**
```
500
```
(Pour des réponses concises)

---

### **1.7 Sauvegarder et copier l'Agent ID**

1. Cliquer sur **"Save"** ou **"Create Agent"**
2. **Copier l'Agent ID** généré (ex: `agent_5901k7s57ptne94thf6jaf9ngqas`)
3. Cet ID est celui qui est **déjà dans votre code** (`ELEVENLABS_AGENT_ID`)

---

## 🔧 **ÉTAPE 2 : Variables Dynamiques Disponibles**

Votre code injecte automatiquement ces variables pour l'agent "Général" :

| Variable | Type | Description | Exemple |
|----------|------|-------------|---------|
| `username` | String | Nom complet de l'utilisateur | "Marie Dupont" ou "marie.dupont" |
| `learning_styles` | String | Styles d'apprentissage préférés | "Visuel, Auditif, Kinesthésique" |
| `troubles` | String | Troubles d'apprentissage détectés | "TDAH (niveau: Modéré), Dyslexie (niveau: Élevé)" ou "Aucun trouble détecté" |
| `custom_message` | String | Message personnalisé de l'utilisateur | "Explique-moi comme si j'avais 10 ans" ou "Aucune instruction supplémentaire" |
| `user_infos` | String (multiline) | Informations scolaires | "Niveau d'éducation: Lycée\nClasse: Terminale S\nMatières: Mathématiques, Physique" |

---

## 📊 **ÉTAPE 3 : Exemple de conversation générale**

### **Variables injectées pour l'utilisateur "Marie Dupont" :**

**`username`** : `Marie Dupont`

**`learning_styles`** : `Visuel, Auditif, Kinesthésique`

**`troubles`** : `TDAH (niveau: Modéré), Dyslexie (niveau: Élevé)`

**`custom_message`** : `J'ai besoin d'aide avec les mathématiques, surtout les équations`

**`user_infos`** :
```
Niveau d'éducation: Lycée
Classe: Seconde
Matières: Mathématiques, Physique-Chimie, SVT
```

### **Résultat Final (ce que l'agent voit) :**

```
Tu es un professeur virtuel bienveillant et pédagogue sur la plateforme Savistas AI-Cademy.
Ta mission est d'accompagner l'apprenant dans son parcours d'apprentissage de manière personnalisée.

## 👤 Profil de l'apprenant

**Nom**: Marie Dupont

**Informations scolaires**:
Niveau d'éducation: Lycée
Classe: Seconde
Matières: Mathématiques, Physique-Chimie, SVT

**Styles d'apprentissage**: Visuel, Auditif, Kinesthésique
Adapte ta pédagogie en fonction de ces styles pour maximiser la compréhension.

**Troubles détectés**: TDAH (niveau: Modéré), Dyslexie (niveau: Élevé)
Sois attentif à ces troubles et adapte ton approche pédagogique en conséquence...

**Instructions de l'apprenant**:
J'ai besoin d'aide avec les mathématiques, surtout les équations

## 🎯 Directives générales
...
```

**First Message :**
```
Bonjour Marie Dupont ! Je suis ravi de t'accompagner aujourd'hui. Comment puis-je t'aider ?
```


---

## 🧪 **ÉTAPE 4 : Tester les Dynamic Variables**

### **4.1 Dans le dashboard ElevenLabs**

Allez dans l'onglet **"Test"** ou **"Playground"** de votre agent.

En bas, vous verrez une section **"Dynamic Variables"** ou **"Test Variables"**.

Ajoutez des valeurs de test :

```
user_name: Angelo
custom_context: Tu es un professeur qui explique les mathématiques de manière simple.
first_message_context: Prêt pour ta leçon de maths ?
```

Cliquez sur **"Start Conversation"** et testez !

---

### **4.2 Dans votre application**

```bash
npm run dev
```

1. Ouvrir http://localhost:8080/professeur-virtuel
2. Sélectionner un type de conversation
3. Cliquer "Démarrer la conversation"
4. **Vérifier les logs console** (F12) :

```
📊 Styles d'apprentissage: ['Linguistique', 'Visuel']
📝 Prompt généré: 450 caractères
✅ Utilisation agent ElevenLabs de base: agent_xxx
🔧 [DYNAMIC VARS] Variables injectées: ['user_name', 'custom_context', 'first_message_context', 'conversation_type', 'learning_styles']
✅ Session ElevenLabs démarrée
```

5. **Parler** et vérifier que le professeur répond de manière personnalisée !

---

## 🔍 **ÉTAPE 5 : Vérification et Debugging**

### **Vérifier que les variables sont bien injectées**

Dans la console (F12), chercher :
```
🔧 [DYNAMIC VARS] Variables injectées: [...]
```

### **Tester différents types de conversation**

1. **Général** → Doit utiliser un prompt générique
2. **Cours** → Doit mentionner le nom du cours
3. **Exercice** → Doit guider sans donner la réponse
4. **Erreur** → Doit être bienveillant dans la correction

### **Vérifier la base de données**

```sql
SELECT
  id,
  conversation_type,
  agent_config->>'system_prompt' as custom_prompt,
  created_at
FROM ai_teacher_conversations
ORDER BY created_at DESC
LIMIT 3;
```

Le prompt personnalisé est sauvegardé en DB pour référence.

---

## 💡 **Avantages de cette solution**

### ✅ **Sans abonnement payant**
- Utilise l'API gratuite/starter d'ElevenLabs
- Pas besoin de créer des agents dynamiques

### ✅ **Personnalisation complète**
- Chaque conversation a son propre contexte
- Adaptation aux styles d'apprentissage
- Messages personnalisés par type

### ✅ **Maintenance facile**
- Un seul agent à gérer dans le dashboard
- Modifications du prompt dans le code uniquement
- Pas de nettoyage d'agents obsolètes

### ✅ **Performance**
- Pas de délai de création d'agent
- Session démarre immédiatement
- Moins de requêtes API

---

## 🚀 **Améliorations Futures**

### **1. Variables système ElevenLabs**

Vous pouvez aussi utiliser les variables système automatiques :

```
{{system__conversation_id}} - ID unique de la conversation
{{system__time}} - Heure actuelle
{{system__call_duration_secs}} - Durée de l'appel
```

Exemple dans le system prompt :
```
Conversation ID: {{system__conversation_id}}
Heure de début: {{system__time}}
```

### **2. Variables pour les outils (Tools)**

Si vous ajoutez des outils (appels API), vous pouvez :
- Créer des variables depuis les réponses API
- Les utiliser dans les prompts ultérieurs

### **3. Tracking utilisateur**

Ajouter des variables pour le suivi :
```typescript
const dynamicVariables = {
  user_id: user.id,
  user_level: profileData.level,
  session_count: conversationCount,
  ...
};
```

---

## ❓ **FAQ**

### **Q: Les variables ne sont pas remplacées ?**

**R:** Vérifier que :
- Le nom de la variable est exact (case-sensitive)
- Utilisation de double accolades `{{variable}}`
- Variable incluse dans `dynamicVariables` lors du `startSession()`

### **Q: Le prompt est trop long ?**

**R:** Les dynamic variables n'ont pas de limite stricte (contrairement à la création d'agents). Mais restez raisonnable (~5000 chars max).

### **Q: Comment tester sans parler ?**

**R:** Utilisez l'onglet "Test" dans le dashboard ElevenLabs avec des valeurs de test.

### **Q: Les styles d'apprentissage ne s'appliquent pas ?**

**R:** Vérifier dans les logs que `custom_context` contient bien les directives. Le LLM doit interpréter le contexte correctement.

---

## 📞 **Support**

Si vous rencontrez des problèmes :

1. **Vérifier les logs console** (F12)
2. **Tester l'agent dans le dashboard** avec des valeurs manuelles
3. **Vérifier que l'Agent ID est correct** dans le code
4. **Consulter la doc ElevenLabs** : https://elevenlabs.io/docs/conversational-ai/customization/dynamic-variables

---

## 🎉 **Conclusion**

Vous avez maintenant un **professeur virtuel entièrement personnalisé** sans abonnement payant !

**Ce qui fonctionne :**
- ✅ Conversation vocale IA
- ✅ Transcription bidirectionnelle
- ✅ Personnalisation selon profil d'apprentissage
- ✅ Adaptation selon type de conversation (cours/exercice/erreur)
- ✅ Messages d'accueil personnalisés
- ✅ Sauvegarde complète en base de données

**Prochaine étape :**
Configurer votre agent dans le dashboard ElevenLabs avec le system prompt fourni ! 🚀
