/**
 * Utility functions for managing Stripe checkout sessions
 */

const CHECKOUT_SESSION_KEY = 'stripe_checkout_session';

/**
 * Saves a checkout session ID to localStorage
 */
export function saveCheckoutSession(sessionId: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CHECKOUT_SESSION_KEY, sessionId);
  }
}

/**
 * Retrieves the checkout session ID from localStorage
 */
export function getCheckoutSession(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(CHECKOUT_SESSION_KEY);
  }
  return null;
}

/**
 * Clears the checkout session from localStorage
 */
export function clearCheckoutSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CHECKOUT_SESSION_KEY);
  }
}
