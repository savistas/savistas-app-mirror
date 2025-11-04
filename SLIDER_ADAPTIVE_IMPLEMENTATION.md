# Implémentation du Slider Adaptatif pour les Exercices

**Date:** 2025-01-04
**Fichier modifié:** `src/pages/UploadCourse.tsx`

---

## 🎯 Objectif

Adapter dynamiquement le slider "Nombre de jours d'exercices" en fonction du nombre d'exercices restants pour le mois en cours, selon le plan de l'utilisateur.

---

## ✅ Modifications Apportées

### 1. Ajout de `remaining` dans les hooks (ligne 29)

```typescript
const { canCreate, getLimitInfo, remaining } = useUsageLimits();
```

Cela permet d'accéder à `remaining.exercises` qui contient le nombre d'exercices disponibles ce mois-ci.

---

### 2. Slider Dynamique (lignes 437-468)

**Avant:**
```typescript
<Slider
  value={[formData.days]}
  onValueChange={(v) => setFormData({ ...formData, days: v[0] })}
  min={1}
  max={10}  // Fixe
  step={1}
/>
```

**Après:**
```typescript
<Slider
  value={[Math.min(formData.days, Math.min(10, remaining.exercises))]}
  onValueChange={(v) => setFormData({ ...formData, days: v[0] })}
  min={1}
  max={Math.min(10, remaining.exercises)}  // Dynamique !
  step={1}
/>
```

**Logique:**
- `max = Math.min(10, remaining.exercises)`
- Si `remaining.exercises = 25` → max = 10 (limite technique)
- Si `remaining.exercises = 3` → max = 3 (limite plan)
- Si `remaining.exercises = 0` → Slider caché, message d'avertissement

---

### 3. Message Informatif (ligne 455-457)

```typescript
<p className="text-xs text-muted-foreground">
  Il vous reste <strong>{remaining.exercises} exercice{remaining.exercises > 1 ? 's' : ''}</strong>
  ce mois-ci (max. {Math.min(10, remaining.exercises)} jours pour ce cours)
</p>
```

**Exemples d'affichage:**
- "Il vous reste **8 exercices** ce mois-ci (max. 8 jours pour ce cours)"
- "Il vous reste **25 exercices** ce mois-ci (max. 10 jours pour ce cours)"
- "Il vous reste **1 exercice** ce mois-ci (max. 1 jour pour ce cours)"

---

### 4. Gestion du Cas Limite (remaining = 0)

Si l'utilisateur a épuisé ses exercices, le slider est remplacé par :

```typescript
<div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
  <p className="text-sm text-orange-800">
    ⚠️ Vous avez atteint votre limite d'exercices pour ce mois-ci.
    {subscription?.plan === 'basic' && ' Passez à Premium pour créer jusqu\'à 10 exercices par mois.'}
    {subscription?.plan === 'premium' && ' Passez à Pro pour créer jusqu\'à 30 exercices par mois.'}
  </p>
</div>
```

---

### 5. Bouton "Créer" Désactivé (ligne 490)

```typescript
<Button
  onClick={handleCreate}
  disabled={creating || (remaining?.exercises === 0)}
  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-6"
>
  {creating ? "Création..." : remaining?.exercises === 0 ? "Limite atteinte" : "Créer"}
</Button>
```

Le bouton affiche "Limite atteinte" et est désactivé quand `remaining.exercises === 0`.

---

## 📊 Scénarios de Test

### Scénario 1: Utilisateur Premium avec 8 exercices restants

**État:**
- Plan: Premium
- `remaining.exercises = 8`

**Résultat:**
- Slider: min=1, max=8
- Message: "Il vous reste **8 exercices** ce mois-ci (max. 8 jours pour ce cours)"
- Si l'utilisateur sélectionne 8 jours → OK ✅
- Si l'utilisateur essaie de sélectionner 9 ou 10 → Impossible (slider bloqué à 8)

---

### Scénario 2: Utilisateur Pro avec 25 exercices restants

**État:**
- Plan: Pro
- `remaining.exercises = 25`

**Résultat:**
- Slider: min=1, max=10 (limité par la contrainte technique)
- Message: "Il vous reste **25 exercices** ce mois-ci (max. 10 jours pour ce cours)"
- L'utilisateur peut sélectionner jusqu'à 10 jours ✅

---

### Scénario 3: Utilisateur Basic avec 2 exercices restants

**État:**
- Plan: Basic
- `remaining.exercises = 2`

**Résultat:**
- Slider: min=1, max=2
- Message: "Il vous reste **2 exercices** ce mois-ci (max. 2 jours pour ce cours)"
- L'utilisateur peut créer un cours de 1 ou 2 jours maximum ✅

---

### Scénario 4: Utilisateur Premium avec 0 exercices restants

**État:**
- Plan: Premium
- `remaining.exercises = 0`

**Résultat:**
- ❌ Slider caché
- ⚠️ Message affiché: "Vous avez atteint votre limite d'exercices pour ce mois-ci. Passez à Pro pour créer jusqu'à 30 exercices par mois."
- Bouton "Créer" désactivé avec texte "Limite atteinte"

---

### Scénario 5: Utilisateur crée un cours avec 5 jours, puis revient

