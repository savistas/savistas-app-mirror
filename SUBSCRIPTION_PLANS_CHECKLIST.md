# Checklist de Vérification des Plans d'Abonnement

Ce document fournit une checklist complète pour vérifier que tous les paramètres des plans Premium et Pro sont correctement configurés dans la base de données, le code et l'interface utilisateur.

**Dernière mise à jour:** 2025-01-04 (Validé selon Excel de référence)

---

## ⚠️ CLARIFICATION IMPORTANTE

### Terminologie "Exercices" vs "Cours"

**Selon l'Excel de référence:**
- Basic: **2 exercices**
- Premium: **10 exercices**
- Pro: **30 exercices**

**Dans le code (useSubscription.ts):**
```typescript
courses: 2,      // Nombre de COURS créables par mois
exercises: 2,    // Nombre d'EXERCICES créables par mois
```

**⚠️ Clarification nécessaire:**
- **Option retenue**: "Exercices" dans l'Excel = "Cours" dans le code
- Un cours contient des exercices quotidiens générés automatiquement (QCM)
- La limite mensuelle s'applique au nombre de cours créés (upload de documents)

**Si cette interprétation est incorrecte, il faudra ajuster les limites dans le code.**

---

## Vue d'Ensemble des Plans

| Critère | Basic (Gratuit) | Premium (9,90€/mois) | Pro (19,90€/mois) |
|---------|-----------------|----------------------|-------------------|
| **Cours par mois** | 2 | 10 | 30 |
| **Exercices par mois** | 2 | 10 | 30 |
| **Fiches de révision par mois** | 2 | 10 | 30 |
| **Minutes IA de base** | 3 min | 0 min | 0 min |
| **Achat de minutes IA** | ❌ Non | ✅ Oui | ✅ Oui |
| **Max jours par cours** | 10 | 10 | 10 |
| **QCM par jour** | 1-10 | 1-10 | 1-10 |

### Prix Stripe

| Produit | Price ID | Prix |
|---------|----------|------|
| Premium Monthly | `price_1SNu6P37eeTawvFRvh1JGgOC` | 9,90€ |
| Pro Monthly | `price_1SNu6N37eeTawvFR0CRbzo7F` | 19,90€ |
| AI Pack 10min | `price_1SNu6D37eeTawvFRAVwbpsol` | 5€ |
| AI Pack 30min | `price_1SNu6B37eeTawvFRjJ20hc7w` | 15€ |
| AI Pack 60min | `price_1SNu5g37eeTawvFRdsQ1vIYp` | 20€ |

---

## ✅ Checklist Plan PREMIUM

### 1. Base de Données - Table `profiles`

**Accès:** https://supabase.com/dashboard/project/vvmkbpkoccxpmfpxhacv/editor

- [ ] La colonne `subscription` = `'premium'`
- [ ] Le `user_id` existe et correspond à l'utilisateur
- [ ] L'`email` est correct

**Comment vérifier:**
```sql
SELECT user_id, email, subscription
FROM profiles
WHERE email = 'votre-email@example.com';
```

---

### 2. Base de Données - Table `user_subscriptions`

- [ ] La colonne `plan` = `'premium'` (exactement, en minuscules)
- [ ] La colonne `status` = `'active'`
- [ ] `stripe_customer_id` commence par `cus_`
- [ ] `stripe_subscription_id` commence par `sub_`
- [ ] `current_period_start` contient une date récente (timestamp)
- [ ] `current_period_end` est ~30 jours après `current_period_start`
- [ ] `cancel_at_period_end` = `false`
- [ ] `canceled_at` = `null`
- [ ] `ai_minutes_purchased` ≥ `0` (peut être 0 ou plus)

**Comment vérifier:**
```sql
SELECT *
FROM user_subscriptions
WHERE user_id = 'votre-user-id';
```

---

### 3. Base de Données - Table `monthly_usage`

- [ ] Une ligne existe pour la période en cours
- [ ] `period_start` correspond à `current_period_start` de la subscription
- [ ] `period_end` correspond à `current_period_end` de la subscription
- [ ] `courses_created` est entre 0 et 10
- [ ] `exercises_created` est entre 0 et 10
- [ ] `fiches_created` est entre 0 et 10
- [ ] `ai_minutes_used` ≥ 0

