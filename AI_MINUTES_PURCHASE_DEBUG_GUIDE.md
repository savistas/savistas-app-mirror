# Guide de Débogage : Achat de Minutes Avatar IA

**Date:** 2025-01-04
**Problème:** Les minutes IA achetées n'apparaissent pas dans la jauge après paiement

---

## ✅ Modifications Effectuées

### 1. **Profile.tsx - Ajout de délai avant refetch**

**Problème identifié** : Race condition entre le retour de Stripe et le traitement du webhook

**Solution** : Ajout d'un double refetch avec délais

```typescript
// Refetch après 2 secondes
setTimeout(() => {
  refetchSubscription();

  // Retry après 3 secondes supplémentaires
  setTimeout(() => {
    refetchSubscription();
  }, 3000);
}, 2000);
```

**Pourquoi** : Le webhook Stripe met quelques secondes à traiter et mettre à jour la DB

---

## 🔍 Vérification du Flux Complet

### Étape 1 : Vérifier que le Paiement Stripe a Réussi

```bash
# Lister les paiements récents
npx supabase functions invoke stripe-webhook --method POST
```

Ou via Stripe Dashboard :
- **URL** : https://dashboard.stripe.com/payments
- Cherchez le paiement récent (5€, 15€ ou 20€)
- Vérifiez le statut : "Succeeded"

---

### Étape 2 : Vérifier les Logs du Webhook

```bash
# Lister les logs de la fonction stripe-webhook
npx supabase functions logs stripe-webhook --limit 50
```

**Logs attendus** :
```
✅ Webhook verified: checkout.session.completed
💳 Checkout completed: { mode: 'payment', ... }
✅ Added 10 AI minutes to user <user_id>
```

**Si vous voyez une erreur** :
- `❌ No user_id in session metadata` → Le user_id n'a pas été passé à Stripe
- `❌ Error upserting subscription` → Problème de DB

---

### Étape 3 : Vérifier la Base de Données

```sql
-- Vérifier les minutes achetées pour votre utilisateur
SELECT
  user_id,
  plan,
  ai_minutes_purchased,
  created_at,
  updated_at
FROM user_subscriptions
WHERE user_id = 'YOUR_USER_ID';
```

**Résultat attendu** :
| user_id | plan | ai_minutes_purchased | updated_at |
|---------|------|---------------------|------------|
| abc-123 | premium | 10 | 2025-01-04 15:30:00 |

**Si `ai_minutes_purchased = 0` ou `NULL`** :
- Le webhook n'a pas été appelé
- Ou il a échoué silencieusement

---

### Étape 4 : Vérifier les Product IDs Stripe

**Product IDs attendus dans le webhook** :

```typescript
const AI_MINUTES_PRODUCTS: Record<string, number> = {
  'prod_TKZEb1hffKMjt9': 10,  // Avatar IA - 10min - 5€
  'prod_TKZEPlyD9oRz7p': 30,  // Avatar IA - 30min - 15€
  'prod_TKZE9LG0MXrH1i': 60,  // Avatar IA - 60min - 20€
};
```

**Vérifier dans Stripe** :
```bash
# Vérifier que les Price IDs pointent vers les bons Product IDs
stripe prices retrieve price_1SNu6D37eeTawvFRAVwbpsol --format json | jq '{id, product, unit_amount}'
stripe prices retrieve price_1SNu6B37eeTawvFRjJ20hc7w --format json | jq '{id, product, unit_amount}'
stripe prices retrieve price_1SNu5g37eeTawvFRdsQ1vIYp --format json | jq '{id, product, unit_amount}'
```

**Résultats attendus** :
```json
{"id":"price_1SNu6D37eeTawvFRAVwbpsol","product":"prod_TKZEb1hffKMjt9","unit_amount":500}
{"id":"price_1SNu6B37eeTawvFRjJ20hc7w","product":"prod_TKZEPlyD9oRz7p","unit_amount":1500}
{"id":"price_1SNu5g37eeTawvFRdsQ1vIYp","product":"prod_TKZE9LG0MXrH1i","unit_amount":2000}
```

