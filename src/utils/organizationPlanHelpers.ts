import {
  OrganizationPlanType,
  ORGANIZATION_PLANS,
  getRequiredPlanForMemberCount,
  needsPlanUpgrade,
  shouldPlanDowngrade,
  getNextPlan,
  getPreviousPlan,
} from '@/constants/organizationPlans';
import { OrganizationSubscriptionStatus } from '@/types/organizationSubscription';

/**
 * Organization Plan Helper Utilities
 *
 * Provides utility functions for organization plan management,
 * seat calculations, and capacity checking
 */

/**
 * Calculate seat limit based on plan type
 */
export const getSeatLimitForPlan = (plan: OrganizationPlanType | null): number => {
  if (!plan) return 0;
  return ORGANIZATION_PLANS[plan].seatRange.max;
};

/**
 * Calculate remaining seats
 */
export const calculateRemainingSeats = (
  activeMembersCount: number,
  seatLimit: number
): number => {
  return Math.max(0, seatLimit - activeMembersCount);
};

/**
 * Check if organization can add a new member
 */
export const canAddMember = (
  activeMembersCount: number,
  seatLimit: number
): boolean => {
  return activeMembersCount < seatLimit;
};

/**
 * Get capacity percentage (0-100)
 */
export const getCapacityPercentage = (
  activeMembersCount: number,
  seatLimit: number
): number => {
  if (seatLimit === 0) return 0;
  return Math.round((activeMembersCount / seatLimit) * 100);
};

/**
 * Get capacity status for UI display
 */
export const getCapacityStatus = (
  activeMembersCount: number,
  seatLimit: number
): 'low' | 'medium' | 'high' | 'full' => {
  const percentage = getCapacityPercentage(activeMembersCount, seatLimit);

  if (percentage >= 100) return 'full';
  if (percentage >= 80) return 'high';
  if (percentage >= 50) return 'medium';
  return 'low';
};

/**
 * Get capacity color for UI
 */
export const getCapacityColor = (status: 'low' | 'medium' | 'high' | 'full'): string => {
  switch (status) {
    case 'full':
      return 'text-red-600';
    case 'high':
      return 'text-orange-600';
    case 'medium':
      return 'text-yellow-600';
    case 'low':
    default:
      return 'text-green-600';
  }
};

/**
 * Format subscription status for display
 */
export const formatSubscriptionStatus = (status: OrganizationSubscriptionStatus): string => {
  const statusMap: Record<OrganizationSubscriptionStatus, string> = {
    active: 'Actif',
    canceled: 'Annulé',
    past_due: 'Paiement en retard',
    incomplete: 'Incomplet',
    incomplete_expired: 'Expiré',
    trialing: 'Essai gratuit',
    unpaid: 'Non payé',
  };
  return statusMap[status] || status;
};

/**
 * Get subscription status color
 */
