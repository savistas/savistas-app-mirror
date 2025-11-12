# Améliorations UX pour l'Achat de Minutes Avatar IA

## État Actuel de l'Implémentation

### Produits Stripe Disponibles

| Pack | Price ID | Prix | Type |
|------|----------|------|------|
| 10 minutes | `price_1SNu6D37eeTawvFRAVwbpsol` | 5€ | Paiement unique |
| 30 minutes | `price_1SNu6B37eeTawvFRjJ20hc7w` | 15€ | Paiement unique |
| 60 minutes | `price_1SNu5g37eeTawvFRdsQ1vIYp` | 20€ | Paiement unique |

**Caractéristiques:**
- Les minutes achetées **s'accumulent** et **n'expirent jamais**
- Disponible uniquement pour les plans **Premium** et **Pro**
- Les utilisateurs **Basic** ont 3 minutes incluses (non renouvelables sans upgrade)

---

## Points d'Accès Actuels

### 1. ✅ Page Profile (`/profile`)
**Composant:** `SubscriptionCard` (ligne 210-219)

```tsx
{(subscription.plan === 'premium' || subscription.plan === 'pro') && (
  <Button
    onClick={() => setShowUpgradeDialog(true)}
    variant="outline"
    className="w-full"
  >
    <Bot className="w-4 h-4 mr-2" />
    Acheter des minutes IA
  </Button>
)}
```

**État:** Fonctionne correctement

---

### 2. ✅ Dialog de Limite Atteinte
**Composant:** `LimitReachedDialog`

Quand l'utilisateur atteint sa limite de minutes IA, un dialog s'affiche avec:
- Message: "Vous avez utilisé toutes vos X minutes disponibles ce mois-ci"
- Bouton: "Acheter des minutes IA" → Ouvre `UpgradeDialog`

**État:** Fonctionne correctement

---

### 3. ✅ Dialog Temps Écoulé (Basic)
**Composant:** `TimeUpDialog`

Quand l'utilisateur Basic épuise ses 3 minutes gratuites:
- Message: "Vous avez utilisé vos 3 minutes gratuites"
- Bouton: "Passer au plan supérieur" → Redirige vers `/profile`

**État:** Fonctionne mais **ne mentionne pas** la possibilité d'acheter des packs de minutes après upgrade

---

## 🚀 Améliorations Proposées

### Amélioration 1: Indicateur de Minutes IA dans le Header

**Objectif:** Rendre le solde de minutes IA toujours visible pour les utilisateurs Premium/Pro

**Mockup:**
```
┌─────────────────────────────────────────────────┐
│  Logo    Accueil   Cours   📅    [🤖 12 min]   │
└─────────────────────────────────────────────────┘
```

**Implémentation:**

**Nouveau composant:** `src/components/AIMinutesIndicator.tsx`

```tsx
import { Bot, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useSubscription } from '@/hooks/useSubscription';
import { useUsageLimits } from '@/hooks/useUsageLimits';
import { useState } from 'react';
import { UpgradeDialog } from './subscription/UpgradeDialog';

export function AIMinutesIndicator() {
  const { subscription, limits } = useSubscription();
  const { remaining } = useUsageLimits();
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  // Only show for Premium and Pro users
  if (!subscription || subscription.plan === 'basic') {
    return null;
  }

  const minutesLeft = remaining?.aiMinutes || 0;

  // Color based on remaining minutes
  const getColor = () => {
    if (minutesLeft === 0) return 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200';
    if (minutesLeft < 5) return 'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200';
    return 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200';
  };

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={`gap-2 ${getColor()}`}
          >
            <Bot className="w-4 h-4" />
            <span className="font-medium">{minutesLeft} min</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-3">
            <div className="space-y-1">
              <h4 className="font-semibold text-sm">Minutes Avatar IA</h4>
              <p className="text-sm text-muted-foreground">
                Vous avez <strong>{minutesLeft} minutes</strong> disponibles pour discuter avec votre professeur virtuel.
              </p>
            </div>

            {subscription.ai_minutes_purchased > 0 && (
              <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded">
                💡 Vous avez acheté {subscription.ai_minutes_purchased} minutes qui ne s'expirent jamais
              </div>
            )}

            <Button
              onClick={() => setShowUpgradeDialog(true)}
              className="w-full"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Acheter plus de minutes
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <UpgradeDialog
        open={showUpgradeDialog}
        onClose={() => setShowUpgradeDialog(false)}
        currentPlan={subscription.plan}
      />
    </>
  );
}
```

**Intégration dans `BurgerMenu.tsx` ou Header:**

```tsx
import { AIMinutesIndicator } from './AIMinutesIndicator';

// Dans le header/menu
<div className="flex items-center gap-4">
  {/* Autres éléments */}
  <AIMinutesIndicator />
</div>
```

