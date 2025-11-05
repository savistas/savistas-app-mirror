/**
 * B2B Organization Subscription Plans Configuration
 *
 * Defines the three B2B plans for schools and companies:
 * - PRO: 1-20 users
 * - MAX: 21-50 users
 * - ULTRA: 51-100 users
 *
 * All plans include:
 * - Per-student limits: 30 exercises, 30 fiches, 60 AI minutes per month
 * - Unlimited course creation
 * - 10 days max per course
 *
 * Both monthly and yearly billing options available
 */

export type OrganizationPlanType = 'b2b_pro' | 'b2b_max' | 'b2b_ultra';
export type BillingPeriod = 'monthly' | 'yearly';

export interface OrganizationPlanPricing {
  monthly: {
    price: number; // in euros
    stripePriceId: string;
    stripeProductId: string;
  };
  yearly: {
    price: number; // in euros (annual total)
    stripePriceId: string;
    stripeProductId: string;
    monthlySavings: number; // savings per month vs monthly plan
  };
}

/**
 * Seat-based pricing configuration for organization plans
 * Organizations purchase seats as subscriptions to unlock member capacity
 */
export interface SeatPricing {
  monthly: {
    pricePerSeat: number; // in euros per seat per month
    stripePriceId: string;
    stripeProductId: string;
  };
  yearly: {
    pricePerSeat: number; // in euros per seat per year
    stripePriceId: string;
    stripeProductId: string;
  };
}

export interface OrganizationPlanConfig {
  id: OrganizationPlanType;
  name: string;
  displayName: string;
  description: string;
  pricing: OrganizationPlanPricing;
  seatPricing: SeatPricing; // Per-seat subscription pricing
  includedSeats: number; // Number of free seats included with the plan
  seatRange: {
    min: number;
    max: number;
  };
  perStudentLimits: {
    exercisesPerMonth: number;
    fichesPerMonth: number;
    aiMinutesPerMonth: number;
    coursesPerMonth: number | null; // null = unlimited
    maxDaysPerCourse: number;
  };
  features: string[];
  popular?: boolean;
}

export const ORGANIZATION_PLANS: Record<OrganizationPlanType, OrganizationPlanConfig> = {
  b2b_pro: {
    id: 'b2b_pro',
    name: 'PRO',
    displayName: 'Version PRO',
    description: 'Idéal pour les petites équipes et écoles',
    pricing: {
      monthly: {
        price: 1200,
        stripePriceId: 'price_1SNu6M37eeTawvFRnK6RfHSx',
        stripeProductId: 'prod_TKZEnwNiSwAjiu',
      },
      yearly: {
        price: 14400,
        stripePriceId: 'price_1SNu6I37eeTawvFR5qEIYme2',
        stripeProductId: 'prod_TKZERNkKTiGW4k',
        monthlySavings: 0, // 14400/12 = 1200, no discount
      },
    },
    seatPricing: {
      monthly: {
        pricePerSeat: 35,
        stripePriceId: 'price_1SPt4237eeTawvFRmxg2xSQv',
        stripeProductId: 'prod_TMcFeLhPKrQqhe',
      },
      yearly: {
        pricePerSeat: 420, // 35€ * 12
        stripePriceId: 'price_1SPt4437eeTawvFRlhZCxm5m',
        stripeProductId: 'prod_TMcFoSQbqXRkZx',
      },
    },
    includedSeats: 0, // No free seats, must purchase 1-20
    seatRange: {
      min: 1,
      max: 20,
    },
    perStudentLimits: {
      exercisesPerMonth: 30,
      fichesPerMonth: 30,
      aiMinutesPerMonth: 60,
      coursesPerMonth: null, // unlimited
      maxDaysPerCourse: 10,
    },
    features: [
      'Achat de sièges requis (1 à 20)',
      '30 exercices par étudiant/mois',
      '30 fiches de révision par étudiant/mois',
      '60 minutes Avatar IA par étudiant/mois',
      'Création de cours illimitée',
      '10 jours max par cours',
      'Tableau de bord organisation',
      'Gestion des membres',
      'Support prioritaire',
    ],
  },
  b2b_max: {
    id: 'b2b_max',
    name: 'MAX',
    displayName: 'Version MAX',
    description: 'Parfait pour les écoles de taille moyenne',
    pricing: {
      monthly: {
        price: 3000,
        stripePriceId: 'price_1SNu6L37eeTawvFR3rSzsjbQ',
        stripeProductId: 'prod_TKZEg8FhoYWpQp',
      },
      yearly: {
        price: 36000,
        stripePriceId: 'price_1SNu6G37eeTawvFR4qXvQVbL',
        stripeProductId: 'prod_TKZEGlgJJhRX20',
        monthlySavings: 0, // 36000/12 = 3000, no discount
      },
    },
    seatPricing: {
      monthly: {
        pricePerSeat: 32,
        stripePriceId: 'price_1SPt4537eeTawvFRskKJeO4a',
        stripeProductId: 'prod_TMcFldyhZIpeqt',
      },
      yearly: {
        pricePerSeat: 384, // 32€ * 12
        stripePriceId: 'price_1SPt4637eeTawvFRoo51e4k5',
        stripeProductId: 'prod_TMcFTcRVB9TMIZ',
      },
    },
    includedSeats: 20, // 20 free seats included, can purchase more
    seatRange: {
      min: 21,
      max: 50,
    },
    perStudentLimits: {
      exercisesPerMonth: 30,
      fichesPerMonth: 30,
      aiMinutesPerMonth: 60,
      coursesPerMonth: null, // unlimited
      maxDaysPerCourse: 10,
    },
    features: [
      '20 sièges inclus + achat possible jusqu\'à 50',
      '30 exercices par étudiant/mois',
      '30 fiches de révision par étudiant/mois',
      '60 minutes Avatar IA par étudiant/mois',
      'Création de cours illimitée',
      '10 jours max par cours',
      'Tableau de bord organisation',
      'Gestion des membres',
      'Support prioritaire',
      'Rapports avancés',
    ],
    popular: true,
  },
  b2b_ultra: {
    id: 'b2b_ultra',
    name: 'ULTRA',
    displayName: 'Version ULTRA',
    description: 'Pour les grandes institutions',
    pricing: {
      monthly: {
        price: 5000,
        stripePriceId: 'price_1SNu6J37eeTawvFRw1XwsG3Q',
        stripeProductId: 'prod_TKZEwBnUONQnHD',
      },
      yearly: {
        price: 60000,
        stripePriceId: 'price_1SNu6F37eeTawvFRVCWXFR1M',
        stripeProductId: 'prod_TKZE2ydWNgjoR6',
        monthlySavings: 0, // 60000/12 = 5000, no discount
      },
    },
    seatPricing: {
      monthly: {
        pricePerSeat: 29,
        stripePriceId: 'price_1SPt4837eeTawvFRKF3WzGwQ',
        stripeProductId: 'prod_TMcFSZsOLXiBNo',
      },
      yearly: {
        pricePerSeat: 348, // 29€ * 12
        stripePriceId: 'price_1SPt4937eeTawvFRCLFRUNOG',
        stripeProductId: 'prod_TMcFl0jWJoP2C6',
      },
    },
    includedSeats: 50, // 50 free seats included, can purchase more
    seatRange: {
      min: 51,
      max: 100,
    },
    perStudentLimits: {
      exercisesPerMonth: 30,
      fichesPerMonth: 30,
      aiMinutesPerMonth: 60,
      coursesPerMonth: null, // unlimited
      maxDaysPerCourse: 10,
    },
    features: [
      '50 sièges inclus + achat possible jusqu\'à 100',
      '30 exercices par étudiant/mois',
      '30 fiches de révision par étudiant/mois',
      '60 minutes Avatar IA par étudiant/mois',
      'Création de cours illimitée',
      '10 jours max par cours',
      'Tableau de bord organisation',
      'Gestion des membres',
      'Support prioritaire',
      'Rapports avancés',
      'Formation personnalisée',
      'API access',
    ],
  },
};