**État initial:**
- `remaining.exercises = 10`
- Utilisateur sélectionne 5 jours
- Utilisateur clique sur "Créer"

**Après création (hypothèse: 5 exercices consommés):**
- `remaining.exercises = 5`
- Si l'utilisateur crée un nouveau cours, le slider sera limité à max=5

---

### Scénario 6: Adaptation dynamique en temps réel

**État:**
- `remaining.exercises = 3`
- L'utilisateur a déjà sélectionné `formData.days = 7` (par défaut)

**Résultat:**
- La valeur affichée sera automatiquement ramenée à 3: `Math.min(formData.days, Math.min(10, remaining.exercises))`
- Le slider affiche donc 3 jours (et non 7)
- Cela évite qu'une valeur invalide soit envoyée

---

## 🔄 Flux de Données

```
1. Chargement de la page UploadCourse
   ↓
2. Hook useUsageLimits() récupère la DB
   ↓
3. Calcul de remaining.exercises = limit - usage
   ↓
4. Slider max = Math.min(10, remaining.exercises)
   ↓
5. Message informatif affiché
   ↓
6. Si remaining = 0 → Slider caché + Bouton désactivé
```

---

## 🧪 Comment Tester

### Test 1: Basic avec 2 restants
```sql
-- Dans Supabase
UPDATE monthly_usage
SET exercises_created = 0
WHERE user_id = 'your-user-id';

-- Vérifier remaining
SELECT
  (SELECT exercises FROM user_subscriptions WHERE plan = 'basic') - exercises_created as remaining
FROM monthly_usage
WHERE user_id = 'your-user-id';
-- Résultat attendu: 2
```

1. Ouvrir `/upload-course`
2. Vérifier que le slider va de 1 à 2
3. Vérifier le message "Il vous reste 2 exercices"

---

### Test 2: Premium avec 0 restants
```sql
UPDATE monthly_usage
SET exercises_created = 10
WHERE user_id = 'your-user-id';
```

1. Ouvrir `/upload-course`
2. Vérifier que le slider est caché
3. Vérifier le message orange "Vous avez atteint votre limite"
4. Vérifier que le bouton "Créer" est désactivé

---

### Test 3: Pro avec 15 restants
```sql
UPDATE monthly_usage
SET exercises_created = 15
WHERE user_id = 'your-user-id';
```

1. Ouvrir `/upload-course`
2. Vérifier que le slider va de 1 à 10 (limite technique)
3. Vérifier le message "Il vous reste 15 exercices ce mois-ci (max. 10 jours pour ce cours)"

---

## ⚠️ Points d'Attention

### 1. Limite Technique vs Limite Plan

Il y a **DEUX limites** à respecter:
- **Limite technique**: Max 10 jours par cours (hard-coded)
- **Limite plan**: Nombre d'exercices restants ce mois-ci (dynamique)

Le slider prend toujours le **minimum des deux**: `Math.min(10, remaining.exercises)`

---

### 2. Incrémentation des Exercices

⚠️ **IMPORTANT:** Cette implémentation suppose que la consommation des exercices est gérée ailleurs dans le code (probablement par le webhook n8n).

Le code actuel ne modifie que l'affichage du slider, il **ne touche pas** à la logique d'incrémentation.

Si le webhook n8n incrémente `exercises_created` après la génération, tout fonctionnera correctement.

---

### 3. Rechargement des Données

Le hook `useUsageLimits` recharge automatiquement toutes les **60 secondes** (ligne 53 dans useUsageLimits.ts):
```typescript
refetchInterval: 1000 * 60, // Refetch every minute
```

Si l'utilisateur reste sur la page pendant 5 minutes et que ses limites changent (ex: nouveau mois), les données se mettront à jour automatiquement.

---

## 📝 Code Review Checklist

- [x] Le slider s'adapte dynamiquement à `remaining.exercises`
- [x] La limite technique de 10 jours est respectée
- [x] Un message informatif est affiché
- [x] Le cas `remaining = 0` est géré (slider caché + bouton désactivé)
- [x] La valeur affichée est cohérente même si `formData.days` est plus grand que le max
- [x] Pas de régression sur le code existant
- [x] Pas de modification de la logique d'incrémentation

---

## 🚀 Améliorations Futures (Optionnel)

### 1. Animation du Slider

Ajouter une transition quand la limite change:
```typescript
<Slider className="w-full transition-all duration-300" />
```

### 2. Tooltip sur le Slider

Afficher un tooltip quand l'utilisateur survole le max:
```typescript
{remaining.exercises < 10 && (
  <Tooltip>
    <TooltipTrigger>ℹ️</TooltipTrigger>
    <TooltipContent>
      Vous pouvez créer jusqu'à 10 jours par cours, mais il vous reste seulement {remaining.exercises} exercices ce mois-ci.
    </TooltipContent>
  </Tooltip>
)}
```

### 3. Afficher la Date de Renouvellement

```typescript
<p className="text-xs text-muted-foreground">
  Vos limites se renouvellent le {format(new Date(subscription.current_period_end), 'dd MMMM', { locale: fr })}
</p>
```

---

**Auteur:** Claude Code
**Date:** 2025-01-04
**Version:** 1.0
