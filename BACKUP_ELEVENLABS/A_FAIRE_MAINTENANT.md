# ✅ À FAIRE MAINTENANT

## 🎯 **Dernière étape : Configurer l'agent ElevenLabs**

Votre code est **prêt et fonctionnel** ! Il ne reste plus qu'à configurer l'agent dans le dashboard ElevenLabs.

---

## 📝 **ÉTAPE 1 : Ouvrir le dashboard ElevenLabs**

Aller sur : **https://elevenlabs.io/app/conversational-ai**

Vous devriez voir votre agent existant : **`agent_5901k7s57ptne94thf6jaf9ngqas`**

Cliquer dessus pour l'éditer.

---

## 🔧 **ÉTAPE 2 : Modifier le System Prompt**

**Supprimer** l'ancien system prompt et **COPIER-COLLER** exactement ceci :

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

**⚠️ CRITIQUE :** Ce prompt utilise **5 variables dynamiques** qui seront automatiquement injectées par votre code :
- `{{username}}` - Nom complet de l'utilisateur
- `{{user_infos}}` - Niveau d'éducation, classe, matières
- `{{learning_styles}}` - Styles d'apprentissage
- `{{troubles}}` - Troubles détectés
- `{{custom_message}}` - Message personnalisé de l'utilisateur

---

## 💬 **ÉTAPE 3 : Modifier le First Message**

**Supprimer** l'ancien first message et **COPIER-COLLER** :

```
Bonjour {{username}} ! Je suis ravi de t'accompagner aujourd'hui. Comment puis-je t'aider ?
```

**Variable utilisée :**
- `{{username}}` : Nom complet de l'étudiant (ou nom d'utilisateur si non renseigné)

---

## 💾 **ÉTAPE 4 : Sauvegarder**

Cliquer sur **"Save"** ou **"Update Agent"**

---

## 🧪 **ÉTAPE 5 : Tester !**

### **5.1 Lancer l'application**

```bash
npm run dev
```

### **5.2 Ouvrir le navigateur**

http://localhost:8080/professeur-virtuel

### **5.3 Démarrer une conversation**

1. Sélectionner "Conversation générale"
2. Cliquer "Démarrer la conversation"
3. **Autoriser le microphone** quand demandé
4. **Parler** : "Bonjour, peux-tu m'aider avec les mathématiques ?"

### **5.4 Vérifier les logs (F12)**

Ouvrir la console (F12) et chercher :

```
✅ SUCCÈS attendu :
🔧 [DYNAMIC VARS] Variables injectées: ['username', 'learning_styles', 'troubles', 'custom_message', 'user_infos']
📋 username: Marie Dupont
🎨 learning_styles: Visuel, Auditif
🏥 troubles: Aucun trouble détecté (ou liste des troubles)
💬 custom_message: Aucune instruction supplémentaire (ou message personnalisé)
👤 user_infos: Niveau d'éducation: ... Classe: ... Matières: ...
✅ Session ElevenLabs démarrée

❌ PROBLÈME si vous ne voyez pas ces logs :
  → L'agent n'utilise pas les variables dynamiques
  → Vérifier que vous avez bien sauvegardé le system prompt avec les variables {{username}}, {{learning_styles}}, etc.
```

### **5.5 Vérifier la personnalisation**

**Test 1 : Conversation générale**
- Le professeur doit vous saluer par votre nom
- Il doit adapter son style selon vos styles d'apprentissage

**Test 2 : Avec un cours**
- Sélectionner "Étude d'un cours"
- Choisir un cours existant
- Le professeur doit mentionner le nom du cours dans sa réponse

---

## 🐛 **Dépannage**

### **Problème : L'agent ne personnalise pas**

**Symptôme :** Le professeur répond de manière générique, sans mentionner votre nom ou le contexte.

**Causes possibles :**

1. **Le system prompt ne contient pas `{{custom_context}}`**
   - Solution : Vérifier dans le dashboard ElevenLabs

2. **L'agent ID est incorrect**
   - Solution : Vérifier que `ELEVENLABS_AGENT_ID` dans le code = ID de l'agent dans le dashboard

3. **Les logs ne montrent pas `[DYNAMIC VARS]`**
   - Solution : Le code n'injecte pas les variables → vérifier que le build est à jour

---

### **Problème : Erreur microphone**

**Symptôme :** "Permission denied" ou microphone bloqué

**Solution :**
1. Cliquer sur l'icône 🔒 dans la barre d'adresse
2. Autoriser le microphone
3. Rafraîchir la page

---

### **Problème : Pas de transcription**

**Symptôme :** Vous parlez mais rien n'apparaît

**Solution :**
1. Vérifier les logs console
2. Vérifier que l'onglet Network → WebSocket montre une connexion active
3. Réessayer en parlant plus fort et plus clairement

---

## 📊 **Vérifier en Base de Données**

Les conversations sont sauvegardées avec le prompt personnalisé :

```sql
SELECT
  id,
  conversation_type,
  agent_config->>'custom_context' as prompt_personnalise,
  agent_config->>'learning_styles' as styles,
  created_at
FROM ai_teacher_conversations
ORDER BY created_at DESC
LIMIT 3;
```

Vous devriez voir le prompt personnalisé dans `prompt_personnalise`.

---

## ✅ **Checklist Complète**

- [ ] Dashboard ElevenLabs ouvert
- [ ] System prompt modifié avec `{{custom_context}}`
- [ ] First message modifié avec `{{user_name}}` et `{{first_message_context}}`
- [ ] Agent sauvegardé
- [ ] Application lancée (`npm run dev`)
- [ ] Page /professeur-virtuel ouverte
- [ ] Conversation démarrée
- [ ] Logs `[DYNAMIC VARS]` visibles en console
- [ ] Microphone autorisé
- [ ] Transcription fonctionne
- [ ] Professeur répond de manière personnalisée

---

## 🎉 **Une fois que tout fonctionne**

Félicitations ! Vous avez maintenant :

✅ Un professeur virtuel **entièrement personnalisé**
✅ Qui s'adapte au **profil d'apprentissage** de chaque étudiant
✅ Qui change de **contexte** selon le type de conversation
✅ Le tout **sans abonnement payant** !

---

## 📚 **Documentation Complète**

Pour plus de détails, consultez :

- **`GUIDE_DYNAMIC_VARIABLES.md`** : Guide technique complet
- **`SOLUTION_FINALE.md`** : Vue d'ensemble de la solution
- **`ELEVENLABS_AGENT_SETUP.md`** : Solutions alternatives

---

## 🚀 **Prochaines améliorations possibles**

1. **Ajouter plus de variables** : niveau de l'étudiant, historique, etc.
2. **Créer des outils (Tools)** : Appels API pour récupérer des données
3. **Analyser les conversations** : Statistiques, temps de parole, sujets abordés
4. **Souscrire à Écos** : Ajouter l'avatar visuel (si budget disponible)

---

Besoin d'aide ? Tous les fichiers de documentation sont dans le dossier racine du projet ! 🎓
