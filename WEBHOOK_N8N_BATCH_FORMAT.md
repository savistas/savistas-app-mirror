# 🚀 Nouveau format Webhook N8N - Mode BATCH

## 📋 Vue d'ensemble

Le webhook N8N reçoit maintenant **UN SEUL appel** par upload, même si l'utilisateur uploade plusieurs erreurs. Cela permet d'optimiser le traitement des documents du cours.

---

## 🎯 Avantages

### ✅ Performance optimisée
- Documents du cours traités **UNE SEULE FOIS** au lieu de N fois
- Synthèse du cours réutilisée pour analyser toutes les erreurs
- Moins d'appels API

### ✅ Workflow N8N flexible
- Possibilité de paralléliser l'analyse des erreurs
- Ou de les traiter séquentiellement selon les besoins
- Plus de contrôle sur le pipeline de traitement

### ✅ Granularité préservée
- En base de données: **1 row = 1 erreur**
- Chaque erreur garde son propre statut (`generating`, `completed`, `error`)
- N8N peut mettre à jour chaque erreur individuellement

---

## 📡 Structure du payload webhook

### **Exemple: User upload 3 erreurs + 2 documents**

```json
{
  "upload_session_id": "550e8400-e29b-41d4-a716-446655440000",
  "error_revisions": [
    {
      "error_revision_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "error_image_url": "https://vvmkbpkoccxpmfpxhacv.supabase.co/storage/v1/object/public/error_revision/user-id/session-id/1730678400123.jpg"
    },
    {
      "error_revision_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "error_image_url": "https://vvmkbpkoccxpmfpxhacv.supabase.co/storage/v1/object/public/error_revision/user-id/session-id/1730678400456.jpg"
    },
    {
      "error_revision_id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
      "error_image_url": "https://vvmkbpkoccxpmfpxhacv.supabase.co/storage/v1/object/public/error_revision/user-id/session-id/1730678400789.jpg"
    }
  ],
  "document_ids": [
    "doc-uuid-1",
    "doc-uuid-2"
  ],
  "user_id": "user-uuid-123",
  "subject": "Mathématiques",
  "course_name": "Théorème de Pythagore",
  "user_message": "J'ai besoin d'aide sur ces exercices"
}
```

---

## 🔄 Workflow N8N recommandé

### **Étape 1: Télécharger les documents du cours**

```javascript
// Node N8N: Download Documents
const documentIds = $json.document_ids;
const documents = [];

for (const docId of documentIds) {
  // Récupérer l'URL du document depuis Supabase
  const doc = await supabase
    .from('documents')
    .select('file_path')
    .eq('id', docId)
    .single();

  // Télécharger le contenu
  const content = await fetchDocumentContent(doc.file_path);
  documents.push(content);
}

return { documents };
```

### **Étape 2: Générer la synthèse du cours**

```javascript
// Node N8N: Generate Course Synthesis
const documents = $input.first().json.documents;
const subject = $json.subject;
const courseName = $json.course_name;

// Appel à l'IA pour synthétiser les documents
const synthesis = await ai.generateSynthesis({
  documents,
  subject,
  courseName
});

return { synthesis };
```

### **Étape 3: Loop sur les erreurs**

```javascript
// Node N8N: Split Errors (Loop Node)
const errorRevisions = $json.error_revisions;
const synthesis = $node["Generate Course Synthesis"].json.synthesis;

// N8N va créer une itération pour chaque erreur
return errorRevisions.map(error => ({
  error_revision_id: error.error_revision_id,
  error_image_url: error.error_image_url,
  synthesis: synthesis,  // Synthèse partagée
  subject: $json.subject,
  course_name: $json.course_name,
  user_id: $json.user_id
}));
```

### **Étape 4: Analyser chaque erreur**

```javascript
// Node N8N: Analyze Error (dans le loop)
const errorImageUrl = $json.error_image_url;
const synthesis = $json.synthesis;
const errorRevisionId = $json.error_revision_id;

// Télécharger l'image d'erreur
const errorImage = await downloadImage(errorImageUrl);

// Analyser l'erreur avec la synthèse du cours
const analysis = await ai.analyzeError({
  errorImage,
  courseSynthesis: synthesis,
  subject: $json.subject
});

return {
  error_revision_id: errorRevisionId,
  analysis
};
```

### **Étape 5: Mettre à jour Supabase**

```javascript
// Node N8N: Update Supabase (dans le loop)
const errorRevisionId = $json.error_revision_id;
const analysis = $json.analysis;

// Update le statut et l'analyse dans Supabase
await supabase
  .from('error_single_revision')
  .update({
    status: 'completed',
    analysis_response: analysis
  })
  .eq('id', errorRevisionId);

return { success: true };
```

---

## 📊 Schéma du workflow