**Comment vérifier:**
```sql
SELECT *
FROM monthly_usage
WHERE user_id = 'votre-user-id'
ORDER BY period_start DESC
LIMIT 1;
```

---

### 4. Code - Limites dans `useSubscription.ts`

**Fichier:** `src/hooks/useSubscription.ts`

- [ ] `PLAN_LIMITS.premium.courses` = `10`
- [ ] `PLAN_LIMITS.premium.exercises` = `10`
- [ ] `PLAN_LIMITS.premium.fiches` = `10`
- [ ] `PLAN_LIMITS.premium.aiMinutes` = `0` (seulement minutes achetées)
- [ ] `PLAN_LIMITS.premium.maxDaysPerCourse` = `10`

**Ligne de code:** `src/hooks/useSubscription.ts:38-44`

---

### 5. Interface Utilisateur - `PlanDetailsDialog.tsx`

**Fichier:** `src/components/subscription/PlanDetailsDialog.tsx`

- [ ] `PLAN_DETAILS.premium.name` = `'Premium'`
- [ ] `PLAN_DETAILS.premium.price` = `'9,99€'`
- [ ] `PLAN_DETAILS.premium.priceId` = `'price_1SNu6P37eeTawvFRvh1JGgOC'`
- [ ] Features affichées incluent:
  - [ ] "10 cours par mois"
  - [ ] "10 exercices par mois"
  - [ ] "10 fiches de révision par mois"
  - [ ] "Modèle IA avancé"

**Ligne de code:** `src/components/subscription/PlanDetailsDialog.tsx:22-41`

---

### 6. Interface Utilisateur - `UpgradeDialog.tsx`

**Fichier:** `src/components/subscription/UpgradeDialog.tsx`

- [ ] `PRICE_IDS.premium` = `'price_1SNu6P37eeTawvFRvh1JGgOC'`
- [ ] Prix affiché = `'9,90€/mois'`
- [ ] Features affichées incluent:
  - [ ] "10 cours par mois"
  - [ ] "10 exercices par mois"
  - [ ] "10 fiches de révision par mois"
  - [ ] "Achats de minutes IA disponibles"
  - [ ] "10 jours max par cours"

**Ligne de code:** `src/components/subscription/UpgradeDialog.tsx:23,104-128`

---

### 7. Stripe Dashboard

**Accès:** https://dashboard.stripe.com/test/subscriptions (ou /live pour production)

- [ ] Le customer existe avec l'email correct
- [ ] La subscription est `active`
- [ ] Le price utilisé est `price_1SNu6P37eeTawvFRvh1JGgOC`
- [ ] Le montant est 9,90€
- [ ] Le prochain paiement est programmé (~30 jours)

---

## ✅ Checklist Plan PRO

### 1. Base de Données - Table `profiles`

- [ ] La colonne `subscription` = `'pro'`
- [ ] Le `user_id` existe et correspond à l'utilisateur
- [ ] L'`email` est correct

**Comment vérifier:**
```sql
SELECT user_id, email, subscription
FROM profiles
WHERE email = 'votre-email@example.com';
```

---

### 2. Base de Données - Table `user_subscriptions`

- [ ] La colonne `plan` = `'pro'` (exactement, en minuscules)
- [ ] La colonne `status` = `'active'`
- [ ] `stripe_customer_id` commence par `cus_`
- [ ] `stripe_subscription_id` commence par `sub_`
- [ ] `current_period_start` contient une date récente (timestamp)
- [ ] `current_period_end` est ~30 jours après `current_period_start`
- [ ] `cancel_at_period_end` = `false`
- [ ] `canceled_at` = `null`
- [ ] `ai_minutes_purchased` ≥ `0` (peut être 0 ou plus)

**Comment vérifier:**
```sql
SELECT *
FROM user_subscriptions
WHERE user_id = 'votre-user-id';
```

---

### 3. Base de Données - Table `monthly_usage`

- [ ] Une ligne existe pour la période en cours
- [ ] `period_start` correspond à `current_period_start` de la subscription
- [ ] `period_end` correspond à `current_period_end` de la subscription
- [ ] `courses_created` est entre 0 et 30
- [ ] `exercises_created` est entre 0 et 30
- [ ] `fiches_created` est entre 0 et 30
- [ ] `ai_minutes_used` ≥ 0

