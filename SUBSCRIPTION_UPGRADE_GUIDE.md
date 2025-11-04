# Guide Complet : Upgrade de Subscription Premium → Pro

**Date:** 2025-01-04
**Statut:** ✅ Déjà implémenté et fonctionnel

---

## 🎯 Question Initiale

> "Imaginons que j'ai payé l'abonnement à premium 9.90, comment j'upgrade à l'abonnement à 19.90 ? Est-ce que je paye un produit 10€ et ça change mon status / ma subscription et le mois prochain je paierai 19.90 ?"

---

## ✅ Réponse Courte

**Non, vous ne payez PAS un produit séparé de 10€.**

Quand vous passez de Premium (9,90€) à Pro (19,90€) :

1. **Stripe calcule automatiquement la différence au prorata** (proration)
2. **Vous êtes facturé immédiatement** pour la différence
3. **Votre subscription est mise à jour instantanément**
4. **Le mois prochain, vous paierez 19,90€**

**Exemple concret:**

Si vous êtes à 15 jours dans votre cycle de facturation Premium :
- Temps restant: 15 jours sur 30
- Crédit inutilisé Premium: ~4,95€ (50% de 9,90€)
- Coût Pro pour 15 jours: ~9,95€ (50% de 19,90€)
- **Montant facturé immédiatement: ~4,99€** (9,95€ - 4,95€)

---

## 🔄 Comment ça Fonctionne Techniquement ?

### Méthode 1: API Stripe Update Subscription (Utilisée actuellement ✅)

**C'est la méthode que votre code utilise !**

```typescript
// Fichier: supabase/functions/create-checkout-session/index.ts (lignes 127-169)

if (userSub?.stripe_subscription_id) {
  // User est en train d'upgrader sa subscription
  const currentSubscription = await stripe.subscriptions.retrieve(userSub.stripe_subscription_id);

  // Update avec proration automatique
  const updatedSubscription = await stripe.subscriptions.update(userSub.stripe_subscription_id, {
    items: [
      {
        id: currentSubscription.items.data[0].id,
        price: priceId, // Nouveau price (Pro)
      },
    ],
    proration_behavior: 'create_prorations', // 🔑 Clé du système !
    metadata: {
      user_id: user.id,
    },
  });

  // Retour immédiat sans redirection Stripe Checkout
  return { success: true, upgraded: true };
}
```

**Avantages de cette méthode:**
- ✅ Pas de redirection vers Stripe Checkout
- ✅ Upgrade instantané
- ✅ Proration automatique
- ✅ Meilleure UX (pas de nouvelle page)

---

### Méthode 2: Nouvelle Checkout Session (Alternative, non utilisée)

**Cette méthode n'est PAS utilisée dans votre code**, mais voici comment elle fonctionnerait :

```typescript
// Alternative (moins bonne UX)
const session = await stripe.checkout.sessions.create({
  customer: customerId,
  mode: 'subscription',
  line_items: [{ price: 'price_pro', quantity: 1 }],
  subscription_data: {
    proration_behavior: 'create_prorations',
  },
});
```

**Inconvénients:**
- ❌ Redirige vers Stripe
- ❌ Plus long
- ❌ UX moins fluide

---

## 📊 Flow Complet de l'Upgrade

```
┌─────────────────────────────────────────────────────────────────┐
│  1. USER CLIQUE SUR "PASSER À PRO"                             │
│     (Depuis UpgradeDialog ou PlanDetailsDialog)                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. APPEL À create-checkout-session EDGE FUNCTION              │
│     Body: { priceId: 'price_pro', mode: 'subscription' }       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. DÉTECTION SUBSCRIPTION EXISTANTE                           │
│     Code vérifie: userSub?.stripe_subscription_id ?            │
│     Résultat: OUI (car déjà Premium)                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. STRIPE API: subscriptions.update()                         │
│     - Récupération subscription actuelle                       │
│     - Changement du price: Premium → Pro                       │
│     - proration_behavior: 'create_prorations'                  │
│                                                                 │
│     STRIPE CALCULE AUTOMATIQUEMENT:                             │
│     • Crédit pour temps inutilisé Premium                      │
│     • Coût pour temps restant Pro                              │
│     • Différence à facturer                                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. STRIPE CHARGE LA DIFFÉRENCE IMMÉDIATEMENT                  │
│     - Utilise le payment method enregistré                     │
│     - Crée un invoice avec ligne de proration                  │
│     - Facture automatiquement                                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  6. WEBHOOK: customer.subscription.updated                     │
│     - Event envoyé à stripe-webhook edge function              │
│     - handleSubscriptionUpdated() est appelé                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  7. MISE À JOUR BASE DE DONNÉES                                │
│     user_subscriptions:                                         │
│       - plan: 'premium' → 'pro'                                │
│       - status: 'active'                                        │
│       - current_period_start/end: mis à jour                   │
│                                                                 │
│     profiles:                                                   │
│       - subscription: 'pro'                                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  8. RETOUR FRONTEND                                            │
│     - Toast de succès: "Abonnement mis à jour!"                │
│     - Rechargement de la page (window.location.reload())       │
│     - User voit immédiatement les nouvelles limites (30/30/30) │
└─────────────────────────────────────────────────────────────────┘
```