/**
 * Maps Stripe product IDs to organization plan types
 * Includes both monthly and yearly product IDs (flat-rate and seat-based)
 */
export const STRIPE_PRODUCT_TO_ORG_PLAN: Record<string, OrganizationPlanType> = {
  // Flat-rate monthly products
  'prod_TKZEnwNiSwAjiu': 'b2b_pro',
  'prod_TKZEg8FhoYWpQp': 'b2b_max',
  'prod_TKZEwBnUONQnHD': 'b2b_ultra',
  // Flat-rate yearly products
  'prod_TKZERNkKTiGW4k': 'b2b_pro',
  'prod_TKZEGlgJJhRX20': 'b2b_max',
  'prod_TKZE2ydWNgjoR6': 'b2b_ultra',
  // Seat-based monthly products
  'prod_TMcFeLhPKrQqhe': 'b2b_pro',
  'prod_TMcFldyhZIpeqt': 'b2b_max',
  'prod_TMcFSZsOLXiBNo': 'b2b_ultra',
  // Seat-based yearly products
  'prod_TMcFoSQbqXRkZx': 'b2b_pro',
  'prod_TMcFTcRVB9TMIZ': 'b2b_max',
  'prod_TMcFl0jWJoP2C6': 'b2b_ultra',
};

/**
 * Get all organization plans as an array, sorted by monthly price
 */
export const getOrganizationPlansArray = (): OrganizationPlanConfig[] => {
  return Object.values(ORGANIZATION_PLANS).sort((a, b) => a.pricing.monthly.price - b.pricing.monthly.price);
};

/**
 * Get organization plan configuration by type
 */
export const getOrganizationPlan = (planType: OrganizationPlanType): OrganizationPlanConfig => {
  return ORGANIZATION_PLANS[planType];
};

/**
 * Get price for a plan based on billing period
 */
export const getPlanPrice = (planType: OrganizationPlanType, billingPeriod: BillingPeriod): number => {
  const plan = ORGANIZATION_PLANS[planType];
  return plan.pricing[billingPeriod].price;
};

/**
 * Get Stripe price ID for a plan based on billing period
 */