**Comment vérifier:**
```sql
SELECT *
FROM monthly_usage
WHERE user_id = 'votre-user-id'
ORDER BY period_start DESC
LIMIT 1;
```

---

### 4. Code - Limites dans `useSubscription.ts`

**Fichier:** `src/hooks/useSubscription.ts`

- [ ] `PLAN_LIMITS.pro.courses` = `30`
- [ ] `PLAN_LIMITS.pro.exercises` = `30`
- [ ] `PLAN_LIMITS.pro.fiches` = `30`
- [ ] `PLAN_LIMITS.pro.aiMinutes` = `0` (seulement minutes achetées)
- [ ] `PLAN_LIMITS.pro.maxDaysPerCourse` = `10`

**Ligne de code:** `src/hooks/useSubscription.ts:45-51`

---

### 5. Interface Utilisateur - `PlanDetailsDialog.tsx`

**Fichier:** `src/components/subscription/PlanDetailsDialog.tsx`

- [ ] `PLAN_DETAILS.pro.name` = `'Pro'`
- [ ] `PLAN_DETAILS.pro.price` = `'19,99€'`
- [ ] `PLAN_DETAILS.pro.priceId` = `'price_1SNu6N37eeTawvFR0CRbzo7F'`
- [ ] Features affichées incluent:
  - [ ] "30 cours par mois"
  - [ ] "30 exercices par mois"
  - [ ] "30 fiches de révision par mois"
  - [ ] "Modèle IA professionnel"

**Ligne de code:** `src/components/subscription/PlanDetailsDialog.tsx:42-61`

---

### 6. Interface Utilisateur - `UpgradeDialog.tsx`

**Fichier:** `src/components/subscription/UpgradeDialog.tsx`

- [ ] `PRICE_IDS.pro` = `'price_1SNu6N37eeTawvFR0CRbzo7F'`
- [ ] Prix affiché = `'19,90€/mois'`
- [ ] Features affichées incluent:
  - [ ] "30 cours par mois"
  - [ ] "30 exercices par mois"
  - [ ] "30 fiches de révision par mois"
  - [ ] "Achats de minutes IA disponibles"
  - [ ] "10 jours max par cours"

**Ligne de code:** `src/components/subscription/UpgradeDialog.tsx:24,154-178`

---

### 7. Stripe Dashboard

**Accès:** https://dashboard.stripe.com/test/subscriptions (ou /live pour production)

- [ ] Le customer existe avec l'email correct
- [ ] La subscription est `active`
- [ ] Le price utilisé est `price_1SNu6N37eeTawvFR0CRbzo7F`
- [ ] Le montant est 19,90€
- [ ] Le prochain paiement est programmé (~30 jours)

---

## 📦 Checklist Packs de Minutes IA

### Vérification des Prix et Produits

- [ ] **Pack 10 minutes:**
  - Price ID: `price_1SNu6D37eeTawvFRAVwbpsol`
  - Prix: 5€
  - Disponible uniquement pour Premium et Pro

- [ ] **Pack 30 minutes:**
  - Price ID: `price_1SNu6B37eeTawvFRjJ20hc7w`
  - Prix: 15€
  - Disponible uniquement pour Premium et Pro

- [ ] **Pack 60 minutes:**
  - Price ID: `price_1SNu5g37eeTawvFRdsQ1vIYp`
  - Prix: 20€
  - Disponible uniquement pour Premium et Pro

### Comportement Attendu

- [ ] Les minutes achetées s'accumulent dans `user_subscriptions.ai_minutes_purchased`
- [ ] Les minutes achetées n'expirent jamais
- [ ] Les utilisateurs Basic ne peuvent PAS acheter de minutes IA
- [ ] Le dialogue de mise à niveau affiche les packs seulement pour Premium/Pro

**Fichiers à vérifier:**
- `src/components/subscription/UpgradeDialog.tsx:201-281`
- `src/hooks/useSubscription.ts:114-118`

---

## 🔧 Vérifications Techniques Supplémentaires

### Limites de Cours

**Table:** `courses`

- [ ] `qcm_per_day` est entre 1 et 10 pour tous les cours
- [ ] `days_number` respecte la limite de 10 jours maximum

