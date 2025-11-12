# Implémentation Complète des Transitions de Plans

**Date:** 2025-01-04
**Objectif:** Permettre toutes les transitions entre les 3 plans (Basic, Premium, Pro) avec affichage des 3 plans et boutons adaptés

---

## ✅ Modifications Effectuées

### 1. **PlanSelectionCards.tsx** - Affichage et logique des plans

#### A. Correction des données PLANS (lignes 13-62)
```typescript
const PLANS = [
  {
    id: 'basic',
    name: 'Basique',
    price: 'Gratuit',
    features: [
      '2 cours par mois',           // ✅ Corrigé de 3 → 2
      '2 exercices par mois',       // ✅ Corrigé de 3 → 2
      '2 fiches de révision par mois', // ✅ Corrigé de 3 → 2
      '3 minutes Avatar IA par mois',  // ✅ Ajouté
      '10 jours max par cours',        // ✅ Ajouté
    ],
  },
  {
    id: 'premium',
    features: [
      '10 cours par mois',
      '10 exercices par mois',
      '10 fiches de révision par mois',
      '0 minutes Avatar IA incluses',     // ✅ Ajouté
      'Achats de minutes IA disponibles', // ✅ Conservé
      '10 jours max par cours',           // ✅ Conservé
    ],
  },
  {
    id: 'pro',
    features: [
      '30 cours par mois',
      '30 exercices par mois',
      '30 fiches de révision par mois',
      '0 minutes Avatar IA incluses',     // ✅ Ajouté
      'Achats de minutes IA disponibles', // ✅ Conservé
      '10 jours max par cours',           // ✅ Conservé
      'Support prioritaire',              // ✅ Conservé
    ],
  },
];
```

#### B. Affichage des 3 plans (ligne 82)
**Avant:**
```typescript
const availablePlans = PLANS.filter(plan => plan.id !== currentPlan);
```

**Après:**
```typescript
const availablePlans = PLANS; // Affiche tous les plans
```

#### C. Grille adaptée pour 3 colonnes (ligne 138)
**Avant:**
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
```

**Après:**
```typescript
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
```

#### D. Logique de boutons adaptés (lignes 84-126)
```typescript
const getButtonText = (planId: string) => {
  // Plan actuel
  if (planId === currentPlan) {
    return 'Plan actuel'; // ✅ Nouveau
  }

  // Downgrade vers Basic
  if (currentPlan !== 'basic' && planId === 'basic') {
    return 'Se désabonner';
  }

  // Upgrade depuis Basic
  if (currentPlan === 'basic' && planId !== 'basic') {
    return 'Souscrire';
  }

  // Upgrade Premium → Pro
  if (currentPlan === 'premium' && planId === 'pro') {
    return 'Passer à Pro'; // ✅ Nouveau
  }

  // Downgrade Pro → Premium
  if (currentPlan === 'pro' && planId === 'premium') {
    return 'Passer à Premium'; // ✅ Nouveau
  }

  return 'Choisir';
};
```

#### E. Bouton désactivé pour plan actuel (ligne 187)
```typescript
<Button
  onClick={() => handlePlanClick(plan.id)}
  disabled={plan.id === currentPlan} // ✅ Nouveau
  variant={plan.id === 'basic' && currentPlan !== 'basic' ? "destructive" : "default"}
  className={`w-full ${plan.id !== 'basic' && plan.id !== currentPlan ? getButtonColor(plan.color) : ''}`}
>
  {getButtonText(plan.id)}
</Button>
```

#### F. Passage du currentPlan à PlanDetailsDialog (ligne 205)
```typescript
<PlanDetailsDialog
  open={!!selectedPlan}
  onClose={() => setSelectedPlan(null)}
  plan={selectedPlan}
  currentPlan={currentPlan} // ✅ Nouveau