---

## 💰 Calcul de Proration - Exemples Concrets

### Exemple 1: Upgrade à Mi-Parcours (Jour 15/30)

**Situation:**
- Plan actuel: Premium (9,90€/mois)
- Nouveau plan: Pro (19,90€/mois)
- Date de souscription Premium: 1er janvier
- Date d'upgrade: 15 janvier
- Prochaine facturation prévue: 1er février

**Calcul Stripe:**

```
Crédit temps inutilisé Premium:
  = (15 jours restants / 30 jours) × 9,90€
  = 0,5 × 9,90€
  = 4,95€

Coût temps restant Pro:
  = (15 jours restants / 30 jours) × 19,90€
  = 0,5 × 19,90€
  = 9,95€

Montant à payer immédiatement:
  = Coût Pro - Crédit Premium
  = 9,95€ - 4,95€
  = 5,00€
```

**Facturation:**
- **Aujourd'hui (15 janvier)**: 5,00€
- **1er février**: 19,90€ (montant complet Pro)
- **1er mars**: 19,90€
- etc.

---

### Exemple 2: Upgrade en Début de Mois (Jour 3/30)

**Situation:**
- Plan actuel: Premium (9,90€/mois)
- Nouveau plan: Pro (19,90€/mois)
- Date de souscription Premium: 1er janvier
- Date d'upgrade: 3 janvier
- Prochaine facturation prévue: 1er février

**Calcul Stripe:**

```
Crédit temps inutilisé Premium:
  = (27 jours restants / 30 jours) × 9,90€
  = 0,9 × 9,90€
  = 8,91€

Coût temps restant Pro:
  = (27 jours restants / 30 jours) × 19,90€
  = 0,9 × 19,90€
  = 17,91€

Montant à payer immédiatement:
  = 17,91€ - 8,91€
  = 9,00€
```

**Facturation:**
- **Aujourd'hui (3 janvier)**: 9,00€
- **1er février**: 19,90€
- **1er mars**: 19,90€
- etc.

---

### Exemple 3: Upgrade en Fin de Mois (Jour 28/30)

**Situation:**
- Plan actuel: Premium (9,90€/mois)
- Nouveau plan: Pro (19,90€/mois)
- Date de souscription Premium: 1er janvier
- Date d'upgrade: 28 janvier
- Prochaine facturation prévue: 1er février

**Calcul Stripe:**

```
Crédit temps inutilisé Premium:
  = (2 jours restants / 30 jours) × 9,90€
  = 0,067 × 9,90€
  = 0,66€

Coût temps restant Pro:
  = (2 jours restants / 30 jours) × 19,90€
  = 0,067 × 19,90€
  = 1,33€

Montant à payer immédiatement:
  = 1,33€ - 0,66€
  = 0,67€
```

**Facturation:**
- **Aujourd'hui (28 janvier)**: 0,67€
- **1er février**: 19,90€
- **1er mars**: 19,90€
- etc.

---

## 🧪 Comment Tester l'Upgrade ?

### Test 1: Upgrade Premium → Pro avec Stripe Test Mode

1. **Créer un utilisateur de test avec plan Premium**

```sql
-- Vérifier que l'utilisateur a une subscription Premium active
SELECT * FROM user_subscriptions WHERE user_id = 'test-user-id';
-- Résultat attendu: plan = 'premium', status = 'active'
```

2. **Ouvrir la page Profile**
   - Aller sur `/profile`
   - Vérifier que "Plan Premium" est affiché

3. **Cliquer sur "Passer à Pro"**
   - Bouton dans `UpgradeDialog` ou `PlanSelectionCards`
   - Une loading s'affiche brièvement

4. **Vérifier que l'upgrade a réussi**
   - Toast de succès: "Abonnement mis à jour!"
   - Page se recharge automatiquement
   - Badge "Pro" s'affiche

