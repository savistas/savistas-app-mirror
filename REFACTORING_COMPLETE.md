# ✅ Refactoring complet terminé - Architecture "Une erreur par row"

## 🎯 Ce qui a été implémenté

### 1. **Bug du bouton "Annuler" - CORRIGÉ** ✅
- Ajout d'une prop `onCancel` dans `ErrorRevisionForm`
- Le bouton ferme maintenant le modal au lieu de rediriger vers `/student/documents`
- L'utilisateur reste sur la page `/student/cahier-erreurs`

### 2. **Architecture refactorisée** ✅

#### **Avant:**
- 1 upload = 1 row avec `error_image_urls[]` (plusieurs images)
- Difficile de gérer le statut individuel de chaque erreur
- Pas de groupement logique

#### **Après:**
- 1 upload = N rows (1 par image d'erreur)
- Chaque row a son propre statut (`generating`/`completed`/`error`)
- Groupement via `upload_session_id`
- Documents partagés via `document_ids[]`

---

## 📊 Structure de la base de données

### **Table `error_single_revision` modifiée:**

```sql
CREATE TABLE error_single_revision (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(user_id),

  -- Nouveau champ pour grouper les erreurs du même upload
  upload_session_id UUID NOT NULL,

  -- UNE seule image par row (pas un tableau)
  error_image_url TEXT NOT NULL,

  -- Documents partagés (tableau)
  document_ids UUID[] NOT NULL,

  -- Métadonnées
  subject TEXT NOT NULL,
  course_name TEXT NOT NULL,
  user_message TEXT,

  -- Statut individuel
  status TEXT DEFAULT 'generating',
  analysis_response JSONB,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_upload_session ON error_single_revision(upload_session_id);
CREATE INDEX idx_error_revision_created_at ON error_single_revision(created_at DESC);
```

---

## 🔄 Workflow du service

### **Scénario d'exemple:** User upload 3 erreurs + 2 documents

```typescript
// 1. Génération d'un upload_session_id unique
uploadSessionId = crypto.randomUUID();

// 2. Upload des 2 documents (partagés)
documentIds = ["doc-1", "doc-2"];

// 3. Pour CHAQUE erreur (3x):
FOR EACH errorImage IN [image1, image2, image3] {
  // 3a. Upload l'image
  errorImageUrl = uploadErrorImage(errorImage);

  // 3b. Créer une row
  revisionId = createErrorRevision({
    uploadSessionId,        // Même ID pour grouper
    errorImageUrl,          // URL unique
    documentIds,            // Documents partagés
    ...
  });

  // 3c. Appeler webhook N8N
  triggerWebhook({
    error_revision_id: revisionId,
    error_image_url: errorImageUrl,
    document_ids: ["doc-1", "doc-2"],
    ...
  });
}

// Résultat: 3 rows dans error_single_revision
```

---

## 📡 Payload Webhook N8N

### **Structure envoyée à N8N:**

```json
{
  "error_revision_id": "uuid-de-la-revision",
  "error_image_url": "https://.../error_image.jpg",
  "document_ids": [
    "uuid-document-1",
    "uuid-document-2"
  ],
  "user_id": "uuid-user",
  "subject": "Mathématiques",
  "course_name": "Théorème de Pythagore"
}
```

### **Traitement N8N:**
1. Reçoit 1 webhook par erreur (3 webhooks si 3 erreurs)
2. Télécharge l'image d'erreur depuis `error_image_url`
3. Télécharge tous les documents depuis `document_ids[]`
4. Analyse l'erreur avec les documents de référence
5. Met à jour `error_revision_id` avec le statut et l'analyse

---

## 🎨 Affichage Frontend

### **Dans le Cahier d'erreurs:**

Si l'utilisateur a uploadé **3 erreurs + 2 documents**, il verra **3 cartes distinctes** :

```
┌─────────────────────────────────┐
│ Erreur 1 - Mathématiques        │
│ 📅 03/11/2025                   │
│ 📝 Théorème de Pythagore        │
│ Status: ✅ Terminé               │
│ [Voir l'image] [Voir l'analyse] │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Erreur 2 - Mathématiques        │
│ 📅 03/11/2025                   │
│ 📝 Théorème de Pythagore        │
│ Status: 🔄 Analyse en cours...   │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Erreur 3 - Mathématiques        │
│ 📅 03/11/2025                   │
│ 📝 Théorème de Pythagore        │
│ Status: ✅ Terminé               │
│ [Voir l'image] [Voir l'analyse] │
└─────────────────────────────────┘
```

**Notes:**
- Chaque erreur a son propre statut
- Les 3 erreurs partagent les mêmes documents de cours
- Elles ont toutes le même `upload_session_id` (pour groupement futur)

---

## 📝 Fichiers modifiés

### **1. Types TypeScript** (`src/types/errorRevision.ts`)
- ✅ `ErrorRevisionUploadData`: Ajout `uploadSessionId`, changement `errorImageUrl` (singulier)
- ✅ `ErrorRevision`: Ajout `upload_session_id`, changement `error_image_url` (singulier)
- ✅ `WebhookPayload`: Ajout `error_image_url`, `document_ids[]`

### **2. Service** (`src/services/errorRevisionService.ts`)
- ✅ `submitErrorRevision()`: Refactorisé pour créer N rows (1 par erreur)
- ✅ `createErrorRevision()`: Adapté pour `upload_session_id` et `error_image_url`
- ✅ `triggerAnalysisWebhook()`: Payload adapté avec `document_ids[]`
- ✅ Suppression des fonctions obsolètes (`uploadErrorImages`, `triggerAnalysisWebhookMultiple`)

### **3. Formulaire** (`src/components/error-revision/ErrorRevisionForm.tsx`)
- ✅ Bouton "Annuler" corrigé avec prop `onCancel`
- ✅ Reste compatible avec le multi-upload (côté form)

### **4. Modal** (`src/components/error-revision/ErrorRevisionModal.tsx`)
- ✅ Passage de `onCancel={() => onOpenChange(false)}`

### **5. Frontend** (`src/pages/CahierErreurs.tsx`)
- ✅ Affichage adapté pour `error_image_url` (singulier)
- ✅ Chaque erreur affiche 1 image

### **6. Migrations Supabase**
- ✅ `20251103000002_refactor_to_single_error_per_row.sql`
- ✅ Fichier SQL prêt: `APPLY_THIS_MIGRATION_IN_SUPABASE_DASHBOARD.sql`

---

## ⚠️ Actions requises

### **1. Appliquer la migration Supabase**

Ouvrez le **SQL Editor** de votre dashboard Supabase et exécutez le fichier:
```
APPLY_THIS_MIGRATION_IN_SUPABASE_DASHBOARD.sql
```

Ou utilisez Docker local si disponible:
```bash
npx supabase start
npx supabase db push
```

### **2. Tester le workflow complet**

1. Accédez à http://localhost:8081/student/cahier-erreurs
2. Cliquez sur "Réviser une erreur"
3. Uploadez **3 images d'erreurs + 2 documents de cours**
4. Cliquez sur "Annuler" → Doit fermer le modal ✅
5. Soumettez le formulaire
6. Vérifiez dans Supabase → 3 rows créées avec le même `upload_session_id`
7. Vérifiez les webhooks N8N → 3 appels reçus (1 par erreur)
8. Chaque webhook contient `document_ids: ["doc1", "doc2"]`

### **3. Adapter N8N si nécessaire**

Le webhook reçoit maintenant:
```json
{
  "error_revision_id": "...",
  "error_image_url": "...",
  "document_ids": ["...", "..."],  // ⚠️ Tableau de documents
  ...
}
```

Assurez-vous que N8N:
- Télécharge tous les documents depuis `document_ids[]`
- Analyse 1 erreur avec TOUS les documents
- Met à jour le bon `error_revision_id`

---

## ✨ Avantages de la nouvelle architecture

1. ✅ **Clarté conceptuelle**: 1 row = 1 erreur
2. ✅ **Statut individuel**: Chaque erreur peut être "generating", "completed" ou "error" indépendamment
3. ✅ **Scalabilité**: Facile d'ajouter des filtres/tris par erreur
4. ✅ **Groupement**: `upload_session_id` permet de retrouver toutes les erreurs du même upload
5. ✅ **Efficacité**: Documents partagés (pas de duplication)
6. ✅ **Webhook simple**: 1 appel = 1 erreur + tous ses documents
7. ✅ **Frontend simple**: Affichage naturel (1 carte = 1 erreur)

---

## 🚀 Prochaines étapes (optionnelles)

1. **Badge de groupement**: Afficher un badge "Groupe d'upload" dans le frontend pour identifier les erreurs uploadées ensemble
2. **Filtrage par session**: Ajouter un filtre pour voir toutes les erreurs d'une même session
3. **Retry webhook**: Bouton pour réessayer l'analyse si le statut = "error"
4. **Page dédiée**: Créer une page pour voir l'analyse détaillée au lieu de juste ouvrir l'image

---

## 📦 Serveur de développement

Le serveur tourne sur: **http://localhost:8081**

Tout est prêt pour les tests ! 🎉