/>
```

---

### 2. **PlanDetailsDialog.tsx** - Adaptation upgrade/downgrade

#### A. Ajout du prop currentPlan (ligne 20)
```typescript
interface PlanDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  plan: 'premium' | 'pro';
  currentPlan: 'basic' | 'premium' | 'pro'; // ✅ Nouveau
}
```

#### B. Détection upgrade/downgrade (lignes 70-73)
```typescript
// Determine if this is an upgrade or downgrade
const planOrder = { basic: 0, premium: 1, pro: 2 };
const isUpgrade = planOrder[plan] > planOrder[currentPlan];
const isDowngrade = planOrder[plan] < planOrder[currentPlan];
```

#### C. Correction des features PLAN_DETAILS (lignes 23-62)
Mêmes corrections que dans PlanSelectionCards pour cohérence.

#### D. Toast adapté selon upgrade/downgrade (lignes 99-107)
```typescript
if (data?.upgraded && data?.success) {
  if (isDowngrade) {
    toast.success('Plan modifié!', {
      description: 'Votre plan a été changé avec succès. Un crédit pour la période non utilisée a été appliqué à votre prochaine facture.',
    });
  } else {
    toast.success('Abonnement mis à jour!', {
      description: 'Votre abonnement a été amélioré avec succès. La différence de prix a été calculée au prorata.',
    });
  }
}
```

#### E. Titre adapté (lignes 132-140)
```typescript
<DialogTitle className="text-2xl">
  {isDowngrade ? `Passer au plan ${planDetails.name}` : `Plan ${planDetails.name}`}
</DialogTitle>
<DialogDescription>
  {isDowngrade
    ? `Modifier votre abonnement pour le plan ${planDetails.name}`
    : `Débloquez toutes les fonctionnalités avec le plan ${planDetails.name}`
  }