**Vérification SQL:**
```sql
SELECT id, title, days_number, qcm_per_day
FROM courses
WHERE user_id = 'votre-user-id';
```

---

### Webhook Stripe

**Fichier Edge Function:** `supabase/functions/stripe-webhook/index.ts`

- [ ] Le webhook écoute les événements:
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `checkout.session.completed`

- [ ] Le webhook met à jour correctement:
  - `profiles.subscription`
  - `user_subscriptions` (toutes les colonnes)
  - `monthly_usage` (création de nouvelle période si nécessaire)

**Configuration Stripe:**
- [ ] Webhook endpoint configuré: `https://vvmkbpkoccxpmfpxhacv.supabase.co/functions/v1/stripe-webhook`
- [ ] Webhook secret défini dans Supabase: `STRIPE_WEBHOOK_SECRET`

---

### Logique de Reset Mensuel

- [ ] `monthly_usage.period_start` se base sur `user_subscriptions.current_period_start`
- [ ] `monthly_usage.period_end` se base sur `user_subscriptions.current_period_end`
- [ ] Les compteurs se réinitialisent au début de chaque période
- [ ] Les minutes IA achetées ne se réinitialisent JAMAIS

---

## ⚠️ Incohérences Détectées

### 1. Prix affichés - CORRIGÉ ✅

**INCOHÉRENCE:**
- `PlanDetailsDialog.tsx`: Affichait "9,**99**€" et "19,**99**€"
- `UpgradeDialog.tsx`: Affichait "9,**90**€" et "19,**90**€"

**✅ CONFIRMÉ:** Les prix corrects sont **9,90€** (Premium) et **19,90€** (Pro) selon Stripe.

**ACTION REQUISE:** Mettre à jour `PlanDetailsDialog.tsx` ligne 25 et 44:
```typescript
// Changer de:
price: '9,99€',  // ligne 25
price: '19,99€', // ligne 44

// À:
price: '9,90€',
price: '19,90€',
```

---

### 2. Documentation - À Mettre à Jour

**Fichier:** `SUBSCRIPTION_DATABASE_VALUES.md`

**INCOHÉRENCE:**
- Le document indique Basic = **3** cours/exercices/fiches
- Mais le code ET l'Excel montrent Basic = **2** cours/exercices/fiches

**ACTION REQUISE:** Mettre à jour la documentation ligne 82-84 et ligne 192-198 pour refléter les bonnes valeurs (2 au lieu de 3).

---

## 📝 Requêtes SQL Utiles

### Vérifier tous les paramètres d'un utilisateur

```sql
-- Vue complète de l'abonnement
SELECT
    p.email,
    p.subscription as profile_plan,
    us.plan as subscription_plan,
    us.status,
    us.current_period_start,
    us.current_period_end,
    us.ai_minutes_purchased,
    mu.courses_created,
    mu.exercises_created,
    mu.fiches_created,
    mu.ai_minutes_used
FROM profiles p
LEFT JOIN user_subscriptions us ON p.user_id = us.user_id
LEFT JOIN monthly_usage mu ON p.user_id = mu.user_id
    AND mu.period_start = us.current_period_start
WHERE p.email = 'votre-email@example.com';
```

### Compter les ressources utilisées ce mois

```sql
SELECT
    COUNT(DISTINCT c.id) as courses_count,
    COUNT(DISTINCT e.id) as exercises_count,
    COUNT(DISTINCT fr.course_id) as fiches_count
FROM profiles p
LEFT JOIN courses c ON c.user_id = p.user_id
    AND c.created_at >= (SELECT current_period_start FROM user_subscriptions WHERE user_id = p.user_id)
LEFT JOIN exercises e ON e.user_id = p.user_id
    AND e.created_at >= (SELECT current_period_start FROM user_subscriptions WHERE user_id = p.user_id)
LEFT JOIN fiche_revision fr ON fr.user_id = p.user_id
    AND fr.created_at >= (SELECT current_period_start FROM user_subscriptions WHERE user_id = p.user_id)
WHERE p.email = 'votre-email@example.com'
GROUP BY p.user_id;
```

---

## 🎯 Procédure de Test Complète

### Test Premium