export const getSubscriptionStatusColor = (status: OrganizationSubscriptionStatus): string => {
  switch (status) {
    case 'active':
      return 'text-green-600 bg-green-50';
    case 'trialing':
      return 'text-blue-600 bg-blue-50';
    case 'past_due':
    case 'unpaid':
      return 'text-orange-600 bg-orange-50';
    case 'canceled':
    case 'incomplete_expired':
      return 'text-red-600 bg-red-50';
    case 'incomplete':
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

/**
 * Calculate days until period end
 */
export const getDaysUntilPeriodEnd = (periodEnd: string): number => {
  const end = new Date(periodEnd);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

/**
 * Format period end date for display
 */
export const formatPeriodEndDate = (periodEnd: string): string => {
  const date = new Date(periodEnd);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

/**
 * Check if subscription is active
 */
export const isSubscriptionActive = (status: OrganizationSubscriptionStatus): boolean => {
  return status === 'active' || status === 'trialing';
};

/**
 * Check if organization needs to upgrade for new member count
 */
export const checkUpgradeRequired = (
  currentPlan: OrganizationPlanType,
  newMemberCount: number
): {
  required: boolean;
  suggestedPlan?: OrganizationPlanType;
  message?: string;
} => {
  const { needed, suggestedPlan } = needsPlanUpgrade(currentPlan, newMemberCount);

  if (needed && suggestedPlan) {
    const suggestedPlanConfig = ORGANIZATION_PLANS[suggestedPlan];
    return {
      required: true,
      suggestedPlan,
      message: `Votre organisation doit passer au plan ${suggestedPlanConfig.displayName} pour accueillir ${newMemberCount} membres.`,
    };
  }

  return { required: false };
};

/**
 * Check if organization should downgrade for new member count
 */
export const checkDowngradeRecommended = (
  currentPlan: OrganizationPlanType,
  newMemberCount: number
): {
  recommended: boolean;
  suggestedPlan?: OrganizationPlanType;
  message?: string;
} => {
  const { should, suggestedPlan } = shouldPlanDowngrade(currentPlan, newMemberCount);

  if (should && suggestedPlan) {
    const suggestedPlanConfig = ORGANIZATION_PLANS[suggestedPlan];
    return {
      recommended: true,
      suggestedPlan,
      message: `Avec ${newMemberCount} membres, votre organisation peut passer au plan ${suggestedPlanConfig.displayName} et économiser sur votre abonnement.`,
    };
  }

  return { recommended: false };
};

/**
 * Get plan comparison info (for upgrades/downgrades)
 */
export const getPlanComparison = (
  fromPlan: OrganizationPlanType,
  toPlan: OrganizationPlanType
): {
  isUpgrade: boolean;
  priceDifference: number;
  seatDifference: number;
} => {
  const fromConfig = ORGANIZATION_PLANS[fromPlan];
  const toConfig = ORGANIZATION_PLANS[toPlan];

  const planOrder: OrganizationPlanType[] = ['b2b_pro', 'b2b_max', 'b2b_ultra'];
  const isUpgrade = planOrder.indexOf(toPlan) > planOrder.indexOf(fromPlan);

  return {
    isUpgrade,
    priceDifference: toConfig.priceMonthly - fromConfig.priceMonthly,
    seatDifference: toConfig.seatRange.max - fromConfig.seatRange.max,
  };
};

/**
 * Generate upgrade message
 */
export const generateUpgradeMessage = (
  currentPlan: OrganizationPlanType,
  targetPlan: OrganizationPlanType
): string => {
  const currentConfig = ORGANIZATION_PLANS[currentPlan];
  const targetConfig = ORGANIZATION_PLANS[targetPlan];
  const { priceDifference } = getPlanComparison(currentPlan, targetPlan);

  return `Passer de ${currentConfig.displayName} à ${targetConfig.displayName} pour ${priceDifference}€ supplémentaires par mois. Vous pourrez accueillir jusqu'à ${targetConfig.seatRange.max} membres.`;
};

/**
 * Generate downgrade message
 */
export const generateDowngradeMessage = (
  currentPlan: OrganizationPlanType,
  targetPlan: OrganizationPlanType
): string => {
  const currentConfig = ORGANIZATION_PLANS[currentPlan];
  const targetConfig = ORGANIZATION_PLANS[targetPlan];
  const { priceDifference } = getPlanComparison(currentPlan, targetPlan);

  return `Passer de ${currentConfig.displayName} à ${targetConfig.displayName} pour économiser ${Math.abs(priceDifference)}€ par mois. Limite de ${targetConfig.seatRange.max} membres.`;
};

/**
 * Validate if downgrade is possible (member count check)
 */
export const canDowngradeToPlan = (
  targetPlan: OrganizationPlanType,
  currentMemberCount: number
): { possible: boolean; message?: string } => {
  const targetConfig = ORGANIZATION_PLANS[targetPlan];

  if (currentMemberCount > targetConfig.seatRange.max) {
    const excess = currentMemberCount - targetConfig.seatRange.max;
    return {
      possible: false,
      message: `Vous devez d'abord retirer ${excess} membre(s) pour passer au plan ${targetConfig.displayName} (limite: ${targetConfig.seatRange.max} membres).`,
    };
  }

  return { possible: true };
};

/**
 * Get suggested actions based on capacity
 */
export const getSuggestedActions = (
  activeMembersCount: number,
  seatLimit: number,
  currentPlan: OrganizationPlanType
): string[] => {
  const remaining = calculateRemainingSeats(activeMembersCount, seatLimit);
  const status = getCapacityStatus(activeMembersCount, seatLimit);
  const actions: string[] = [];

  if (status === 'full') {
    const nextPlan = getNextPlan(currentPlan);
    if (nextPlan) {
      const nextConfig = ORGANIZATION_PLANS[nextPlan];
      actions.push(`Passez au plan ${nextConfig.displayName} pour ajouter plus de membres`);
    } else {
      actions.push('Vous avez atteint la capacité maximale (100 membres)');
    }
  } else if (status === 'high') {
    actions.push(`Seulement ${remaining} place(s) restante(s)`);
    const nextPlan = getNextPlan(currentPlan);
    if (nextPlan) {
      actions.push(`Envisagez une mise à niveau vers ${ORGANIZATION_PLANS[nextPlan].displayName}`);
    }
  }

  // Check for downgrade opportunity
  if (status === 'low') {
    const previousPlan = getPreviousPlan(currentPlan);
    if (previousPlan) {
      const { recommended } = checkDowngradeRecommended(currentPlan, activeMembersCount);
      if (recommended) {
        actions.push(`Vous pourriez économiser en passant au plan ${ORGANIZATION_PLANS[previousPlan].displayName}`);
      }
    }
  }

  return actions;
};

// Re-export from constants for convenience
export {
  getRequiredPlanForMemberCount,
  needsPlanUpgrade,
  shouldPlanDowngrade,
  getNextPlan,
  getPreviousPlan,
};
