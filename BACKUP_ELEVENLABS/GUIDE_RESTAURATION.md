# 🔄 Guide de Restauration - Solution ElevenLabs

## 📦 Contenu du backup

Ce dossier contient un **backup complet** de la solution ElevenLabs avec Dynamic Variables, créé le **{{ date }}**.

### Fichiers sauvegardés :

1. **VirtualTeacher.tsx.backup** - Page principale du professeur virtuel
2. **elevenLabsAgentService.ts** - Service pour gérer les agents ElevenLabs
3. **systemPromptGenerator.ts** - Générateur de prompts personnalisés
4. **learningStylesAnalyzer.ts** - Analyseur de styles d'apprentissage
5. **A_FAIRE_MAINTENANT.md** - Guide de configuration ElevenLabs
6. **GUIDE_DYNAMIC_VARIABLES.md** - Documentation complète des variables dynamiques
7. **SOLUTION_FINALE.md** - Vue d'ensemble de la solution
8. **ELEVENLABS_AGENT_SETUP.md** - Configuration alternative
9. **VARIABLES_DYNAMIQUES_RESUME.md** - Résumé des variables dynamiques

---

## 🎯 Fonctionnalités de cette version

### ✅ Conversation vocale avec ElevenLabs
- Voix IA professionnelle
- Transcription bidirectionnelle en temps réel
- Reconnaissance vocale automatique

### ✅ Personnalisation via Dynamic Variables
**5 variables dynamiques injectées automatiquement :**

1. **`{{username}}`** - Nom complet de l'utilisateur
2. **`{{learning_styles}}`** - Styles d'apprentissage préférés
3. **`{{troubles}}`** - Troubles d'apprentissage détectés
4. **`{{custom_message}}`** - Message personnalisé de l'utilisateur
5. **`{{user_infos}}`** - Informations scolaires (niveau, classe, matières)

### ✅ Adaptation pédagogique
- Prise en compte des troubles d'apprentissage (dyslexie, TDAH, etc.)
- Adaptation selon les styles d'apprentissage (Visuel, Auditif, etc.)
- Personnalisation selon le niveau scolaire

### ✅ Sauvegarde complète
- Conversations enregistrées en base de données
- Historique des messages
- Configuration de l'agent sauvegardée

---

## 🔧 Comment restaurer cette solution

### Étape 1 : Restaurer les fichiers

```bash
# Depuis la racine du projet

# 1. Restaurer VirtualTeacher.tsx
cp BACKUP_ELEVENLABS/VirtualTeacher.tsx.backup src/pages/VirtualTeacher.tsx

# 2. S'assurer que les services sont présents (normalement déjà là)
# Si besoin, restaurer :
cp BACKUP_ELEVENLABS/elevenLabsAgentService.ts src/services/
cp BACKUP_ELEVENLABS/systemPromptGenerator.ts src/services/
cp BACKUP_ELEVENLABS/learningStylesAnalyzer.ts src/services/

# 3. Rebuild
npm run build:dev
```

### Étape 2 : Vérifier les dépendances

Assurez-vous que ces packages sont installés :

```json
{
  "@elevenlabs/react": "^0.x.x"
}
```

Si manquant :
```bash
npm install @elevenlabs/react
```

### Étape 3 : Vérifier les variables d'environnement

Dans `.env.local`, vérifier que vous avez :

```env
VITE_ELEVENLABS_API_KEY=sk_634179baf28c2e9e6b47f016522d147f7d4aaebcee2000e8
```

### Étape 4 : Configurer l'agent ElevenLabs

**⚠️ CRITIQUE** : Pour que la personnalisation fonctionne, vous devez configurer l'agent dans le dashboard ElevenLabs.

1. **Aller sur** : https://elevenlabs.io/app/conversational-ai
2. **Ouvrir votre agent** : `agent_5901k7s57ptne94thf6jaf9ngqas`
3. **Copier le System Prompt** depuis `A_FAIRE_MAINTENANT.md` (voir section "ÉTAPE 2")
4. **Copier le First Message** depuis `A_FAIRE_MAINTENANT.md` (voir section "ÉTAPE 3")
5. **Sauvegarder** l'agent

**System Prompt (rappel) :**

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

**First Message (rappel) :**

```
Bonjour {{username}} ! Je suis ravi de t'accompagner aujourd'hui. Comment puis-je t'aider ?
```

### Étape 5 : Tester

```bash
npm run dev
```

Ouvrir : http://localhost:8080/professeur-virtuel

**Vérifier dans les logs (F12) :**

```
📊 Styles d'apprentissage: [...]
🏥 Troubles: ...
👤 Infos utilisateur: ...
🔧 [DYNAMIC VARS] Variables injectées: ['username', 'learning_styles', 'troubles', 'custom_message', 'user_infos']
📋 username: ...
🎨 learning_styles: ...
🏥 troubles: ...
💬 custom_message: ...
👤 user_infos: ...
✅ Session ElevenLabs démarrée
```