---

### Amélioration 2: Bouton d'Achat sur la Page Professeur Virtuel

**Objectif:** Permettre l'achat rapide de minutes directement depuis la page de conversation

**Fichier:** `src/pages/ProfesseurParticulierVirtuel.tsx`

**Ajout suggéré:**

```tsx
// En haut de la page, afficher le solde de minutes et un bouton d'achat
<div className="flex items-center justify-between mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
  <div className="flex items-center gap-3">
    <Bot className="w-5 h-5 text-blue-600" />
    <div>
      <p className="text-sm font-medium text-gray-900">
        Minutes restantes: <span className="text-blue-600">{remaining?.aiMinutes || 0} min</span>
      </p>
      {subscription?.ai_minutes_purchased > 0 && (
        <p className="text-xs text-gray-600">
          {subscription.ai_minutes_purchased} minutes achetées (ne s'expirent jamais)
        </p>
      )}
    </div>
  </div>

  {subscription?.plan !== 'basic' && (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setShowBuyMinutesDialog(true)}
      className="border-blue-300 hover:bg-blue-50"
    >
      <Plus className="w-4 h-4 mr-2" />
      Acheter
    </Button>
  )}
</div>
```

---

### Amélioration 3: Notification Proactive (< 5 minutes)

**Objectif:** Alerter l'utilisateur avant qu'il n'épuise ses minutes

**Nouveau composant:** `src/components/virtual-teacher/LowMinutesWarning.tsx`

```tsx
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Plus } from 'lucide-react';
import { useState } from 'react';
import { UpgradeDialog } from '../subscription/UpgradeDialog';
import { useSubscription } from '@/hooks/useSubscription';
import { useUsageLimits } from '@/hooks/useUsageLimits';

export function LowMinutesWarning() {
  const { subscription } = useSubscription();
  const { remaining } = useUsageLimits();
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const minutesLeft = remaining?.aiMinutes || 0;

  // Only show warning if:
  // - User is Premium or Pro
  // - Has less than 5 minutes left
  // - Has not dismissed the warning
  if (
    !subscription ||
    subscription.plan === 'basic' ||
    minutesLeft >= 5 ||
    minutesLeft === 0 ||
    dismissed
  ) {
    return null;
  }

  return (
    <>
      <Alert variant="default" className="border-orange-300 bg-orange-50 mb-4">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertTitle className="text-orange-900">
          Attention: Il vous reste seulement {minutesLeft} minute{minutesLeft > 1 ? 's' : ''}
        </AlertTitle>
        <AlertDescription className="text-orange-800 flex items-center justify-between">
          <span>
            Vous pourriez bientôt manquer de temps pour discuter avec votre professeur virtuel.
          </span>
          <div className="flex gap-2 ml-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDismissed(true)}
              className="text-orange-900"
            >
              Ignorer
            </Button>
            <Button
              size="sm"
              onClick={() => setShowUpgradeDialog(true)}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Acheter des minutes
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      <UpgradeDialog
        open={showUpgradeDialog}
        onClose={() => setShowUpgradeDialog(false)}
        currentPlan={subscription.plan}
      />
    </>
  );
}
```

**Intégration:**

```tsx
// Dans ProfesseurParticulierVirtuel.tsx
import { LowMinutesWarning } from '@/components/virtual-teacher/LowMinutesWarning';

// Au début de la conversation
<div>
  <LowMinutesWarning />
  {/* Reste du contenu */}
</div>
```

---

### Amélioration 4: Améliorer TimeUpDialog pour Basic

**Objectif:** Mentionner la possibilité d'acheter des minutes après upgrade

**Fichier:** `src/components/virtual-teacher/TimeUpDialog.tsx`

**Modification suggérée (lignes 59-76):**

```tsx
<ul className="space-y-2 text-sm text-gray-600">
  <li className="flex items-start gap-2">
    <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
    <span><strong>Achetez des packs de minutes IA</strong> (10, 30 ou 60 min) qui ne s'expirent jamais</span>
  </li>
  <li className="flex items-start gap-2">
    <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
    <span>Accès à tous les cours et exercices personnalisés (10 ou 30 par mois)</span>
  </li>
  <li className="flex items-start gap-2">
    <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
    <span>Suivi détaillé de votre progression</span>
  </li>
  <li className="flex items-start gap-2">
    <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
    <span>Support prioritaire</span>
  </li>
</ul>

{/* Ajout d'un encadré informatif sur les packs */}
<div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
  <p className="text-xs text-blue-800">
    💡 <strong>Astuce:</strong> Avec Premium ou Pro, vous pouvez acheter des packs de minutes IA
    (à partir de 5€) qui s'accumulent et ne s'expirent jamais!
  </p>
</div>
```