---

## 🧪 Test Manuel Complet

### 1. Acheter 10 Minutes (5€)

**Avant l'achat** :
```sql
SELECT ai_minutes_purchased FROM user_subscriptions WHERE user_id = 'YOUR_USER_ID';
-- Résultat: 0 (ou la valeur actuelle)
```

**Étapes** :
1. Connectez-vous sur `/profile`
2. Cliquez sur "Acheter des minutes IA"
3. Cliquez sur "Acheter" pour le pack 10min/5€
4. Complétez le paiement Stripe (mode test)
5. Vous êtes redirigé vers `/profile?checkout=success`
6. Toast "Paiement réussi!" apparaît
7. **Attendez 5 secondes** (pour le refetch avec délai)

**Après l'achat** :
```sql
SELECT ai_minutes_purchased, updated_at FROM user_subscriptions WHERE user_id = 'YOUR_USER_ID';
-- Résultat attendu: 10, updated_at = maintenant
```

**Sur l'UI** :
- La jauge "Minutes Avatar IA" doit afficher `10 / 10 min` (pour Premium) ou `10 / 13 min` (pour Basic)
- Si ce n'est pas le cas, **rafraîchissez la page manuellement** (F5)

---

## 🐛 Problèmes Courants

### Problème 1 : Le Webhook N'est Pas Appelé

**Symptôme** : Aucun log dans `stripe-webhook`, la DB n'est pas mise à jour

**Causes possibles** :
1. **Webhook non configuré dans Stripe**
   - Vérifiez : https://dashboard.stripe.com/webhooks
   - URL : `https://vvmkbpkoccxpmfpxhacv.supabase.co/functions/v1/stripe-webhook`
   - Événements : `checkout.session.completed`, `customer.subscription.updated`, etc.

2. **Secret webhook incorrect**
   - Vérifiez dans Supabase Dashboard → Edge Functions → Secrets
   - `STRIPE_WEBHOOK_SECRET=whsec_...`

**Solution** :
```bash
# Tester le webhook localement
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook

# Dans un autre terminal
stripe trigger checkout.session.completed
```

---

### Problème 2 : Le Webhook Est Appelé Mais Échoue

**Symptôme** : Logs du webhook avec erreur

**Erreur possible 1** : `❌ No user_id in session metadata`

**Cause** : Le `user_id` n'est pas passé au checkout

**Vérification** :
```typescript
// Dans UpgradeDialog.tsx (ligne 45-52)
const { data, error } = await supabase.functions.invoke('create-checkout-session', {
  body: {
    priceId,
    mode,
    successUrl: `${window.location.origin}/profile?checkout=success`,
    cancelUrl: `${window.location.origin}/profile?checkout=canceled`,
  },
});
```

**Le `user_id` devrait être ajouté automatiquement par l'edge function** via :
```typescript
// create-checkout-session/index.ts
metadata: {
  user_id: user.id,
}
```

---

**Erreur possible 2** : `❌ Error upserting subscription`

**Cause** : Problème de permissions RLS ou contrainte DB

**Solution** :
```sql
-- Vérifier que la row existe
SELECT * FROM user_subscriptions WHERE user_id = 'YOUR_USER_ID';

-- Si elle n'existe pas, la créer manuellement
INSERT INTO user_subscriptions (user_id, plan, status, ai_minutes_purchased)
VALUES ('YOUR_USER_ID', 'premium', 'active', 0);
```

---

### Problème 3 : La DB Est Mise à Jour Mais l'UI Ne Rafraîchit Pas

**Symptôme** : `ai_minutes_purchased = 10` dans la DB, mais l'UI affiche 0

**Causes possibles** :
1. **Le cache React Query** n'est pas invalidé
2. **Le refetch** échoue silencieusement
3. **Race condition** : refetch avant que le webhook finisse

