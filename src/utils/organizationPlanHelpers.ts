import { MIN_SEATS, MAX_SEATS } from '@/constants/organizationPlans';
import { OrganizationSubscriptionStatus } from '@/types/organizationSubscription';

/**
 * Organization Seat & Capacity Helper Utilities
 *
 * Provides utility functions for seat-based organization management,
 * capacity checking, and subscription status formatting
 *
 * Note: With the new seat-based model, there are no plan tiers.
 * All organizations use the same progressive pricing based on seat count.
 */

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
 * Check if organization needs more seats
 */
export const needsMoreSeats = (
  activeMembersCount: number,
  seatLimit: number
): { needed: boolean; message?: string } => {
  const remaining = calculateRemainingSeats(activeMembersCount, seatLimit);
  const status = getCapacityStatus(activeMembersCount, seatLimit);

  if (status === 'full') {
    if (seatLimit >= MAX_SEATS) {
      return {
        needed: true,
        message: `Vous avez atteint la capacité maximale de ${MAX_SEATS} sièges.`,
      };
    }
    return {
      needed: true,
      message: 'Capacité maximale atteinte. Achetez plus de sièges pour ajouter des membres.',
    };
  }

  if (status === 'high') {
    return {
      needed: false,
      message: `Attention : seulement ${remaining} siège(s) restant(s). Envisagez d'acheter plus de sièges.`,
    };
  }

  return { needed: false };
};

/**
 * Check if seat count is within limits
 */
export const isValidSeatCount = (seatCount: number): { valid: boolean; message?: string } => {
  if (seatCount < MIN_SEATS) {
    return {
      valid: false,
      message: `Le nombre de sièges doit être au moins ${MIN_SEATS}.`,
    };
  }

  if (seatCount > MAX_SEATS) {
    return {
      valid: false,
      message: `Le nombre maximum de sièges est ${MAX_SEATS}.`,
    };
  }

  if (!Number.isInteger(seatCount)) {
    return {
      valid: false,
      message: 'Le nombre de sièges doit être un nombre entier.',
    };
  }

  return { valid: true };
};

/**
 * Get suggested actions based on capacity
 */
export const getSuggestedActions = (
  activeMembersCount: number,
  seatLimit: number
): string[] => {
  const remaining = calculateRemainingSeats(activeMembersCount, seatLimit);
  const status = getCapacityStatus(activeMembersCount, seatLimit);
  const actions: string[] = [];

  if (status === 'full') {
    if (seatLimit >= MAX_SEATS) {
      actions.push(`Vous avez atteint la capacité maximale de ${MAX_SEATS} sièges`);
    } else {
      actions.push('Achetez plus de sièges pour ajouter de nouveaux membres');
    }
  } else if (status === 'high') {
    actions.push(`Seulement ${remaining} place(s) restante(s)`);
    actions.push('Envisagez d\'acheter plus de sièges pour anticiper la croissance');
  } else if (status === 'low' && remaining > seatLimit * 0.5) {
    // If using less than 50% of seats, suggest optimizing
    actions.push('Vous avez beaucoup de sièges disponibles');
  }

  return actions;
};

/**
 * Calculate recommended seat purchase
 * Suggests how many additional seats to buy based on current usage
 */
export const getRecommendedSeatPurchase = (
  activeMembersCount: number,
  seatLimit: number,
  expectedGrowth: number = 0
): number => {
  const remaining = calculateRemainingSeats(activeMembersCount, seatLimit);
  const needed = Math.max(0, expectedGrowth - remaining);

  // Add 20% buffer for safety
  const recommended = Math.ceil(needed * 1.2);

  // Ensure we don't exceed max seats
  const maxAdditional = MAX_SEATS - seatLimit;
  return Math.min(recommended, maxAdditional);
};

// Legacy compatibility exports (deprecated)
/** @deprecated Use seatLimit from organization directly */
export const getSeatLimitForPlan = (): number => 0;

/** @deprecated No longer applicable in seat-based model */
export const getIncludedSeatsForPlan = (): number => 0;

/** @deprecated Use MAX_SEATS constant instead */
export const getMaxSeatsForPlan = (): number => MAX_SEATS;
