# Implémentation du Système de Subscription & Pricing

## 📋 Vue d'ensemble

Ce document détaille l'implémentation complète du système de gestion des abonnements avec Stripe pour Savistas AI-Cademy.

### Fonctionnalités

- ✅ 3 plans d'abonnement (Basic gratuit, Premium 9.90€, Pro 19.90€)
- ✅ Limites mensuelles par plan (cours, exercices, fiches, minutes IA)
- ✅ Achat de minutes IA additionnelles (10min, 30min, 60min)
- ✅ Synchronisation automatique via webhooks Stripe
- ✅ Réinitialisation mensuelle basée sur la date d'anniversaire d'abonnement
- ✅ Gestion des downgrades/annulations
- ✅ Minutes IA achetées: accumulation sans expiration

## 🗃️ Architecture Base de Données

### Tables Créées

#### 1. `user_subscriptions`
Stocke les informations d'abonnement synchronisées avec Stripe.

```sql
- id (uuid, PK)
- user_id (uuid, unique) → auth.users
- stripe_customer_id (text)
- stripe_subscription_id (text)
- plan (text) → 'basic' | 'premium' | 'pro'
- status (text) → 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing'
- current_period_start (timestamptz)
- current_period_end (timestamptz)
- cancel_at_period_end (boolean)
- canceled_at (timestamptz)
- ai_minutes_purchased (integer) → Minutes achetées cumulées
- created_at, updated_at (timestamptz)
```

#### 2. `monthly_usage`
Suit l'utilisation mensuelle des ressources par période de facturation.

```sql
- id (uuid, PK)
- user_id (uuid) → auth.users
- period_start (date)
- period_end (date)
- courses_created (integer)
- exercises_created (integer)
- fiches_created (integer)
- ai_minutes_used (integer)
- created_at, updated_at (timestamptz)
- UNIQUE(user_id, period_start)
```

### Fonctions PostgreSQL

#### `get_or_create_usage_period(p_user_id uuid)`
Récupère ou crée la période d'usage courante basée sur la date d'anniversaire d'abonnement.

#### `increment_usage(p_user_id uuid, p_resource_type text, p_amount integer)`
Incrémente un compteur d'usage pour un type de ressource.

#### `get_usage_limits(p_user_id uuid)`
Retourne les limites d'usage basées sur le plan de l'utilisateur.

#### `can_create_resource(p_user_id uuid, p_resource_type text)`
Vérifie si un utilisateur peut créer une ressource (retourne allowed, current, limit, remaining).

## ⚡ Edge Functions

### 1. `stripe-webhook`
**URL**: `/functions/v1/stripe-webhook`

**Événements gérés**:
- `checkout.session.completed` → Nouvel abonnement ou achat minutes
- `customer.subscription.updated` → Changement de plan, renouvellement
- `customer.subscription.deleted` → Annulation
- `invoice.payment_succeeded` → Renouvellement réussi
- `invoice.payment_failed` → Paiement échoué

**Configuration requise**:
- `STRIPE_SECRET_KEY`: Clé secrète Stripe
- `STRIPE_WEBHOOK_SECRET`: Secret du webhook
- `SUPABASE_URL`: URL Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Clé service role Supabase

### 2. `create-checkout-session`
**URL**: `/functions/v1/create-checkout-session`

Crée une session Stripe Checkout pour upgrades et achats de minutes.

**Paramètres**:
```json
{
  "priceId": "price_xxx",
  "mode": "subscription" | "payment",
  "successUrl": "optional",
  "cancelUrl": "optional"
}
```

**Retour**:
```json
{
  "checkoutUrl": "https://checkout.stripe.com/...",
  "sessionId": "cs_xxx"
}
```

### 3. `check-usage-limits`
**URL**: `/functions/v1/check-usage-limits`

Vérifie les limites d'usage en temps réel.

**Paramètres**:
```json
{
  "resourceType": "course" | "exercise" | "fiche" | "ai_minutes"
}
```

**Retour**:
```json
{
  "allowed": true,
  "current": 5,
  "limit": 10,
  "remaining": 5
}
```

### 4. `reset-usage-periods`
**URL**: `/functions/v1/reset-usage-periods`

Edge Function à lancer périodiquement (cron) pour:
- Détecter les abonnements expirés
- Downgrader les abonnements annulés vers basic
- Renouveler les périodes d'abonnement

**Fréquence recommandée**: Toutes les heures ou quotidiennement