export const getStripePriceId = (planType: OrganizationPlanType, billingPeriod: BillingPeriod): string => {
  const plan = ORGANIZATION_PLANS[planType];
  return plan.pricing[billingPeriod].stripePriceId;
};

/**
 * Get monthly equivalent price (for comparison)
 */
export const getMonthlyEquivalentPrice = (planType: OrganizationPlanType, billingPeriod: BillingPeriod): number => {
  const plan = ORGANIZATION_PLANS[planType];
  if (billingPeriod === 'monthly') {
    return plan.pricing.monthly.price;
  }
  return plan.pricing.yearly.price / 12;
};

/**
 * Calculate savings when choosing yearly vs monthly
 */
export const calculateYearlySavings = (planType: OrganizationPlanType): number => {
  const plan = ORGANIZATION_PLANS[planType];
  const monthlyTotal = plan.pricing.monthly.price * 12;
  const yearlyTotal = plan.pricing.yearly.price;
  return monthlyTotal - yearlyTotal;
};

/**
 * Determine which plan is required based on member count
 */
export const getRequiredPlanForMemberCount = (memberCount: number): OrganizationPlanType => {
  if (memberCount <= 20) return 'b2b_pro';
  if (memberCount <= 50) return 'b2b_max';
  return 'b2b_ultra';
};

/**
 * Check if a plan upgrade is needed for a given member count
 */
export const needsPlanUpgrade = (
  currentPlan: OrganizationPlanType,
  newMemberCount: number
): { needed: boolean; suggestedPlan?: OrganizationPlanType } => {
  const requiredPlan = getRequiredPlanForMemberCount(newMemberCount);
  const currentPlanConfig = ORGANIZATION_PLANS[currentPlan];

  if (newMemberCount > currentPlanConfig.seatRange.max) {
    return { needed: true, suggestedPlan: requiredPlan };
  }

  return { needed: false };
};

/**
 * Check if a plan downgrade should occur for a given member count
 */
export const shouldPlanDowngrade = (
  currentPlan: OrganizationPlanType,
  newMemberCount: number
): { should: boolean; suggestedPlan?: OrganizationPlanType } => {
  const requiredPlan = getRequiredPlanForMemberCount(newMemberCount);

  // Downgrade if current plan is higher tier than required
  const planOrder: OrganizationPlanType[] = ['b2b_pro', 'b2b_max', 'b2b_ultra'];
  const currentIndex = planOrder.indexOf(currentPlan);
  const requiredIndex = planOrder.indexOf(requiredPlan);

  if (currentIndex > requiredIndex) {
    return { should: true, suggestedPlan: requiredPlan };
  }

  return { should: false };
};

/**
 * Get the next higher plan (for upgrades)
 */
export const getNextPlan = (currentPlan: OrganizationPlanType): OrganizationPlanType | null => {
  if (currentPlan === 'b2b_pro') return 'b2b_max';
  if (currentPlan === 'b2b_max') return 'b2b_ultra';
  return null; // already at highest
};

/**
 * Get the next lower plan (for downgrades)
 */
export const getPreviousPlan = (currentPlan: OrganizationPlanType): OrganizationPlanType | null => {
  if (currentPlan === 'b2b_ultra') return 'b2b_max';
  if (currentPlan === 'b2b_max') return 'b2b_pro';
  return null; // already at lowest
};

/**
 * Format price for display
 */
export const formatOrgPlanPrice = (priceInEuros: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(priceInEuros);
};

/**
 * Get seat price for a plan based on billing period
 */
export const getSeatPrice = (planType: OrganizationPlanType, billingPeriod: BillingPeriod): number => {
  const plan = ORGANIZATION_PLANS[planType];
  return plan.seatPricing[billingPeriod].pricePerSeat;
};

/**
 * Get Stripe price ID for seat subscription based on billing period
 */
export const getSeatPriceId = (planType: OrganizationPlanType, billingPeriod: BillingPeriod): string => {
  const plan = ORGANIZATION_PLANS[planType];
  return plan.seatPricing[billingPeriod].stripePriceId;
};

/**
 * Calculate total cost for purchasing seats
 */
export const calculateSeatCost = (
  planType: OrganizationPlanType,
  billingPeriod: BillingPeriod,
  seatCount: number
): number => {
  const pricePerSeat = getSeatPrice(planType, billingPeriod);
  return pricePerSeat * seatCount;
};

/**
 * Get monthly equivalent cost per seat (for comparison)
 */
export const getMonthlySeatCost = (planType: OrganizationPlanType, billingPeriod: BillingPeriod): number => {
  const plan = ORGANIZATION_PLANS[planType];
  if (billingPeriod === 'monthly') {
    return plan.seatPricing.monthly.pricePerSeat;
  }
  return plan.seatPricing.yearly.pricePerSeat / 12;
};

/**
 * Check if seat count is within plan limits
 */
export const isValidSeatCount = (planType: OrganizationPlanType, seatCount: number): boolean => {
  const plan = ORGANIZATION_PLANS[planType];
  return seatCount >= plan.seatRange.min && seatCount <= plan.seatRange.max;
};
