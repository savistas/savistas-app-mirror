# Guide de Configuration Stripe pour B2C

## ⚠️ Problème Identifié

Le système de paiement Stripe pour les utilisateurs B2C (students) est **complètement implémenté dans le code** mais **non configuré** au niveau de Supabase et Stripe.

## 📋 Checklist de Configuration

### 1. Créer les Produits et Prix dans Stripe Dashboard

Connectez-vous à [Stripe Dashboard](https://dashboard.stripe.com) et créez :

#### **Plan Premium (9,90€/mois)**
- Product ID: `prod_TKZEuhKCVXME7l`
- Price ID: `price_1SNu6P37eeTawvFRvh1JGgOC`
- Type: Recurring (mensuel)
- Montant: 9,90€

#### **Plan Pro (19,90€/mois)**
- Product ID: `prod_TKZEcbBNDNMCmR`
- Price ID: `price_1SNu6N37eeTawvFR0CRbzo7F`
- Type: Recurring (mensuel)
- Montant: 19,90€

#### **Minutes IA - 10min (5€)**
- Product ID: `prod_TKZEb1hffKMjt9`
- Price ID: `price_1SNu6D37eeTawvFRAVwbpsol`
- Type: One-time payment
- Montant: 5€

#### **Minutes IA - 30min (15€)**
- Product ID: `prod_TKZEPlyD9oRz7p`
- Price ID: `price_1SNu6B37eeTawvFRjJ20hc7w`
- Type: One-time payment
- Montant: 15€

#### **Minutes IA - 60min (20€)**
- Product ID: `prod_TKZE9LG0MXrH1i`
- Price ID: `price_1SNu5g37eeTawvFRdsQ1vIYp`
- Type: One-time payment
- Montant: 20€

### 2. Configurer les Secrets Supabase

```bash
cd /Users/elliotestrade/Desktop/Documents/03.\ ESST-SOLUTIONS/Coding/savistas-ai-cademy-main

# Lier le projet Supabase (si pas déjà fait)
npx supabase link --project-ref vvmkbpkoccxpmfpxhacv

# Configurer la clé secrète Stripe
npx supabase secrets set STRIPE_SECRET_KEY=sk_live_VOTRE_CLE_STRIPE

# Configurer le secret du webhook
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_VOTRE_SECRET_WEBHOOK
```

**⚠️ Important** : Utilisez votre **clé secrète LIVE** (commence par `sk_live_`) et NON la clé de test.

### 3. Déployer les Edge Functions

```bash
# Déployer create-checkout-session
npx supabase functions deploy create-checkout-session

# Déployer stripe-webhook (sans vérification JWT car appelé par Stripe)
npx supabase functions deploy stripe-webhook --no-verify-jwt

# Déployer les autres fonctions de gestion
npx supabase functions deploy check-usage-limits
npx supabase functions deploy reset-usage-periods
```

### 4. Configurer le Webhook Stripe

1. Allez sur [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
2. Cliquez sur "Add endpoint"
3. URL du webhook :
   ```
   https://vvmkbpkoccxpmfpxhacv.supabase.co/functions/v1/stripe-webhook
   ```
4. Sélectionnez ces événements :
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

5. Copiez le **Signing secret** (commence par `whsec_`)
6. Configurez-le avec :
   ```bash
   npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_VOTRE_SECRET
   ```

### 5. Vérifier que les Produits Existent

Les Product IDs et Price IDs sont **hardcodés** dans le code. Vous devez :

**Option A** : Créer les produits avec les IDs exacts listés ci-dessus

**Option B** : Modifier les IDs dans le code pour correspondre à vos produits existants :

Fichiers à modifier :
- `src/components/subscription/PlanDetailsDialog.tsx` (lignes 28-29)
- `src/components/subscription/UpgradeDialog.tsx` (lignes 24-30)
- `supabase/functions/create-checkout-session/index.ts` (lignes 14-20)
- `supabase/functions/stripe-webhook/index.ts` (lignes 14-25)

### 6. Tester le Flow de Paiement

#### Test avec Carte de Test Stripe

1. Connectez-vous comme utilisateur B2C (student)
2. Allez dans Profile → Section "Mon Abonnement"
3. Cliquez sur "Passer à Premium" ou "Passer à Pro"
4. Utilisez la carte de test : `4242 4242 4242 4242`
   - Date d'expiration : N'importe quelle date future
   - CVC : N'importe quel 3 chiffres
   - Code postal : N'importe quel code

5. Complétez le paiement
6. Vérifiez que :
   - Le webhook est reçu dans Stripe Dashboard
   - L'abonnement est mis à jour dans `user_subscriptions`
   - Les limites sont augmentées (visible dans SubscriptionCard)

#### Test d'Achat de Minutes IA

1. Dans Profile, cliquez sur "Acheter des minutes IA"
2. Choisissez un pack (10min, 30min, ou 60min)
3. Payez avec carte de test
4. Vérifiez que `ai_minutes_purchased` est incrémenté

### 7. Configurer le Cron Job (Optionnel mais Recommandé)

Pour réinitialiser automatiquement les limites mensuelles :

```sql
-- Via Supabase SQL Editor
SELECT cron.schedule(
  'reset-usage-periods',
  '0 0 * * *', -- Tous les jours à minuit
  $$
  SELECT
    net.http_post(
      url:='https://vvmkbpkoccxpmfpxhacv.supabase.co/functions/v1/reset-usage-periods',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer VOTRE_ANON_KEY"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);
```

## 🧪 Tests de Diagnostic

### Vérifier que les secrets sont configurés

```bash
npx supabase secrets list
```

Devrait afficher :
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `EQUOS_SECRET_KEY`

### Tester la création de session checkout

```bash
# Via Supabase SQL Editor ou curl
curl -X POST https://vvmkbpkoccxpmfpxhacv.supabase.co/functions/v1/create-checkout-session \
  -H "Authorization: Bearer VOTRE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "priceId": "price_1SNu6P37eeTawvFRvh1JGgOC",
    "mode": "subscription"
  }'
```

Devrait retourner un `checkoutUrl` et un `sessionId`.

### Vérifier les logs des Edge Functions

```bash
npx supabase functions logs create-checkout-session
npx supabase functions logs stripe-webhook
```

## 🐛 Problèmes Courants

### 1. "Missing authorization header"
- L'utilisateur n'est pas connecté
- Le token JWT est invalide ou expiré

### 2. "Webhook signature verification failed"
- Le `STRIPE_WEBHOOK_SECRET` est incorrect
- Vérifiez dans Stripe Dashboard → Webhooks → Signing secret

### 3. "No such customer"
- Le `stripe_customer_id` dans la base de données est invalide
- Supprimez la ligne dans `user_subscriptions` et réessayez

### 4. "Product not found"
- Les Product IDs ou Price IDs sont incorrects
- Vérifiez dans Stripe Dashboard → Products

### 5. Webhook non reçu
- L'URL du webhook est incorrecte
- Le webhook n'a pas été configuré pour les bons événements
- Vérifiez les logs du webhook dans Stripe Dashboard

## 📊 État Actuel du Système

✅ **Code** : Complètement implémenté et fonctionnel
✅ **Base de données** : Migrations appliquées, tables créées
✅ **Frontend** : Composants UI prêts
❌ **Configuration Stripe** : Non configurée
❌ **Secrets Supabase** : Manquants (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`)
❌ **Webhook Stripe** : Non configuré
❌ **Produits Stripe** : Probablement non créés avec les bons IDs

## 🎯 Prochaines Étapes

1. **Urgent** : Configurer les secrets Stripe dans Supabase
2. **Urgent** : Créer/vérifier les produits dans Stripe Dashboard
3. **Urgent** : Configurer le webhook Stripe
4. **Important** : Tester le flow complet avec carte de test
5. **Optionnel** : Configurer le cron job pour reset automatique

## 📝 Notes

- Le système est conçu pour fonctionner en **mode production** (clés `sk_live_`)
- En développement, utilisez les clés de test (`sk_test_`) et la carte de test `4242 4242 4242 4242`
- Les minutes IA achetées **ne s'expirent jamais** et s'accumulent
- Les limites mensuelles se réinitialisent à la date d'anniversaire de l'abonnement
- Les organisations B2B ont des limites illimitées et ne passent pas par ce système
