# 📊 Résumé - Variables Dynamiques Agent "Général"

## ✅ Ce qui a été implémenté

Votre professeur virtuel dispose maintenant de **5 variables dynamiques** pour personnaliser chaque conversation.

---

## 🔧 Variables Dynamiques Disponibles

### 1. **`{{username}}`** - Nom de l'utilisateur
- **Source** : Table `profiles.full_name` ou `user.email` (avant le @)
- **Exemple** : `"Marie Dupont"` ou `"marie.dupont"`
- **Utilisation** : Personnalise le message d'accueil et crée une relation plus humaine

### 2. **`{{learning_styles}}`** - Styles d'apprentissage
- **Source** : Table `styles_apprentissage` → Analyse des 3 styles dominants
- **Exemple** : `"Visuel, Auditif, Kinesthésique"`
- **Utilisation** : Adapte la pédagogie selon les préférences d'apprentissage

### 3. **`{{troubles}}`** - Troubles d'apprentissage détectés
- **Source** : Table `troubles_detection_scores` → Agrégation de tous les troubles != "Faible"
- **Exemple** :
  - `"TDAH (niveau: Modéré), Dyslexie (niveau: Élevé)"`
  - `"Aucun trouble détecté"`
  - `"Diagnostic médical: Dyslexie confirmée par médecin"`
- **Utilisation** : Adapte l'approche pédagogique aux besoins spécifiques

**Troubles détectés :**
- TDAH
- Dyslexie
- Dyscalculie
- Dyspraxie
- TSA (Autisme)
- Trouble du langage
- TDI
- Tics/Tourette
- Bégaiement
- Trouble sensoriel isolé

### 4. **`{{custom_message}}`** - Message personnalisé de l'utilisateur
- **Source** : Champ "Instructions supplémentaires" dans l'interface
- **Exemple** :
  - `"Explique-moi comme si j'avais 10 ans"`
  - `"J'ai besoin d'aide avec les équations"`
  - `"Aucune instruction supplémentaire"` (si vide)
- **Utilisation** : Permet à l'utilisateur de guider le professeur avant même de parler

### 5. **`{{user_infos}}`** - Informations scolaires
- **Source** : Table `profiles` (education_level, classes, subjects)
- **Format** :
  ```
  Niveau d'éducation: Lycée
  Classe: Seconde
  Matières: Mathématiques, Physique-Chimie, SVT
  ```
- **Utilisation** : Adapte le vocabulaire et les exemples au niveau de l'élève

---

## 📝 System Prompt à copier dans ElevenLabs

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

---

## 💬 First Message à copier dans ElevenLabs

```
Bonjour {{username}} ! Je suis ravi de t'accompagner aujourd'hui. Comment puis-je t'aider ?
```

---

## 🧪 Comment tester

### 1. **Configurer l'agent ElevenLabs**
1. Aller sur : https://elevenlabs.io/app/conversational-ai
2. Ouvrir votre agent : `agent_5901k7s57ptne94thf6jaf9ngqas`
3. Copier-coller le **System Prompt** ci-dessus
4. Copier-coller le **First Message** ci-dessus
5. **Sauvegarder**

### 2. **Lancer l'application**
```bash
npm run dev
```

### 3. **Tester la conversation**
1. Ouvrir http://localhost:8080/professeur-virtuel
2. Sélectionner "Conversation générale"
3. **(Optionnel)** Écrire un message personnalisé dans "Instructions supplémentaires"
   - Exemple : `"J'ai besoin d'aide avec les mathématiques, surtout les fractions"`
4. Cliquer "Démarrer la conversation"
5. Autoriser le microphone
6. **Parler** et observer !

### 4. **Vérifier les logs (F12)**

Ouvrir la console et vérifier que vous voyez :

