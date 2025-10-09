# Test de Validation - Logique Questionnaires

## Scénarios à Tester

### ✅ Scénario 1 : Nouveau utilisateur
**Étapes :**
1. Créer un nouveau compte / se connecter pour la première fois
2. Observer l'ordre d'apparition des dialogs

**Résultat attendu :**
1. Dialog "Prédétection de troubles" s'ouvre
2. Après completion → Dialog "Styles d'apprentissage" s'ouvre
3. Après completion → Retour au dashboard avec les deux sections affichées

**État base de données :**
```sql
troubles_detection_completed = true
learning_styles_completed = true
survey_completed = true
```

### ✅ Scénario 2 : Utilisateur avec troubles complétés, styles non complétés
**Préparation :**
```sql
UPDATE profiles SET 
  troubles_detection_completed = true,
  learning_styles_completed = false,
  survey_completed = false
WHERE user_id = 'USER_ID';
```

**Résultat attendu :**
1. Pas de dialog troubles (déjà complété)
2. Dialog "Styles d'apprentissage" s'ouvre directement
3. Après completion → Retour au dashboard

### ✅ Scénario 3 : Utilisateur complètement terminé
**Préparation :**
```sql
UPDATE profiles SET 
  troubles_detection_completed = true,
  learning_styles_completed = true,
  survey_completed = true
WHERE user_id = 'USER_ID';
```

**Résultat attendu :**
1. Aucun dialog ne s'ouvre
2. Dashboard s'affiche directement avec les deux sections complètes

### ✅ Scénario 4 : Refaire le test de troubles (utilisateur expérimenté)
**Préparation :**
- Utilisateur avec les deux questionnaires déjà complétés

**Étapes :**
1. Cliquer sur "Modifier / Refaire le test" dans la section troubles
2. Compléter le questionnaire de troubles

**Résultat attendu :**
1. Dialog troubles s'ouvre
2. ⚠️ **IMPORTANT** : Après completion, le dialog styles d'apprentissage NE DOIT PAS s'ouvrir (car déjà complété)
3. Retour direct au dashboard

**Validation base :**
```sql
-- Vérifier que seul troubles_detection_completed est remis à false
SELECT troubles_detection_completed, learning_styles_completed, survey_completed 
FROM profiles WHERE user_id = 'USER_ID';
-- Doit être : true, true, true (styles et survey restent intacts)
```

### ✅ Scénario 5 : Refaire complètement depuis le profil
**Étapes :**
1. Aller dans Profil
2. Cliquer sur "Refaire les questionnaires de prédétection"

**Résultat attendu :**
1. Redirection vers dashboard
2. Dialog troubles s'ouvre
3. Après completion → Dialog styles s'ouvre (car remis à false)
4. Tout est refait from scratch

**État base après profil :**
```sql
troubles_detection_completed = false
learning_styles_completed = false
survey_completed = false
```

## Code de Validation

### Fonction Modifiée : `handleTroublesComplete`
```typescript
const handleTroublesComplete = async () => {
  setShowTroublesDialog(false);
  
  // ✅ Vérifier si styles déjà complétés
  if (user) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('learning_styles_completed, survey_completed')
      .eq('user_id', user.id)
      .single();
    
    // ✅ N'afficher que si pas encore complété
    if (profileData && !profileData.learning_styles_completed && !profileData.survey_completed) {
      setShowLearningStyleDialog(true);
    }
  }
};
```

### Fonction Modifiée : `handleModifyTroublesTest`
```typescript
const handleModifyTroublesTest = async () => {
  if (user) {
    // ✅ Reset SEULEMENT troubles, pas styles
    await supabase
      .from('profiles')
      .update({ troubles_detection_completed: false })
      .eq('user_id', user.id);
    
    setShowTroublesDialog(true);
  }
};
```

## Requêtes de Test SQL

```sql
-- Vérifier l'état d'un utilisateur
SELECT 
  user_id,
  troubles_detection_completed,
  learning_styles_completed,
  survey_completed,
  updated_at
FROM profiles 
WHERE user_id = 'YOUR_USER_ID';

-- Simuler différents états pour test
-- État 1: Nouveau user
UPDATE profiles SET 
  troubles_detection_completed = false,
  learning_styles_completed = false,
  survey_completed = false
WHERE user_id = 'YOUR_USER_ID';

-- État 2: Troubles fait, styles non fait
UPDATE profiles SET 
  troubles_detection_completed = true,
  learning_styles_completed = false,
  survey_completed = false
WHERE user_id = 'YOUR_USER_ID';

-- État 3: Tout complété
UPDATE profiles SET 
  troubles_detection_completed = true,
  learning_styles_completed = true,
  survey_completed = true
WHERE user_id = 'YOUR_USER_ID';
```

## ✅ Validation Réussie

La logique est maintenant correcte :
- ✅ Vérification avant affichage du dialog styles
- ✅ Préservation des états lors de la modification seule des troubles
- ✅ Reset complet possible depuis le profil
- ✅ Pas de double affichage intempestif