---

## 📊 Architecture technique

### Flux de données

```
1. Utilisateur clique "Démarrer la conversation"
                ↓
2. VirtualTeacher.tsx récupère :
   - Profil (profiles)
   - Styles d'apprentissage (styles_apprentissage)
   - Troubles (troubles_detection_scores)
   - Message personnalisé (interface)
                ↓
3. Génération des variables dynamiques :
   {
     username: "Marie Dupont",
     learning_styles: "Visuel, Auditif",
     troubles: "TDAH (Modéré)",
     custom_message: "Aide-moi avec les maths",
     user_infos: "Niveau: Lycée\nClasse: Seconde..."
   }
                ↓
4. Appel à getElevenLabsSignedUrl(agent_id)
   → Récupère signed URL pour WebSocket
                ↓
5. conversation.startSession({
     signedUrl,
     dynamicVariables ← INJECTION ICI
   })
                ↓
6. ElevenLabs reçoit les variables
   → Remplace {{username}}, {{learning_styles}}, etc.
   → Crée le prompt personnalisé final
                ↓
7. Agent ElevenLabs répond de manière personnalisée
```

### Base de données

**Tables utilisées :**

- `profiles` → education_level, classes, subjects, full_name
- `styles_apprentissage` → Scores pour 8 styles
- `troubles_detection_scores` → Scores pour 10 troubles
- `ai_teacher_conversations` → Conversations sauvegardées
- `ai_teacher_messages` → Messages de la conversation

---

## 💡 Pourquoi cette solution ?

### Avantages de ElevenLabs avec Dynamic Variables

✅ **Fonctionne avec compte gratuit/starter**
- Pas besoin d'abonnement Professional/Enterprise
- Pas de création d'agents dynamiques via API (bloqué en HTTP 405)

✅ **Personnalisation complète**
- Chaque conversation a son contexte unique
- 5 variables dynamiques injectées automatiquement

✅ **Performance**
- Pas de délai de création d'agent
- Session démarre immédiatement

✅ **Maintenance**
- Un seul agent à gérer dans le dashboard
- Modifications du prompt dans le dashboard uniquement

### Inconvénients

❌ **Coût élevé**
- ElevenLabs devient cher avec l'utilisation
- Facturation au temps de conversation

❌ **Pas d'avatar visuel**
- Voix uniquement, pas de synchronisation labiale
- Pas d'avatar 3D

❌ **Limitation API**
- Impossible de créer des agents dynamiques sans abonnement payant
- Dépendance à la configuration manuelle du dashboard

---

## 🔄 Différences avec la solution Écos

| Critère | ElevenLabs | Écos |
|---------|------------|------|
| **Voix IA** | ✅ Excellente qualité | ✅ Bonne qualité |
| **Avatar visuel** | ❌ Non | ✅ Oui, synchronisé |
| **Coût** | 💰💰💰 Élevé | 💰 Modéré |
| **Configuration** | Dashboard manuel | API automatique |
| **Personnalisation** | Via Dynamic Variables | Via API |
| **Latence** | Très faible | Faible |
| **Expérience utilisateur** | Voix uniquement | Voix + Visuel |

---

## 📞 Support

Si vous rencontrez des problèmes lors de la restauration :

1. **Vérifier les logs console** (F12) pour voir les erreurs
2. **Consulter** `GUIDE_DYNAMIC_VARIABLES.md` pour la documentation complète
3. **Vérifier** que l'agent ElevenLabs est bien configuré dans le dashboard
4. **Tester** l'agent manuellement dans le dashboard ElevenLabs

---

## 📁 Structure du backup

```
BACKUP_ELEVENLABS/
├── GUIDE_RESTAURATION.md (ce fichier)
├── VirtualTeacher.tsx.backup
├── elevenLabsAgentService.ts
├── systemPromptGenerator.ts
├── learningStylesAnalyzer.ts
├── A_FAIRE_MAINTENANT.md
├── GUIDE_DYNAMIC_VARIABLES.md
├── SOLUTION_FINALE.md
├── ELEVENLABS_AGENT_SETUP.md
└── VARIABLES_DYNAMIQUES_RESUME.md
```

---

## ⚠️ Important

- **Ne pas supprimer ce dossier** - C'est votre seul moyen de revenir à ElevenLabs
- **Vérifier la date du backup** - Ce backup a été créé avec la dernière version fonctionnelle
- **Tester avant de déployer** - Toujours tester en local après restauration

---

**Date du backup** : {{ DATE }}
**Version de l'application** : Compatible avec la structure actuelle
**Agent ElevenLabs ID** : `agent_5901k7s57ptne94thf6jaf9ngqas`
**API Key** : `sk_634179baf28c2e9e6b47f016522d147f7d4aaebcee2000e8`

---

Bon retour à ElevenLabs si vous changez d'avis ! 🎉