5. **Vérifier dans Stripe Dashboard**
   - Aller sur https://dashboard.stripe.com/test/subscriptions
   - Rechercher le customer
   - Voir l'invoice de proration créé
   - Vérifier le montant

6. **Vérifier dans Supabase**

```sql
SELECT * FROM user_subscriptions WHERE user_id = 'test-user-id';
-- plan devrait être 'pro'
-- status devrait être 'active'

SELECT * FROM profiles WHERE user_id = 'test-user-id';
-- subscription devrait être 'pro'
```

---

### Test 2: Vérifier le Calcul de Proration

**Utiliser Stripe CLI pour simuler:**

```bash
# Installer Stripe CLI
npm install -g stripe

# Login
stripe login

# Créer une subscription de test
stripe subscriptions create \
  --customer cus_test123 \
  --price price_1SNu6P37eeTawvFRvh1JGgOC

# Attendre quelques jours (ou utiliser --proration-date)

# Upgrade la subscription
stripe subscriptions update sub_test123 \
  --items[0][price]=price_1SNu6N37eeTawvFR0CRbzo7F \
  --proration-behavior=create_prorations

# Vérifier l'invoice créé
stripe invoices list --limit=1
```

---

### Test 3: Preview Proration Avant Upgrade

**Ajouter cette fonctionnalité (optionnel) pour afficher le montant avant confirmation:**

```typescript
// Dans PlanDetailsDialog.tsx
const [prorationPreview, setProrationPreview] = useState<number | null>(null);

const handlePreviewUpgrade = async () => {
  const { data, error } = await supabase.functions.invoke('preview-proration', {
    body: { newPriceId: planDetails.priceId }
  });

  if (data?.prorationAmount) {
    setProrationPreview(data.prorationAmount);
  }
};

// Afficher dans l'UI
{prorationPreview !== null && (
  <p className="text-sm">
    Montant à payer aujourd'hui : <strong>{(prorationPreview / 100).toFixed(2)}€</strong>
  </p>
)}
```

**Créer l'Edge Function `preview-proration`:**

```typescript
// supabase/functions/preview-proration/index.ts
const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
  customer: customerId,
  subscription: subscriptionId,
  subscription_items: [
    {
      id: currentSubscription.items.data[0].id,
      price: newPriceId,
    },
  ],
  subscription_proration_behavior: 'create_prorations',
});

return {
  prorationAmount: upcomingInvoice.amount_due,
  prorationDetails: upcomingInvoice.lines.data,
};
```

---

## 🔐 Sécurité et Bonnes Pratiques

### 1. Vérifier l'Authentification

✅ **Déjà implémenté:**

```typescript
// create-checkout-session/index.ts ligne 37-47
const authHeader = req.headers.get('Authorization');
if (!authHeader) throw new Error('Missing authorization header');

const token = authHeader.replace('Bearer ', '');
const { data: { user }, error: authError } = await supabase.auth.getUser(token);

if (authError || !user) throw new Error('Unauthorized');
```

---

### 2. Empêcher les Downgrades Non Autorisés

**Ajouter cette vérification (optionnel):**

```typescript
// Empêcher downgrade Pro → Premium pendant la période en cours
const PLAN_HIERARCHY = { basic: 1, premium: 2, pro: 3 };

const currentPlanLevel = PLAN_HIERARCHY[currentPlan];
const newPlanLevel = PLAN_HIERARCHY[newPlan];

if (newPlanLevel < currentPlanLevel) {
  throw new Error('Les downgrades ne sont pas autorisés en milieu de période');
}
```

---

### 3. Gérer les Erreurs de Paiement

✅ **Déjà géré par le webhook:**

```typescript
// stripe-webhook/index.ts ligne 319-350
case 'invoice.payment_failed': {
  await supabase
    .from('user_subscriptions')
    .update({ status: 'past_due' })
    .eq('user_id', userSub.user_id);
}
```

---

## 📋 Checklist Complète pour l'Upgrade

### Avant l'Upgrade

- [ ] User a un plan Premium actif
- [ ] User a un payment method valide enregistré
- [ ] `user_subscriptions.stripe_customer_id` existe
- [ ] `user_subscriptions.stripe_subscription_id` existe
- [ ] `user_subscriptions.status` = `'active'`

### Pendant l'Upgrade

- [ ] `create-checkout-session` détecte la subscription existante
- [ ] `stripe.subscriptions.update()` est appelé
- [ ] `proration_behavior` = `'create_prorations'`
- [ ] Stripe charge le payment method
- [ ] Pas d'erreur de paiement

### Après l'Upgrade

