/**
 * Utilities for managing Stripe checkout session state in localStorage
 */

export interface CheckoutSessionData {
  sessionId: string;
  priceId: string;
  plan: 'premium' | 'pro' | 'ai_minutes';
  timestamp: number;
}

const CHECKOUT_SESSION_KEY = 'stripe_checkout_session';

/**
 * Save checkout session data to localStorage
 */
export const saveCheckoutSession = (data: Omit<CheckoutSessionData, 'timestamp'>) => {
  const sessionData: CheckoutSessionData = {
    ...data,
    timestamp: Date.now(),
  };

  try {
    localStorage.setItem(CHECKOUT_SESSION_KEY, JSON.stringify(sessionData));
  } catch (error) {
    console.error('Failed to save checkout session:', error);
  }
};

/**
 * Get checkout session data from localStorage
 */
export const getCheckoutSession = (): CheckoutSessionData | null => {
  try {
    const data = localStorage.getItem(CHECKOUT_SESSION_KEY);
    if (!data) return null;

    const session: CheckoutSessionData = JSON.parse(data);

    // Check if session is older than 24 hours (Stripe checkout sessions expire)
    const isExpired = Date.now() - session.timestamp > 24 * 60 * 60 * 1000;
    if (isExpired) {
      clearCheckoutSession();
      return null;
    }

    return session;
  } catch (error) {
    console.error('Failed to get checkout session:', error);
    return null;
  }
};

/**
 * Clear checkout session from localStorage
 */
export const clearCheckoutSession = () => {
  try {
    localStorage.removeItem(CHECKOUT_SESSION_KEY);
  } catch (error) {
    console.error('Failed to clear checkout session:', error);
  }
};

/**
 * Check if there's an active checkout session
 */
export const hasActiveCheckoutSession = (): boolean => {
  return getCheckoutSession() !== null;
};