## 🎨 Composants Frontend

### Hooks

#### `useSubscription()`
Récupère les informations d'abonnement et limites.

```typescript
const { subscription, limits, isLoading, refetch } = useSubscription();

// subscription: UserSubscription | null
// limits: { courses, exercises, fiches, aiMinutes, maxDaysPerCourse }
```

#### `useUsageLimits()`
Récupère l'usage actuel et vérifie les limites.

```typescript
const { usage, remaining, canCreate, getLimitInfo, refetch } = useUsageLimits();

// usage: { courses_created, exercises_created, fiches_created, ai_minutes_used }
// remaining: { courses, exercises, fiches, aiMinutes }
// canCreate: (type) => boolean
// getLimitInfo: (type) => { current, limit, remaining, canCreate }
```

### Composants

#### `<SubscriptionCard />`
Affiche les informations d'abonnement dans la page Profile:
- Plan actuel avec badge
- Date de renouvellement
- Barres de progression d'usage
- Boutons upgrade/achat minutes

**Utilisation**:
```tsx
import { SubscriptionCard } from '@/components/subscription/SubscriptionCard';

<SubscriptionCard />
```

#### `<UpgradeDialog />`
Modale pour upgrader le plan ou acheter des minutes IA.

**Props**:
```tsx
interface UpgradeDialogProps {
  open: boolean;
  onClose: () => void;
  currentPlan: 'basic' | 'premium' | 'pro';
}
```

#### `<LimitReachedDialog />`
Modale affichée quand une limite est atteinte.

**Props**:
```tsx
interface LimitReachedDialogProps {
  open: boolean;
  onClose: () => void;
  resourceType: 'course' | 'exercise' | 'fiche' | 'ai_minutes';
  currentPlan: 'basic' | 'premium' | 'pro';
  current: number;
  limit: number;
}
```

### Service

#### `usageService.ts`

```typescript
import { incrementUsage, checkResourceLimit } from '@/services/usageService';

// Vérifier avant création
const limitInfo = await checkResourceLimit(userId, 'course');
if (!limitInfo.allowed) {
  // Afficher LimitReachedDialog
}

// Incrémenter après création réussie
await incrementUsage(userId, 'course', 1);
```

## 📦 Configuration Stripe

### 1. Produits et Prix

Les produits suivants doivent exister dans Stripe:

**Abonnements**:
- Plan personnel premium: `prod_TKZEuhKCVXME7l` → `price_1SNu6P37eeTawvFRvh1JGgOC` (9.90€/mois)
- Plan personnel pro: `prod_TKZEcbBNDNMCmR` → `price_1SNu6N37eeTawvFR0CRbzo7F` (19.90€/mois)

**Minutes IA** (one-time):
- Avatar IA - 10min: `prod_TKZEb1hffKMjt9` → `price_1SNu6D37eeTawvFRAVwbpsol` (5€)
- Avatar IA - 30min: `prod_TKZEPlyD9oRz7p` → `price_1SNu6B37eeTawvFRjJ20hc7w` (15€)
- Avatar IA - 60min: `prod_TKZE9LG0MXrH1i` → `price_1SNu5g37eeTawvFRdsQ1vIYp` (20€)

### 2. Webhook Stripe

**Configurer l'endpoint**:
- URL: `https://[PROJECT_REF].supabase.co/functions/v1/stripe-webhook`
- Événements à écouter:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`

**Variables d'environnement nécessaires**:
```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3. Cron Job (Supabase Cron)

Configurer via Supabase Dashboard ou SQL:

```sql
SELECT cron.schedule(
  'reset-usage-periods',
  '0 * * * *', -- Toutes les heures
  $$
  SELECT
    net.http_post(
      url:='https://[PROJECT_REF].supabase.co/functions/v1/reset-usage-periods',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer [ANON_KEY]"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);
```

## 🚀 Déploiement

### 1. Appliquer les migrations

```bash
# Depuis le répertoire du projet
npx supabase db push
```

Cela appliquera automatiquement toutes les migrations dans `supabase/migrations/`:
- `20251030000001_create_user_subscriptions.sql`
- `20251030000002_create_monthly_usage.sql`
- `20251030000003_create_usage_functions.sql`

### 2. Déployer les Edge Functions

```bash
# Déployer stripe-webhook
npx supabase functions deploy stripe-webhook --no-verify-jwt

# Déployer create-checkout-session
npx supabase functions deploy create-checkout-session

# Déployer check-usage-limits
npx supabase functions deploy check-usage-limits

# Déployer reset-usage-periods
npx supabase functions deploy reset-usage-periods
```