</DialogDescription>
```

#### F. Texte du bouton adapté (lignes 198-209)
```typescript
{isProcessing ? (
  <>
    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
    {isDowngrade ? 'Modification en cours...' : 'Redirection vers Stripe...'}
  </>
) : (
  <>
    <CreditCard className="w-4 h-4 mr-2" />
    {isDowngrade
      ? 'Confirmer le changement'
      : currentPlan === 'basic'
        ? 'Procéder au paiement'
        : 'Confirmer l\'amélioration'
    }
    <ArrowRight className="w-4 h-4 ml-2" />
  </>
)}
```

---

## 🔍 Vérification Backend (Déjà Prêt ✅)

### Edge Function: `create-checkout-session/index.ts`

**Lignes 127-169** : Gère automatiquement les upgrades ET downgrades

```typescript
if (userSub?.stripe_subscription_id) {
  // User is upgrading/downgrading their subscription
  const currentSubscription = await stripe.subscriptions.retrieve(userSub.stripe_subscription_id);

  const updatedSubscription = await stripe.subscriptions.update(userSub.stripe_subscription_id, {
    items: [
      {
        id: currentSubscription.items.data[0].id,
        price: priceId, // Nouveau priceId (Premium ou Pro)
      },
    ],
    proration_behavior: 'create_prorations', // ✅ Gère crédit ET débit automatiquement
    metadata: {
      user_id: user.id,
    },
  });

  return new Response(
    JSON.stringify({
      success: true,
      upgraded: true,
      subscriptionId: updatedSubscription.id,
      message: 'Subscription upgraded successfully',
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
  );
}
```

**Fonctionnement pour Pro → Premium** :
1. Stripe calcule le temps Pro non utilisé → Crédit (~10€ pour 15 jours restants)
2. Stripe calcule le temps Premium à payer → Débit (~5€ pour 15 jours)
3. **Résultat** : Crédit net de ~5€ appliqué à la prochaine facture
4. Changement **immédiat**, pas de redirection Stripe Checkout

---

### Webhook: `stripe-webhook/index.ts`

**Lignes 67-72** : Écoute `customer.subscription.updated`

```typescript
case 'customer.subscription.updated': {
  const subscription = event.data.object as Stripe.Subscription;
  console.log('🔄 Subscription updated:', subscription.id);
  await handleSubscriptionUpdated(supabase, subscription);
  break;
}
```

**Lignes 188-234** : Met à jour la DB automatiquement

```typescript
async function handleSubscriptionUpdated(supabase: any, subscription: Stripe.Subscription) {
  const productId = subscription.items.data[0].price.product as string;
  const plan = PRODUCT_TO_PLAN[productId] || 'basic';

  // Update subscription
  await supabase
    .from('user_subscriptions')
    .update({
      plan: plan, // ✅ Met à jour le plan (premium ou pro)
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      // ...
    })
    .eq('user_id', userSub.user_id);

  // Update profile
  await supabase
    .from('profiles')
    .update({ subscription: plan })
    .eq('user_id', userSub.user_id);
}
```

---

## ⚠️ Actions Manuelles à Vérifier

### 1. **Webhook Stripe Configuré**

Vérifiez que le webhook Stripe est bien configuré pour recevoir `customer.subscription.updated` :

```bash
# Lister les webhooks
stripe webhook_endpoints list

# Ou via Supabase CLI
npx supabase functions list
```

**URL du webhook** : `https://vvmkbpkoccxpmfpxhacv.supabase.co/functions/v1/stripe-webhook`

**Événements requis** :
- ✅ `checkout.session.completed`
- ✅ `customer.subscription.updated` ← **IMPORTANT pour les transitions**
- ✅ `customer.subscription.deleted`
- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`

### 2. **Variables d'Environnement Supabase**

Vérifiez dans le dashboard Supabase → Edge Functions → Secrets :

```
STRIPE_SECRET_KEY=sk_live_... (ou sk_test_...)
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_URL=https://vvmkbpkoccxpmfpxhacv.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### 3. **Product IDs Stripe**

Vérifiez que les Product IDs dans `stripe-webhook/index.ts` (lignes 15-18) correspondent à vos produits Stripe :

```typescript
const PRODUCT_TO_PLAN: Record<string, string> = {
  'prod_TKZEuhKCVXME7l': 'premium', // Plan personnel premium
  'prod_TKZEcbBNDNMCmR': 'pro',     // Plan personnel pro
};
```

**Comment vérifier** :
```bash
# Lister les produits Stripe
stripe products list

# Vérifier un produit spécifique
stripe products retrieve prod_TKZEuhKCVXME7l
```

### 4. **Price IDs Corrects**

Vérifiez dans `PlanDetailsDialog.tsx` et `create-checkout-session/index.ts` :

```typescript
const PRICE_IDS = {
  premium: 'price_1SNu6P37eeTawvFRvh1JGgOC',  // 9.90€/mois
  pro: 'price_1SNu6N37eeTawvFR0CRbzo7F',      // 19.90€/mois
};
```

**Vérifier les prix** :
```bash
stripe prices retrieve price_1SNu6P37eeTawvFRvh1JGgOC
stripe prices retrieve price_1SNu6N37eeTawvFR0CRbzo7F
```

---

## 🧪 Tests à Effectuer

### Scénario 1 : Basic → Premium (Upgrade avec checkout)

**Étapes** :
1. Connectez-vous avec un compte Basic
2. Sur la page Profile, cliquez sur "Souscrire" sur la card Premium
3. Vérifiez que la modale `PlanDetailsDialog` s'ouvre
4. Cliquez sur "Procéder au paiement"
5. **Attendu** : Redirection vers Stripe Checkout
6. Complétez le paiement (mode test)
7. **Attendu** : Retour sur `/profile?checkout=success`
8. **Vérifiez DB** : `user_subscriptions.plan = 'premium'`

### Scénario 2 : Premium → Pro (Upgrade immédiat avec proration)

**Étapes** :
1. Connectez-vous avec un compte Premium
2. Cliquez sur "Passer à Pro" sur la card Pro
3. Vérifiez que la modale affiche "Plan Pro"
4. Cliquez sur "Confirmer l'amélioration"
5. **Attendu** : Toast "Abonnement mis à jour!" + rechargement
6. **Vérifiez DB** : `user_subscriptions.plan = 'pro'`
7. **Vérifiez Stripe** : La subscription a un nouveau priceId Pro
8. **Vérifiez Stripe Invoice** : Une invoice avec proration a été créée

### Scénario 3 : Pro → Premium (Downgrade avec crédit)

**Étapes** :
1. Connectez-vous avec un compte Pro
2. Cliquez sur "Passer à Premium" sur la card Premium
3. Vérifiez que la modale affiche "Passer au plan Premium"
4. Cliquez sur "Confirmer le changement"
5. **Attendu** : Toast "Plan modifié! ... Un crédit ... a été appliqué"
6. **Vérifiez DB** : `user_subscriptions.plan = 'premium'`
7. **Vérifiez Stripe** : La subscription a le priceId Premium
8. **Vérifiez Stripe Invoice** : Une invoice avec crédit négatif (proration)

### Scénario 4 : Premium → Basic (Annulation)

**Étapes** :
1. Connectez-vous avec un compte Premium
2. Cliquez sur "Se désabonner" sur la card Basique
3. Vérifiez que `UnsubscribeConfirmDialog` s'ouvre
4. Cliquez sur "Confirmer la résiliation"
5. **Attendu** : Toast "Abonnement annulé ... restera actif jusqu'à la fin de période"
6. **Vérifiez DB** : `user_subscriptions.cancel_at_period_end = true`
7. **Vérifiez Stripe** : La subscription a `cancel_at_period_end = true`
8. **À la fin de période** : DB bascule automatiquement à `plan = 'basic'`

### Scénario 5 : Affichage du plan actuel

**Étapes** :
1. Connectez-vous avec un compte Premium
2. Sur la page Profile, scrollez vers les cards de plan
3. **Vérifiez** :
   - ✅ 3 cards affichées (Basic, Premium, Pro)
   - ✅ Card Premium a le badge "Plan actuel"
   - ✅ Card Premium a le bouton "Plan actuel" désactivé
   - ✅ Card Basic a le bouton "Se désabonner"
   - ✅ Card Pro a le bouton "Passer à Pro"

---

## 📊 Matrice des Transitions

| De → Vers | Basic | Premium | Pro |
|-----------|-------|---------|-----|
| **Basic** | ✅ Plan actuel (disabled) | ✅ Souscrire → Checkout Stripe | ✅ Souscrire → Checkout Stripe |
| **Premium** | ✅ Se désabonner → Confirmation | ✅ Plan actuel (disabled) | ✅ Passer à Pro → Upgrade immédiat |
| **Pro** | ✅ Se désabonner → Confirmation | ✅ Passer à Premium → Downgrade immédiat | ✅ Plan actuel (disabled) |

**Légende** :
- **Checkout Stripe** : Redirection vers Stripe pour nouveau paiement
- **Upgrade immédiat** : Stripe proration, pas de redirection
- **Downgrade immédiat** : Stripe crédit, pas de redirection
- **Confirmation** : Modale d'annulation, active jusqu'à fin de période

---

## 🔧 Commandes de Debug

### Vérifier les logs Supabase (Edge Functions)
```bash
# Logs de create-checkout-session
npx supabase functions logs create-checkout-session

# Logs du webhook
npx supabase functions logs stripe-webhook
```

### Tester le webhook localement
```bash
# Démarrer le webhook local
npx supabase functions serve stripe-webhook

# Dans un autre terminal, écouter les events Stripe
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook

# Simuler un event
stripe trigger customer.subscription.updated
```

### Vérifier l'état d'une subscription Stripe
```bash
stripe subscriptions retrieve sub_1xxxxxxxxxxxxx
```

### Vérifier les invoices récentes
```bash
stripe invoices list --limit 10
```

---

## 🎯 Résumé

### ✅ Fonctionnalités Implémentées

1. **Affichage des 3 plans** avec le plan actuel visible et désactivé
2. **Boutons descriptifs** adaptés à chaque transition :
   - Plan actuel (désactivé)
   - Souscrire
   - Passer à Pro / Premium
   - Se désabonner
3. **Transitions complètes** :
   - Basic → Premium/Pro : Stripe Checkout
   - Premium ↔ Pro : Update immédiat avec proration
   - Premium/Pro → Basic : Annulation avec confirmation
4. **Messages adaptés** :
   - Toast différent pour upgrade/downgrade
   - Texte de bouton selon le contexte
   - Titres et descriptions personnalisés

### 🔄 Backend (Déjà Fonctionnel)

- ✅ `create-checkout-session` gère upgrades ET downgrades
- ✅ Proration automatique par Stripe
- ✅ Webhook met à jour la DB
- ✅ Pas de code backend à modifier

### ⚠️ À Vérifier Manuellement

1. Webhooks Stripe configurés avec `customer.subscription.updated`
2. Variables d'environnement correctes
3. Product IDs et Price IDs correspondent à Stripe
4. Tester tous les scénarios ci-dessus

---

**Auteur:** Claude Code
**Date:** 2025-01-04
**Version:** 1.0