---

### Amélioration 5: Quick Buy Modal

**Objectif:** Modal rapide et épuré pour acheter des minutes en un clic

**Nouveau composant:** `src/components/subscription/QuickBuyMinutesDialog.tsx`

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Bot, Check, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface QuickBuyMinutesDialogProps {
  open: boolean;
  onClose: () => void;
}

const AI_PACKS = [
  {
    minutes: 10,
    price: 5,
    priceId: 'price_1SNu6D37eeTawvFRAVwbpsol',
    popular: false,
  },
  {
    minutes: 30,
    price: 15,
    priceId: 'price_1SNu6B37eeTawvFRjJ20hc7w',
    popular: true,
  },
  {
    minutes: 60,
    price: 20,
    priceId: 'price_1SNu5g37eeTawvFRdsQ1vIYp',
    popular: false,
    bestValue: true,
  },
];

export function QuickBuyMinutesDialog({ open, onClose }: QuickBuyMinutesDialogProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handlePurchase = async (priceId: string, packId: string) => {
    setLoading(packId);

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          priceId,
          mode: 'payment',
          successUrl: `${window.location.origin}/professeur-particulier-virtuel?purchase=success`,
          cancelUrl: `${window.location.origin}/professeur-particulier-virtuel?purchase=canceled`,
        },
      });

      if (error) throw error;

      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      toast.error(error.message || 'Erreur lors de la création de la session de paiement');
      setLoading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Bot className="w-6 h-6 text-orange-500" />
            Acheter des minutes Avatar IA
          </DialogTitle>
          <DialogDescription>
            Les minutes achetées s'accumulent et n'expirent jamais. Profitez de votre professeur virtuel sans limite!
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
          {AI_PACKS.map((pack) => (
            <Card
              key={pack.priceId}
              className={`p-4 relative ${
                pack.popular ? 'border-2 border-orange-500 shadow-lg' : 'border'
              }`}
            >
              {pack.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                  Populaire
                </div>
              )}
              {pack.bestValue && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                  Meilleur prix
                </div>
              )}

              <div className="text-center space-y-3 mt-2">
                <div className="text-3xl font-bold text-orange-600">
                  {pack.minutes} <span className="text-lg">min</span>
                </div>
                <div className="text-2xl font-bold">
                  {pack.price}€
                </div>
                <div className="text-xs text-muted-foreground">
                  {(pack.price / pack.minutes).toFixed(2)}€/min
                </div>

                <Button
                  onClick={() => handlePurchase(pack.priceId, pack.priceId)}
                  disabled={loading !== null}
                  className={`w-full ${
                    pack.popular
                      ? 'bg-orange-600 hover:bg-orange-700'
                      : pack.bestValue
                      ? 'bg-green-600 hover:bg-green-700'
                      : ''
                  }`}
                >
                  {loading === pack.priceId ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Chargement...
                    </>
                  ) : (
                    'Acheter'
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <ul className="space-y-1 text-xs text-blue-900">
            <li className="flex items-center gap-2">
              <Check className="w-3 h-3" />
              Les minutes ne s'expirent jamais
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-3 h-3" />
              Paiement sécurisé via Stripe
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-3 h-3" />
              Accès immédiat après paiement
            </li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 📊 Résumé des Points d'Accès Proposés

| # | Emplacement | État | Priorité | Complexité |
|---|-------------|------|----------|------------|
| 1 | **Header/Menu** (AIMinutesIndicator) | 🆕 Nouveau | ⭐⭐⭐ Haute | 🟢 Faible |
| 2 | **Page Professeur Virtuel** (Bouton en haut) | 🆕 Nouveau | ⭐⭐⭐ Haute | 🟢 Faible |
| 3 | **Notification Proactive** (< 5 min) | 🆕 Nouveau | ⭐⭐ Moyenne | 🟡 Moyenne |
| 4 | **TimeUpDialog** (Amélioration) | 🔄 Amélioration | ⭐ Faible | 🟢 Faible |
| 5 | **QuickBuyMinutesDialog** | 🆕 Nouveau | ⭐⭐ Moyenne | 🟡 Moyenne |
| 6 | **Profile** (SubscriptionCard) | ✅ Existe | - | - |
| 7 | **LimitReachedDialog** | ✅ Existe | - | - |

---

## 🎯 Recommandations Prioritaires

### Phase 1 (Impact Immédiat) ⚡
1. **AIMinutesIndicator dans le header** → Visibilité permanente
2. **Bouton d'achat sur la page Professeur Virtuel** → Achat au bon moment
3. **Améliorer TimeUpDialog** → Mieux informer les utilisateurs Basic

### Phase 2 (Optimisation)
4. **Notification proactive** → Éviter les interruptions
5. **QuickBuyMinutesDialog** → UX encore plus rapide (optionnel)

---

## 🧪 Tests à Effectuer

### Test 1: Achat de Pack 10 minutes (Premium)
- [ ] Se connecter avec un compte Premium
- [ ] Cliquer sur "Acheter des minutes IA" depuis le Profile
- [ ] Sélectionner le pack 10 minutes (5€)
- [ ] Compléter le paiement Stripe
- [ ] Vérifier que `user_subscriptions.ai_minutes_purchased` a augmenté de 10
- [ ] Vérifier que le solde affiché est correct

### Test 2: Notification Proactive
- [ ] Utiliser l'avatar IA jusqu'à avoir 4 minutes restantes
- [ ] Vérifier que la notification orange s'affiche
- [ ] Cliquer sur "Acheter des minutes" → Dialog s'ouvre
- [ ] Cliquer sur "Ignorer" → Notification disparaît

### Test 3: Basic User → Upgrade → Achat
- [ ] Se connecter avec un compte Basic
- [ ] Épuiser les 3 minutes gratuites
- [ ] TimeUpDialog s'affiche avec le nouveau message
- [ ] Cliquer sur "Passer au plan supérieur"
- [ ] S'abonner à Premium
- [ ] Acheter un pack de 30 minutes (15€)
- [ ] Vérifier que les 30 minutes sont disponibles

---

## 📝 Notes Techniques

### Stripe Webhook Events à Surveiller

Pour les achats de minutes IA (one-time payment):
```typescript
// Dans stripe-webhook/index.ts
case 'checkout.session.completed':
  if (session.mode === 'payment') {
    // Achat de pack de minutes IA
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);

    // Identifier le pack acheté
    const minutesPurchased = identifyAIPack(lineItems);

    // Mettre à jour user_subscriptions.ai_minutes_purchased
    await supabase
      .from('user_subscriptions')
      .update({
        ai_minutes_purchased: currentMinutes + minutesPurchased,
      })
      .eq('stripe_customer_id', session.customer);
  }
  break;
```

### Fonction Helper pour Identifier le Pack

```typescript
function identifyAIPack(lineItems: any): number {
  const priceId = lineItems.data[0]?.price?.id;

  const PACK_MINUTES = {
    'price_1SNu6D37eeTawvFRAVwbpsol': 10,
    'price_1SNu6B37eeTawvFRjJ20hc7w': 30,
    'price_1SNu5g37eeTawvFRdsQ1vIYp': 60,
  };

  return PACK_MINUTES[priceId] || 0;
}
```

---

## ✅ Checklist d'Implémentation

### Amélioration 1: AIMinutesIndicator
- [ ] Créer `src/components/AIMinutesIndicator.tsx`
- [ ] Ajouter les imports nécessaires (Popover, Button, etc.)
- [ ] Intégrer dans `BurgerMenu.tsx` ou Header
- [ ] Tester avec un compte Premium ayant 50 minutes
- [ ] Tester avec un compte Premium ayant 2 minutes (couleur orange)
- [ ] Tester avec un compte Premium ayant 0 minute (couleur rouge)

### Amélioration 2: Bouton Page Professeur Virtuel
- [ ] Modifier `src/pages/ProfesseurParticulierVirtuel.tsx`
- [ ] Ajouter le badge de minutes en haut
- [ ] Ajouter le bouton "Acheter"
- [ ] Connecter au UpgradeDialog existant
- [ ] Tester le flow complet

### Amélioration 3: Notification Proactive
- [ ] Créer `src/components/virtual-teacher/LowMinutesWarning.tsx`
- [ ] Intégrer dans la page Professeur Virtuel
- [ ] Tester avec 4 minutes restantes
- [ ] Tester le bouton "Ignorer"
- [ ] Tester le bouton "Acheter des minutes"

### Amélioration 4: TimeUpDialog
- [ ] Modifier `src/components/virtual-teacher/TimeUpDialog.tsx`
- [ ] Ajouter la mention des packs de minutes
- [ ] Ajouter l'encadré informatif
- [ ] Tester avec un compte Basic

### Amélioration 5: QuickBuyMinutesDialog (Optionnel)
- [ ] Créer `src/components/subscription/QuickBuyMinutesDialog.tsx`
- [ ] Implémenter la logique d'achat
- [ ] Ajouter les 3 cartes de packs
- [ ] Tester le flow complet
- [ ] Intégrer comme alternative à UpgradeDialog

---

**Date de création:** 2025-01-04
**Dernière mise à jour:** 2025-01-04