### 3. Configurer les secrets

```bash
npx supabase secrets set STRIPE_SECRET_KEY=sk_live_...
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

### 4. Régénérer les types TypeScript

```bash
npx supabase gen types typescript --local > src/integrations/supabase/types.ts
```

## 📝 Intégration dans les Pages Existantes

### Exemple: Vérifier les limites avant création

```tsx
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useUsageLimits } from '@/hooks/useUsageLimits';
import { incrementUsage } from '@/services/usageService';
import { LimitReachedDialog } from '@/components/subscription/LimitReachedDialog';

function CreateCoursePage() {
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const { canCreate, getLimitInfo } = useUsageLimits();
  const [showLimitDialog, setShowLimitDialog] = useState(false);

  const handleCreateCourse = async () => {
    // 1. Vérifier la limite
    if (!canCreate('course')) {
      setShowLimitDialog(true);
      return;
    }

    try {
      // 2. Créer le cours
      const { data, error } = await supabase
        .from('courses')
        .insert({ /* ... */ })
        .select()
        .single();

      if (error) throw error;

      // 3. Incrémenter le compteur
      await incrementUsage(user.id, 'course', 1);

      toast({ title: 'Cours créé avec succès!' });
    } catch (error) {
      toast({ title: 'Erreur', variant: 'destructive' });
    }
  };

  const limitInfo = getLimitInfo('course');

  return (
    <>
      <button onClick={handleCreateCourse}>
        Créer un cours ({limitInfo.remaining} restants)
      </button>

      <LimitReachedDialog
        open={showLimitDialog}
        onClose={() => setShowLimitDialog(false)}
        resourceType="course"
        currentPlan={subscription?.plan || 'basic'}
        current={limitInfo.current}
        limit={limitInfo.limit}
      />
    </>
  );
}
```

## 🎯 Limites par Plan

| Feature | Basic (Gratuit) | Premium (9.90€) | Pro (19.90€) |
|---------|----------------|----------------|--------------|
| Cours/mois | 2 | 10 | 30 |
| Exercices/mois | 2 | 10 | 30 |
| Fiches/mois | 2 | 10 | 30 |
| Minutes IA | 3 (+ achats) | 0 (achats uniquement) | 0 (achats uniquement) |
| Jours max/cours | 10 | 10 | 10 |

**Notes**:
- Les limites se réinitialisent à la date d'anniversaire d'abonnement
- Les minutes IA achetées s'accumulent et n'expirent jamais
- En cas de downgrade, les ressources existantes restent accessibles mais pas de nouvelles créations

## 🔍 Testing

### Test manuel du flow complet

1. **Créer un utilisateur basic**:
   - Vérifier les limites: 2 cours, 2 exercices, 2 fiches, 3 min IA

2. **Upgrade vers Premium**:
   - Cliquer sur "Passer à Premium"
   - Compléter le checkout Stripe (utiliser carte test `4242 4242 4242 4242`)
   - Vérifier webhook reçu et DB mise à jour
   - Vérifier nouvelles limites: 10/10/10/0

3. **Acheter des minutes IA**:
   - Cliquer sur "Acheter des minutes IA"
   - Acheter pack 30min
   - Vérifier `ai_minutes_purchased` = 30

4. **Créer des ressources**:
   - Créer des cours jusqu'à atteindre la limite
   - Vérifier que LimitReachedDialog apparaît

5. **Simuler renouvellement**:
   - Appeler manuellement `reset-usage-periods`
   - Vérifier que les compteurs sont réinitialisés
   - Vérifier que `ai_minutes_purchased` reste inchangé

## ⚠️ Notes Importantes

1. **Sécurité**: Toutes les vérifications de limites DOIVENT être faites côté serveur (Edge Functions + PostgreSQL functions)

2. **RLS Policies**: Les tables `user_subscriptions` et `monthly_usage` ont des policies RLS configurées

3. **Transactions Stripe**: Le webhook doit être configuré avec le bon secret pour valider les signatures

4. **Cron Job**: Essentiel pour gérer les renouvellements et downgrades automatiques

5. **Error Handling**: Toujours gérer les cas où:
   - L'utilisateur n'a pas de subscription (créer basic par défaut)
   - Les webhooks échouent (retry logic dans Stripe)
   - Les limites sont dépassées (afficher dialog)

## 📚 Ressources

- [Documentation Stripe Subscriptions](https://stripe.com/docs/billing/subscriptions/overview)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase Cron](https://supabase.com/docs/guides/database/extensions/pg_cron)

## 🐛 Troubleshooting

### Les webhooks ne sont pas reçus
- Vérifier que l'URL du webhook est correcte dans Stripe Dashboard
- Vérifier que `STRIPE_WEBHOOK_SECRET` est configuré
- Consulter les logs: `npx supabase functions logs stripe-webhook`

### Les limites ne se réinitialisent pas
- Vérifier que le cron job est actif
- Tester manuellement: `curl -X POST https://[PROJECT].supabase.co/functions/v1/reset-usage-periods`
- Vérifier les logs de la fonction