1. [ ] Créer un compte de test
2. [ ] S'abonner au plan Premium via Stripe Checkout
3. [ ] Vérifier que `profiles.subscription` = `'premium'`
4. [ ] Vérifier que `user_subscriptions.plan` = `'premium'` et `status` = `'active'`
5. [ ] Vérifier qu'une ligne `monthly_usage` a été créée
6. [ ] Créer 10 cours → doit réussir
7. [ ] Créer un 11e cours → doit être bloqué
8. [ ] Acheter un pack de 10 minutes IA
9. [ ] Vérifier que `ai_minutes_purchased` a augmenté de 10

### Test Pro

1. [ ] Créer un compte de test
2. [ ] S'abonner au plan Pro via Stripe Checkout
3. [ ] Vérifier que `profiles.subscription` = `'pro'`
4. [ ] Vérifier que `user_subscriptions.plan` = `'pro'` et `status` = `'active'`
5. [ ] Vérifier qu'une ligne `monthly_usage` a été créée
6. [ ] Créer 30 cours → doit réussir
7. [ ] Créer un 31e cours → doit être bloqué
8. [ ] Acheter un pack de 30 minutes IA
9. [ ] Vérifier que `ai_minutes_purchased` a augmenté de 30

### Test Upgrade Premium → Pro

1. [ ] Avoir un compte Premium actif
2. [ ] Cliquer sur "Passer à Pro"
3. [ ] Vérifier le prorate de Stripe
4. [ ] Vérifier que `user_subscriptions.plan` passe à `'pro'`
5. [ ] Vérifier que les limites passent de 10 à 30
6. [ ] Vérifier que `monthly_usage` conserve les données de la période en cours

---

## 📚 Fichiers de Référence

| Fichier | Description | Ligne(s) Clé(s) |
|---------|-------------|-----------------|
| `src/hooks/useSubscription.ts` | Définition des limites par plan | 30-52 |
| `src/components/subscription/PlanDetailsDialog.tsx` | Détails visuels des plans | 22-61 |
| `src/components/subscription/UpgradeDialog.tsx` | Interface d'upgrade | 22-28, 96-196 |
| `supabase/functions/stripe-webhook/index.ts` | Gestion des webhooks Stripe | - |
| `SUBSCRIPTION_DATABASE_VALUES.md` | Valeurs attendues en BDD | - |

---

## 🆘 Problèmes Courants

### Problème: Plan toujours `basic` après paiement

**Causes possibles:**
1. Webhook Stripe non déclenché
2. Webhook secret incorrect
3. Erreur dans la fonction Edge

**Solutions:**
1. Vérifier les logs du webhook dans Stripe Dashboard
2. Vérifier les logs de l'Edge Function dans Supabase
3. Réenvoyer manuellement l'événement depuis Stripe

---

### Problème: Limite dépassée alors qu'elle ne devrait pas

**Causes possibles:**
1. `monthly_usage` pas synchronisé avec la période actuelle
2. Compteurs pas réinitialisés au changement de période
3. Multiple lignes dans `monthly_usage` pour le même utilisateur

**Solutions:**
1. Vérifier que `period_start` et `period_end` correspondent à la subscription
2. Supprimer les anciennes lignes de `monthly_usage`
3. Forcer une re-synchronisation

---

### Problème: Minutes IA disparues

**Causes possibles:**
1. Erreur de déduction lors de l'utilisation
2. Multiple abonnements (confusion entre packs)

**Solutions:**
1. Vérifier l'historique dans `ai_teacher_conversations`
2. Vérifier `user_subscriptions.ai_minutes_purchased`
3. Comparer avec les paiements dans Stripe

---

## ✅ Validation Finale

Avant de déployer en production:

- [ ] Tous les prix Stripe sont corrects (mode live)
- [ ] Tous les webhooks sont configurés (mode live)
- [ ] Les limites dans le code correspondent à la documentation
- [ ] Les prix affichés dans l'UI sont cohérents
- [ ] Tests E2E passés pour les 3 plans
- [ ] Tests d'upgrade Premium → Pro passés
- [ ] Tests d'achat de packs IA passés
- [ ] Vérification des triggers de base de données
- [ ] Vérification RLS (Row Level Security) pour toutes les tables

---

**Date de création:** 2025-01-04
**Dernière mise à jour:** 2025-01-04