**Solutions** :

**A. Rafraîchir manuellement** : F5

**B. Vérifier que le refetch fonctionne** :
```typescript
// Dans Profile.tsx
console.log('Refetching subscription...');
refetchSubscription();
```

**C. Augmenter le délai** :
```typescript
// Si 2+3 secondes ne suffisent pas, augmenter à 5+5
setTimeout(() => {
  refetchSubscription();
  setTimeout(() => refetchSubscription(), 5000);
}, 5000);
```

---

### Problème 4 : Les Product IDs Ne Correspondent Pas

**Symptôme** : Le webhook ne reconnaît pas le produit acheté

**Logs attendus** :
```
ℹ️ No AI minutes in this purchase
```

**Vérification** :
```bash
# Récupérer le dernier paiement
stripe charges list --limit 1

# Regarder le product
stripe prices retrieve <price_id_from_payment>
```

**Comparer avec** `stripe-webhook/index.ts` lignes 21-25 :
```typescript
const AI_MINUTES_PRODUCTS: Record<string, number> = {
  'prod_TKZEb1hffKMjt9': 10,
  'prod_TKZEPlyD9oRz7p': 30,
  'prod_TKZE9LG0MXrH1i': 60,
};
```

Si les Product IDs ne correspondent pas, **les mettre à jour dans le webhook**.

---

## 🔧 Solution Temporaire : Mise à Jour Manuelle

Si le webhook ne fonctionne pas, vous pouvez mettre à jour manuellement :

```sql
-- Ajouter 10 minutes
UPDATE user_subscriptions
SET ai_minutes_purchased = ai_minutes_purchased + 10,
    updated_at = NOW()
WHERE user_id = 'YOUR_USER_ID';
```

Puis rafraîchir la page (F5).

---

## 📊 Flux Complet Résumé

```
1. Frontend : Clic "Acheter" (UpgradeDialog.tsx)
   ↓
2. Edge Function : create-checkout-session
   ↓ (crée session Stripe avec metadata.user_id)
3. Stripe : Paiement de l'utilisateur
   ↓ (payment succeeds)
4. Stripe → Webhook : checkout.session.completed
   ↓
5. Edge Function : stripe-webhook → handleOneTimePayment
   ↓ (identifie le Product ID → minutes)
6. Supabase : UPDATE user_subscriptions SET ai_minutes_purchased += 10
   ↓
7. Frontend : Retour sur /profile?checkout=success
   ↓ (après 2 secondes)
8. React Query : refetchSubscription()
   ↓
9. UI : Jauge mise à jour ✅
```

**Points de défaillance possibles** :
- ⚠️ Étape 4-5 : Webhook non configuré
- ⚠️ Étape 5-6 : Product ID inconnu
- ⚠️ Étape 7-9 : Race condition (résolu avec délais)

---

## 🚀 Checklist de Vérification

Avant de tester à nouveau :

- [ ] Webhook Stripe configuré et actif
- [ ] `STRIPE_WEBHOOK_SECRET` correct dans Supabase
- [ ] Product IDs correspondent entre webhook et Stripe
- [ ] La table `user_subscriptions` a la colonne `ai_minutes_purchased`
- [ ] L'utilisateur a une row dans `user_subscriptions`
- [ ] Profile.tsx a les délais de refetch (2s + 3s)

---

## 📞 Commandes de Débogage Rapide

```bash
# 1. Vérifier les webhooks Stripe
stripe webhook_endpoints list

# 2. Logs Supabase récents
npx supabase functions logs stripe-webhook --limit 20

# 3. Vérifier la DB
npx supabase db execute "SELECT user_id, plan, ai_minutes_purchased FROM user_subscriptions LIMIT 5;"

# 4. Tester le webhook localement
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook
stripe trigger checkout.session.completed
```

---

**Auteur:** Claude Code
**Date:** 2025-01-04
**Version:** 1.0