```
📊 Styles d'apprentissage: ['Visuel', 'Auditif']
🏥 Troubles: Aucun trouble détecté
👤 Infos utilisateur: Niveau d'éducation: Lycée...
🔧 [DYNAMIC VARS] Variables injectées: ['username', 'learning_styles', 'troubles', 'custom_message', 'user_infos']
📋 username: Marie Dupont
🎨 learning_styles: Visuel, Auditif
🏥 troubles: Aucun trouble détecté
💬 custom_message: J'ai besoin d'aide avec les mathématiques
👤 user_infos: Niveau d'éducation: Lycée...
✅ Session ElevenLabs démarrée
```

---

## 🎯 Exemples de personnalisation

### Exemple 1 : Étudiant sans trouble

**Profil** :
- Nom : Jean Martin
- Niveau : Collège, 4ème
- Matières : Mathématiques, Français
- Styles : Logique, Linguistique
- Troubles : Aucun
- Message : "J'ai besoin d'aide pour les équations"

**Ce que voit l'agent** :
```
Nom: Jean Martin
Informations scolaires:
Niveau d'éducation: Collège
Classe: 4ème
Matières: Mathématiques, Français

Styles d'apprentissage: Logique, Linguistique
Troubles détectés: Aucun trouble détecté
Instructions de l'apprenant: J'ai besoin d'aide pour les équations
```

**Adaptation du professeur** :
- Utilise un vocabulaire niveau collège
- Approche logique et structurée
- Focus sur les équations

---

### Exemple 2 : Étudiant avec dyslexie

**Profil** :
- Nom : Sophie Dubois
- Niveau : Lycée, Seconde
- Matières : SVT, Physique
- Styles : Visuel, Kinesthésique
- Troubles : Dyslexie (Élevé), TDAH (Modéré)
- Message : "Aucune instruction supplémentaire"

**Ce que voit l'agent** :
```
Nom: Sophie Dubois
Informations scolaires:
Niveau d'éducation: Lycée
Classe: Seconde
Matières: SVT, Physique

Styles d'apprentissage: Visuel, Kinesthésique
Troubles détectés: Dyslexie (niveau: Élevé), TDAH (niveau: Modéré)
Instructions de l'apprenant: Aucune instruction supplémentaire
```

**Adaptation du professeur** :
- Privilégie les explications orales
- Utilise des schémas et diagrammes (Visuel)
- Propose des activités pratiques (Kinesthésique)
- Structure les réponses en points courts (TDAH)
- Évite les longs textes (Dyslexie)

---

## 💡 Avantages de cette solution

✅ **Personnalisation complète** : Chaque conversation est unique et adaptée au profil de l'élève

✅ **Gratuit** : Fonctionne avec l'API gratuite/starter d'ElevenLabs

✅ **Adaptatif** : Prend en compte les troubles d'apprentissage automatiquement

✅ **Flexible** : L'utilisateur peut ajouter des instructions supplémentaires

✅ **Sauvegardé** : Toutes les conversations sont enregistrées en base de données

---

## 🔍 Vérification Base de Données

Pour voir les variables injectées dans une conversation :

```sql
SELECT
  id,
  conversation_type,
  agent_config->>'learning_styles' as styles,
  agent_config->>'system_prompt' as prompt,
  created_at
FROM ai_teacher_conversations
ORDER BY created_at DESC
LIMIT 1;
```

---

## 📚 Documentation Complète

- **`A_FAIRE_MAINTENANT.md`** : Guide pas-à-pas pour configurer l'agent ElevenLabs
- **`GUIDE_DYNAMIC_VARIABLES.md`** : Guide technique complet
- **`SOLUTION_FINALE.md`** : Vue d'ensemble de l'architecture

---

## 🚀 Prochaines améliorations possibles

1. **Historique de conversations** : Utiliser les conversations passées pour affiner le contexte
2. **Niveau de difficulté adaptatif** : Ajuster selon les résultats aux quizzes
3. **Émotions** : Détecter l'état émotionnel via la voix et adapter l'approche
4. **Multi-langues** : Supporter plusieurs langues selon le profil

---

Besoin d'aide ? Consultez `A_FAIRE_MAINTENANT.md` ! 🎓