- [ ] Webhook `customer.subscription.updated` reçu
- [ ] `user_subscriptions.plan` = `'pro'`
- [ ] `profiles.subscription` = `'pro'`
- [ ] `user_subscriptions.status` = `'active'`
- [ ] UI affiche "Pro" badge
- [ ] Nouvelles limites disponibles (30/30/30)

---

## 🐛 Dépannage

### Problème 1: "Failed to upgrade subscription"

**Causes possibles:**
1. Payment method expiré ou invalide
2. Insufficient funds
3. 3D Secure requis

**Solution:**
```typescript
// Vérifier le payment method
const paymentMethods = await stripe.customers.listPaymentMethods(customerId);
console.log('Payment methods:', paymentMethods.data);
```

---

### Problème 2: Webhook ne se déclenche pas

**Causes possibles:**
1. Webhook secret incorrect
2. Endpoint non accessible
3. Event type non écouté

**Solution:**
```bash
# Tester localement avec Stripe CLI
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook

# Trigger un événement de test
stripe trigger customer.subscription.updated
```

---

### Problème 3: DB pas mise à jour après upgrade

**Causes possibles:**
1. Webhook a échoué silencieusement
2. `user_id` introuvable
3. RLS policy bloque l'update

**Solution:**
```sql
-- Vérifier les logs Supabase
-- Dashboard → Functions → stripe-webhook → Logs

-- Vérifier RLS
SELECT * FROM user_subscriptions WHERE stripe_subscription_id = 'sub_xxx';

-- Update manuel si nécessaire (admin uniquement)
UPDATE user_subscriptions
SET plan = 'pro', status = 'active'
WHERE user_id = 'user-id';
```

---

## 📊 Monitoring et Analytics

### Événements à Tracker

```typescript
// Ajouter analytics dans create-checkout-session
if (upgraded) {
  // Google Analytics, Mixpanel, etc.
  analytics.track('Subscription Upgraded', {
    user_id: user.id,
    from_plan: currentPlan,
    to_plan: newPlan,
    proration_amount: /* calculer */,
  });
}
```

### Métriques Importantes

- **Taux d'upgrade Premium → Pro**: `(Upgrades / Total Premium users) × 100`
- **Montant moyen de proration**: Moyenne des montants facturés
- **Temps moyen avant upgrade**: Délai entre souscription Premium et upgrade Pro
- **Taux d'échec de paiement**: `(Failed payments / Total upgrade attempts) × 100`

---

## 🚀 Améliorations Futures

### 1. Preview du Montant de Proration

**Afficher le montant exact avant confirmation:**

```typescript
const { data } = await supabase.functions.invoke('preview-proration', {
  body: { targetPlan: 'pro' }
});

// Afficher: "Vous paierez 5,23€ aujourd'hui, puis 19,90€ le 1er février"
```

### 2. Offrir un Downgrade Planifié

**Permettre de downgrader à la fin de la période:**

```typescript
await stripe.subscriptions.update(subscriptionId, {
  cancel_at_period_end: false,
  items: [{ price: newPriceId }],
  proration_behavior: 'none', // Pas de proration
  billing_cycle_anchor: 'unchanged',
});
```

### 3. Notifications par Email

**Envoyer un email de confirmation:**

```typescript
await sendEmail({
  to: user.email,
  subject: 'Votre abonnement a été mis à niveau !',
  body: `
    Bonjour,

    Votre abonnement Savistas AI-Cademy est maintenant Pro !

    Nouvelles limites:
    - 30 cours par mois
    - 30 exercices par mois
    - 30 fiches de révision par mois

    Montant facturé aujourd'hui: 5,00€
    Prochain paiement: 19,90€ le 1er février
  `,
});
```

---

## ✅ Conclusion

**Votre système d'upgrade est déjà parfaitement implémenté !**

### Récapitulatif

1. ✅ **Détection automatique** de subscription existante
2. ✅ **Proration automatique** via Stripe API
3. ✅ **Facturation immédiate** de la différence
4. ✅ **Webhook** met à jour la DB automatiquement
5. ✅ **UX fluide** sans redirection

### Ce qui se passe exactement

```
Premium (9,90€) → Pro (19,90€)

Jour 1:  Souscription Premium → 9,90€ facturés
Jour 15: Upgrade vers Pro → ~5€ facturés (proration)
Jour 31: Renouvellement Pro → 19,90€ facturés
Jour 61: Renouvellement Pro → 19,90€ facturés
```

**Aucune configuration supplémentaire nécessaire !** 🎉

---

**Auteur:** Claude Code
**Date:** 2025-01-04
**Version:** 1.0