```
┌─────────────────────────────────────────────────────────┐
│  Webhook reçoit 1 payload avec 3 erreurs               │
└────────────────────┬────────────────────────────────────┘
                     │
                     v
         ┌───────────────────────┐
         │ Télécharger documents │
         │  (doc1, doc2)         │
         └───────────┬───────────┘
                     │
                     v
         ┌───────────────────────┐
         │ Générer synthèse du   │
         │  cours (1x)           │
         └───────────┬───────────┘
                     │
                     v
         ┌───────────────────────┐
         │ Loop: 3 itérations    │
         └───────────┬───────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        v            v            v
    ┌───────┐   ┌───────┐   ┌───────┐
    │Error 1│   │Error 2│   │Error 3│
    │Analyze│   │Analyze│   │Analyze│
    └───┬───┘   └───┬───┘   └───┬───┘
        │           │           │
        v           v           v
    ┌───────┐   ┌───────┐   ┌───────┐
    │Update │   │Update │   │Update │
    │ DB #1 │   │ DB #2 │   │ DB #3 │
    └───────┘   └───────┘   └───────┘
```

---

## 🗄️ Structure de la base de données

### **Table `error_single_revision`**

Après l'upload, la table contient **3 rows distinctes**:

| id | user_id | upload_session_id | error_image_url | document_ids | status | analysis_response |
|----|---------|-------------------|-----------------|--------------|--------|-------------------|
| uuid-1 | user-123 | session-xyz | url-error-1 | [doc-1, doc-2] | generating | null |
| uuid-2 | user-123 | session-xyz | url-error-2 | [doc-1, doc-2] | generating | null |
| uuid-3 | user-123 | session-xyz | url-error-3 | [doc-1, doc-2] | generating | null |

**Notes:**
- Toutes les rows partagent le même `upload_session_id` (groupement)
- Toutes partagent les mêmes `document_ids` (documents du cours)
- Chaque row a sa propre `error_image_url`
- Chaque row a son propre `status` (peut être mis à jour indépendamment)

---

## ⚙️ Configuration N8N

### **URL du webhook:**
```
https://n8n.srv932562.hstgr.cloud/webhook/error-analysis
```

### **Méthode HTTP:**
```
POST
```

### **Headers:**
```json
{
  "Content-Type": "application/json"
}
```

---

## 🧪 Test du workflow

### **1. Tester avec curl:**

```bash
curl -X POST https://n8n.srv932562.hstgr.cloud/webhook/error-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "upload_session_id": "test-session-123",
    "error_revisions": [
      {
        "error_revision_id": "error-1",
        "error_image_url": "https://example.com/error1.jpg"
      },
      {
        "error_revision_id": "error-2",
        "error_image_url": "https://example.com/error2.jpg"
      }
    ],
    "document_ids": ["doc-1", "doc-2"],
    "user_id": "user-123",
    "subject": "Mathématiques",
    "course_name": "Test",
    "user_message": "Test message"
  }'
```

### **2. Vérifier dans N8N:**

1. Ouvre ton workflow N8N
2. Vérifie que le webhook reçoit bien le payload complet
3. Vérifie que `error_revisions` est un tableau avec plusieurs items
4. Vérifie que le loop fonctionne correctement

### **3. Vérifier dans Supabase:**

```sql
-- Vérifier que les erreurs ont été créées
SELECT
  id,
  upload_session_id,
  error_image_url,
  status
FROM error_single_revision
WHERE upload_session_id = 'test-session-123';

-- Résultat attendu: 2 rows avec le même upload_session_id
```

---

## 🔍 Debugging

### **Si le webhook échoue:**

1. **Vérifier les logs N8N** pour voir le payload reçu
2. **Vérifier que `error_revisions` est bien un tableau**
3. **Vérifier que tous les champs requis sont présents**

### **Si l'analyse échoue:**

1. **Vérifier que les document_ids existent** dans la table `documents`
2. **Vérifier que les error_image_urls sont accessibles** (URLs publiques)
3. **Vérifier les logs d'erreur** dans la table `error_single_revision`

### **Si le status ne se met pas à jour:**

1. **Vérifier que N8N update bien chaque `error_revision_id`**
2. **Vérifier les permissions RLS** sur la table
3. **Vérifier que le loop itère bien** sur tous les éléments

---

## 📝 Checklist de migration N8N

- [ ] Mettre à jour le webhook pour recevoir `upload_session_id`
- [ ] Mettre à jour le webhook pour recevoir `error_revisions[]` au lieu de `error_revision_id`
- [ ] Ajouter le node de téléchargement des documents
- [ ] Ajouter le node de génération de synthèse
- [ ] Ajouter le loop node pour itérer sur `error_revisions`
- [ ] Mettre à jour le node d'analyse pour utiliser la synthèse
- [ ] Tester avec 1 erreur
- [ ] Tester avec 3 erreurs
- [ ] Tester avec 10 erreurs

---

## 🎉 Résultat final

### **Avant (mode individuel):**
- 3 erreurs uploadées = **3 appels webhook**
- Documents du cours téléchargés **3 fois**
- Synthèse générée **3 fois**
- ❌ Inefficace et coûteux

### **Après (mode batch):**
- 3 erreurs uploadées = **1 appel webhook**
- Documents du cours téléchargés **1 fois**
- Synthèse générée **1 fois**
- ✅ Optimisé et performant

---

## 🆘 Support

Si tu as des questions ou des problèmes:
1. Vérifie les logs N8N
2. Vérifie les logs dans la console frontend
3. Vérifie la table `error_single_revision` dans Supabase
4. Vérifie que le fichier SQL a bien été exécuté

Bon courage! 🚀