### L'utilisateur ne peut pas créer de ressources
- Vérifier dans `monthly_usage` le compteur actuel
- Vérifier dans `user_subscriptions` le plan et les limites
- Appeler `can_create_resource` manuellement pour debug

---

**Date de création**: 30 Octobre 2025
**Version**: 1.0.0
**Auteur**: Claude Code


------------------------


  🚀 Prochaines Étapes (À Faire Manuellement)

  1. Appliquer les migrations

  npx supabase db push

  2. Déployer les Edge Functions

  npx supabase functions deploy stripe-webhook --no-verify-jwt
  npx supabase functions deploy create-checkout-session
  npx supabase functions deploy check-usage-limits
  npx supabase functions deploy reset-usage-periods

  3. Configurer les secrets Supabase

  npx supabase secrets set STRIPE_SECRET_KEY=sk_live_...
  npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...

  4. Configurer le webhook Stripe

  - Aller sur https://dashboard.stripe.com/webhooks
  - Créer un nouveau webhook endpoint
  - URL: https://vvmkbpkoccxpmfpxhacv.supabase.co/functions/v1/stripe-webhook
  - Événements à écouter:
    - checkout.session.completed
    - customer.subscription.updated
    - customer.subscription.deleted
    - invoice.payment_succeeded
    - invoice.payment_failed
  - Copier le "Signing secret" (whsec_...) et le configurer dans les secrets

  5. Régénérer les types TypeScript

  npx supabase gen types typescript --local > src/integrations/supabase/types.ts

  6. Intégrer dans les pages existantes

  Tu dois maintenant intégrer la vérification des limites dans:
  - UploadCourse.tsx (création cours) - À faire
  - Fiches de révision (création fiches) - À faire
  - Exercises (création exercises) - À faire
  - Avatar IA (conversations) - Déjà existant via useConversationTimeLimit, à adapter

  Exemple d'intégration (pattern à suivre):
  import { useUsageLimits } from '@/hooks/useUsageLimits';
  import { useSubscription } from '@/hooks/useSubscription';
  import { incrementUsage } from '@/services/usageService';
  import { LimitReachedDialog } from '@/components/subscription/LimitReachedDialog';

  // Dans le composant
  const { canCreate, getLimitInfo } = useUsageLimits();
  const { subscription } = useSubscription();
  const [showLimitDialog, setShowLimitDialog] = useState(false);

  // Avant création
  if (!canCreate('course')) {
    setShowLimitDialog(true);
    return;
  }

  // Après création réussie
  await incrementUsage(user.id, 'course', 1);

  7. Ajouter le SubscriptionCard dans Profile.tsx

  import { SubscriptionCard } from '@/components/subscription/SubscriptionCard';

  // Dans la page Profile
  <SubscriptionCard />

  8. Configurer le Cron Job

  Via Supabase Dashboard ou SQL:
  SELECT cron.schedule(
    'reset-usage-periods',
    '0 * * * *', -- Toutes les heures
    $$
    SELECT
      net.http_post(
        url:='https://vvmkbpkoccxpmfpxhacv.supabase.co/functions/v1/reset-usage-periods',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer [ANON_KEY]"}'::jsonb,
        body:='{}'::jsonb
      ) as request_id;
    $$
  );

  📊 Résumé des Limites Implémentées

  | Feature         | Basic      | Premium    | Pro        |
  |-----------------|------------|------------|------------|
  | Cours/mois      | 2          | 10         | 30         |
  | Exercices/mois  | 2          | 10         | 30         |
  | Fiches/mois     | 2          | 10         | 30         |
  | Minutes IA      | 3 + achats | 0 + achats | 0 + achats |
  | Jours max/cours | 10         | 10         | 10         |