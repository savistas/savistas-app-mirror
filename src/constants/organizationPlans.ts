/**
 * B2B Organization Seat-Based Pricing Configuration
 *
 * Single pricing model based on progressive tiers:
 * - 1-20 seats: €35/seat/month
 * - 21-50 seats: €32/seat/month
 * - 51-100 seats: €29/seat/month
 *
 * All B2B organizations share the same per-student limits:
 * - 30 exercises, 30 fiches, 60 AI minutes per month
 * - Unlimited course creation
 * - 10 days max per course
 *
 * Both monthly and yearly billing options available (yearly = monthly × 12)
 */

export type BillingPeriod = 'monthly' | 'yearly';

/**
 * Pricing tier configuration
 */
export interface PricingTier {
  minSeats: number;
  maxSeats: number;
  pricePerSeat: number; // Monthly price in euros
}

/**
 * Stripe product configuration for seat subscriptions
 */
export interface StripeProductConfig {
  monthly: {
    stripePriceId: string;
    stripeProductId: string;
  };
  yearly: {
    stripePriceId: string;
    stripeProductId: string;
  };
}

/**
 * Progressive pricing tiers
 * Each seat in a tier is charged at the tier's rate
 */
export const PRICING_TIERS: PricingTier[] = [
  { minSeats: 1, maxSeats: 20, pricePerSeat: 35 },
  { minSeats: 21, maxSeats: 50, pricePerSeat: 32 },
  { minSeats: 51, maxSeats: 100, pricePerSeat: 29 },
];

/**
 * Stripe product IDs for each tier
 * Maps tier index to Stripe products
 */
export const STRIPE_TIER_PRODUCTS: Record<number, StripeProductConfig> = {
  0: {
    // Tier 1-20 seats @ €35
    monthly: {
      stripePriceId: 'price_1SPt4237eeTawvFRmxg2xSQv',
      stripeProductId: 'prod_TMcFeLhPKrQqhe',
    },
    yearly: {
      stripePriceId: 'price_1SPt4437eeTawvFRlhZCxm5m',
      stripeProductId: 'prod_TMcFoSQbqXRkZx',
    },
  },
  1: {
    // Tier 21-50 seats @ €32
    monthly: {
      stripePriceId: 'price_1SPt4537eeTawvFRskKJeO4a',
      stripeProductId: 'prod_TMcFldyhZIpeqt',
    },
    yearly: {
      stripePriceId: 'price_1SPt4637eeTawvFRoo51e4k5',
      stripeProductId: 'prod_TMcFTcRVB9TMIZ',
    },
  },
  2: {
    // Tier 51-100 seats @ €29
    monthly: {
      stripePriceId: 'price_1SPt4837eeTawvFRKF3WzGwQ',
      stripeProductId: 'prod_TMcFSZsOLXiBNo',
    },
    yearly: {
      stripePriceId: 'price_1SPt4937eeTawvFRCLFRUNOG',
      stripeProductId: 'prod_TMcFl0jWJoP2C6',
    },
  },
};

/**
 * Per-student usage limits for all B2B organizations
 */
export const B2B_STUDENT_LIMITS = {
  exercisesPerMonth: 30,
  fichesPerMonth: 30,
  aiMinutesPerMonth: 60,
  coursesPerMonth: null as number | null, // unlimited
  maxDaysPerCourse: 10,
};

/**
 * Organization features (same for all B2B)
 */
export const B2B_FEATURES = [
  'Achat de sièges par tranches (1-100)',
  '30 exercices par étudiant/mois',
  '30 fiches de révision par étudiant/mois',
  '60 minutes Avatar IA par étudiant/mois',
  'Création de cours illimitée',
  '10 jours max par cours',
  'Tableau de bord organisation',
  'Gestion des membres',
  'Support prioritaire',
  'Rapports avancés',
];

/**
 * Minimum and maximum seat counts
 */
export const MIN_SEATS = 1;
export const MAX_SEATS = 100;

/**
 * Calculate the tier for a given seat count
 */
export const getTierForSeatCount = (seatCount: number): PricingTier => {
  const tier = PRICING_TIERS.find(
    (t) => seatCount >= t.minSeats && seatCount <= t.maxSeats
  );

  if (!tier) {
    throw new Error(`Invalid seat count: ${seatCount}. Must be between ${MIN_SEATS} and ${MAX_SEATS}`);
  }

  return tier;
};

/**
 * Calculate progressive tier pricing breakdown
 * Returns array of tier costs
 */
export interface TierCostBreakdown {
  tierIndex: number;
  tierLabel: string;
  seats: number;
  pricePerSeat: number;
  subtotal: number;
}

export const calculateProgressivePricing = (
  totalSeats: number,
  billingPeriod: BillingPeriod = 'monthly'
): TierCostBreakdown[] => {
  if (totalSeats < MIN_SEATS || totalSeats > MAX_SEATS) {
    throw new Error(`Seat count must be between ${MIN_SEATS} and ${MAX_SEATS}`);
  }

  const breakdown: TierCostBreakdown[] = [];
  let remainingSeats = totalSeats;

  for (let i = 0; i < PRICING_TIERS.length; i++) {
    const tier = PRICING_TIERS[i];

    if (remainingSeats <= 0) break;

    // Calculate how many seats fall in this tier
    const tierCapacity = tier.maxSeats - tier.minSeats + 1;
    const seatsInTier = Math.min(remainingSeats, tierCapacity);

    // Only include if we actually have seats in this tier
    if (totalSeats >= tier.minSeats) {
      const actualSeatsInTier = Math.min(
        Math.max(0, totalSeats - tier.minSeats + 1),
        tierCapacity
      );

      if (actualSeatsInTier > 0) {
        const pricePerSeat = tier.pricePerSeat * (billingPeriod === 'yearly' ? 12 : 1);

        breakdown.push({
          tierIndex: i,
          tierLabel: `${tier.minSeats}-${tier.maxSeats} sièges`,
          seats: actualSeatsInTier,
          pricePerSeat,
          subtotal: actualSeatsInTier * pricePerSeat,
        });
      }
    }

    remainingSeats -= seatsInTier;
  }

  return breakdown;
};

/**
 * Calculate total cost for seat count with progressive pricing
 */
export const calculateSeatCost = (
  seatCount: number,
  billingPeriod: BillingPeriod = 'monthly'
): number => {
  const breakdown = calculateProgressivePricing(seatCount, billingPeriod);
  return breakdown.reduce((sum, tier) => sum + tier.subtotal, 0);
};

/**
 * Get price per seat for a specific tier
 */
export const getPriceForTier = (
  tierIndex: number,
  billingPeriod: BillingPeriod = 'monthly'
): number => {
  if (tierIndex < 0 || tierIndex >= PRICING_TIERS.length) {
    throw new Error(`Invalid tier index: ${tierIndex}`);
  }

  const basePrice = PRICING_TIERS[tierIndex].pricePerSeat;
  return billingPeriod === 'yearly' ? basePrice * 12 : basePrice;
};

/**
 * Get Stripe price ID for a tier
 */
export const getStripePriceIdForTier = (
  tierIndex: number,
  billingPeriod: BillingPeriod = 'monthly'
): string => {
  const product = STRIPE_TIER_PRODUCTS[tierIndex];
  if (!product) {
    throw new Error(`No Stripe product configured for tier ${tierIndex}`);
  }

  return product[billingPeriod].stripePriceId;
};

/**
 * Get all Stripe price IDs needed for a seat count
 * Returns array of price IDs for each tier that applies
 */
export const getStripePriceIdsForSeatCount = (
  seatCount: number,
  billingPeriod: BillingPeriod = 'monthly'
): string[] => {
  const breakdown = calculateProgressivePricing(seatCount, billingPeriod);
  return breakdown.map((tier) => getStripePriceIdForTier(tier.tierIndex, billingPeriod));
};

/**
 * Format price for display
 */
export const formatPrice = (priceInEuros: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(priceInEuros);
};

/**
 * Validate seat count
 */
export const isValidSeatCount = (seatCount: number): boolean => {
  return seatCount >= MIN_SEATS && seatCount <= MAX_SEATS && Number.isInteger(seatCount);
};

/**
 * Get monthly equivalent price (for yearly billing comparison)
 */
export const getMonthlyEquivalent = (yearlyPrice: number): number => {
  return yearlyPrice / 12;
};

/**
 * Maps Stripe product IDs to tier indices
 */
export const STRIPE_PRODUCT_TO_TIER: Record<string, number> = {
  // Tier 0 (1-20 seats)
  'prod_TMcFeLhPKrQqhe': 0,
  'prod_TMcFoSQbqXRkZx': 0,
  // Tier 1 (21-50 seats)
  'prod_TMcFldyhZIpeqt': 1,
  'prod_TMcFTcRVB9TMIZ': 1,
  // Tier 2 (51-100 seats)
  'prod_TMcFSZsOLXiBNo': 2,
  'prod_TMcFl0jWJoP2C6': 2,
};

// Legacy type for backwards compatibility
export type OrganizationPlanType = 'b2b_standard';

// Deprecated exports (for backwards compatibility)
/** @deprecated Use calculateSeatCost instead */
export const formatOrgPlanPrice = formatPrice;

/** @deprecated Use B2B_STUDENT_LIMITS instead */
export const getOrganizationPlan = () => ({
  id: 'b2b_standard' as OrganizationPlanType,
  name: 'Standard B2B',
  displayName: 'Organisation B2B',
  perStudentLimits: B2B_STUDENT_LIMITS,
  features: B2B_FEATURES,
});
