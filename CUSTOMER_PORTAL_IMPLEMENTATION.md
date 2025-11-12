# Customer Portal Implementation Guide

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Security Model](#security-model)
4. [Implementation Details](#implementation-details)
5. [Deployment](#deployment)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

---

## Overview

### What is the Stripe Customer Portal?

The Stripe Customer Portal is a pre-built, hosted page that allows customers to:
- ✅ Update payment methods (credit cards)
- ✅ View billing history and invoices
- ✅ Download invoice PDFs
- ✅ Cancel subscriptions
- ✅ Update billing information

### What We Implemented

✅ **Individual Users** (students, parents, professors)
- "Gérer ma facturation" button in SubscriptionCard
- Direct access to their Stripe Customer Portal
- Only shown for users with paid subscriptions (Premium/Pro)

✅ **Organizations** (schools, companies)
- "Gérer la facturation" button in OrganizationSubscriptionCard
- **Admin-only access** with security validation
- Non-admin users see disabled button with message

✅ **Email Invoices**
- Simplified to use Stripe automatic emails
- Removed Resend integration for cleaner codebase
- Configure in Stripe Dashboard → Settings → Emails

---

## Architecture

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER CLICKS BUTTON                        │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│              Frontend: SubscriptionCard.tsx or              │
│           OrganizationSubscriptionCard.tsx                   │
│                                                              │
│  - Validates user has subscription                          │
│  - For orgs: checks if user is admin                        │
│  - Calls supabase.functions.invoke()                        │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│      Edge Function: create-portal-session/index.ts          │
│                                                              │
│  VALIDATION:                                                 │
│  1. Verify user is authenticated (JWT)                      │
│  2. Check context (individual vs organization)              │
│  3. For individual: verify ownership of customer_id         │
│  4. For organization: verify admin role                     │
│                                                              │
│  EXECUTION:                                                  │
│  1. Get Stripe customer_id                                  │
│  2. Call stripe.billingPortal.sessions.create()            │
│  3. Return portal URL                                       │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│               Redirect to Stripe Portal                      │
│                                                              │
│  Customer can:                                              │
│  - Update payment method                                    │
│  - View invoices                                            │
│  - Cancel subscription                                      │
│  - Download PDFs                                            │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│              Return to Application                           │
│         (return_url from request)                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Security Model

### Individual Users Security

```typescript
// Edge Function Validation
1. ✅ JWT token verification (automatic via Supabase)
2. ✅ Verify user owns the stripe_customer_id
   - Query: user_subscriptions WHERE user_id = authenticated_user
   - If no match → 403 Forbidden
3. ✅ Validate stripe_customer_id exists in request
```

**Protection:**
- User A cannot access User B's billing portal
- No unauthenticated access
- Database-level ownership validation

### Organization Users Security

```typescript
// Edge Function Validation
1. ✅ JWT token verification (automatic)
2. ✅ Verify user is member of organization
   - Query: organization_members WHERE user_id = X AND organization_id = Y
3. ✅ Verify user is ADMIN
   - Check: role = 'admin'
   - If role = 'member' → 403 Forbidden
4. ✅ Verify organization owns stripe_customer_id
   - Query: organization_subscriptions WHERE organization_id = Y
```

**Protection:**
- Regular members cannot access billing (admin-only)
- Members of Org A cannot access Org B's billing
- Frontend shows disabled button for non-admins
- Backend enforces admin check (defense in depth)

### Attack Scenarios Prevented

| Attack | Protection |
|--------|-----------|
| User tries to access another user's portal | ✅ Database ownership check fails |
| Org member tries to access billing | ✅ Role check fails (need admin) |
| Attacker guesses organization_id | ✅ Membership + role check fails |
| CSRF attack | ✅ JWT token required |
| Direct API call without auth | ✅ Supabase Auth middleware blocks |

---

## Implementation Details

### Edge Function: create-portal-session/index.ts

**Location:** `/supabase/functions/create-portal-session/index.ts`

**Key Features:**
- Dual context support (individual + organization)
- Admin role validation for organizations
- Configurable return URLs
- Comprehensive error handling

**Request Body:**
```typescript
{
  context: 'individual' | 'organization',
  organization_id?: string,  // Required if context = 'organization'
  return_url?: string        // Optional, defaults to /profile or /dashboard-organization
}
```

**Response:**
```typescript
{
  url: string  // Stripe Customer Portal URL
}
```

**Error Responses:**
```typescript
// Missing authorization
{ error: 'Missing authorization header' }  // 400

// Invalid context
{ error: 'Invalid context. Must be "individual" or "organization"' }  // 400

// Not admin (organization context)
{ error: 'Only organization admins can access billing management' }  // 400

// No subscription found
{ error: 'No active subscription found' }  // 400
```

### Frontend Component: SubscriptionCard.tsx

**Location:** `/src/components/subscription/SubscriptionCard.tsx`

**Changes Made:**
1. Added imports:
   ```typescript
   import { CreditCard } from "lucide-react";
   import { useAuth } from "@/contexts/AuthContext";
   import { supabase } from "@/integrations/supabase/client";
   import { useToast } from "@/hooks/use-toast";
   ```

2. Added state:
   ```typescript
   const [portalLoading, setPortalLoading] = useState(false);
   ```

3. Added handler:
   ```typescript
   const handleManageBilling = async () => {
     // Validates session and customer_id
     // Calls Edge Function
     // Redirects to Stripe portal
   };
   ```

4. Added button (only for paid subscriptions):
   ```typescript
   {subscription.plan !== 'basic' && subscription.stripe_customer_id && (
     <Button onClick={handleManageBilling} disabled={portalLoading}>
       <CreditCard className="w-4 h-4 mr-2" />
       {portalLoading ? 'Chargement...' : 'Gérer ma facturation'}
     </Button>
   )}
   ```

### Frontend Component: OrganizationSubscriptionCard.tsx

**Location:** `/src/components/organization/OrganizationSubscriptionCard.tsx`

**Changes Made:**
1. Added imports:
   ```typescript
   import { CreditCard } from 'lucide-react';
   import { supabase } from '@/integrations/supabase/client';
   import { useAuth } from '@/contexts/AuthContext';
   ```

2. Added state:
   ```typescript
   const [isAdmin, setIsAdmin] = useState(false);
   const [portalLoading, setPortalLoading] = useState(false);
   ```

3. Added admin check effect:
   ```typescript
   useEffect(() => {
     const checkAdminStatus = async () => {
       // Query organization_members table
       // Check if role = 'admin'
       // Set isAdmin state
     };
     checkAdminStatus();
   }, [user, organizationId]);
   ```

4. Added handler:
   ```typescript
   const handleManageBilling = async () => {
     // Validates admin status
     // Calls Edge Function with organization context
     // Redirects to Stripe portal
   };
   ```

5. Added button with admin check:
   ```typescript
   {subscription?.stripe_customer_id && (
     <Button
       onClick={handleManageBilling}
       disabled={!isAdmin || portalLoading}
     >
       <CreditCard className="w-4 h-4 mr-2" />
       {portalLoading
         ? 'Chargement...'
         : !isAdmin
           ? 'Gérer la facturation (Admin uniquement)'
           : 'Gérer la facturation'
       }
     </Button>
   )}
   ```

### Webhook Changes: stripe-webhook/index.ts

**Changes Made:**
1. **Removed Resend email integration** (lines 40-85)
   - Deleted `sendInvoiceEmail()` function
   - Simplified codebase

2. **Updated invoice handler** (lines 209-212)
   - Removed email sending call
   - Added comment about Stripe automatic emails

3. **Added comment at top:**
   ```typescript
   // NOTE: Invoice emails are handled by Stripe automatic emails
   // Configure in Stripe Dashboard → Settings → Emails → "Successful payments"
   ```

**Reasoning:**
- User requested Stripe automatic emails only
- Removes unnecessary Resend dependency
- Cleaner, simpler codebase
- Less maintenance overhead

---

## Deployment

### Step 1: Deploy Edge Functions

```bash
# Deploy new create-portal-session function
npx supabase functions deploy create-portal-session

# Redeploy modified webhook (IMPORTANT: keep --no-verify-jwt flag)
npx supabase functions deploy stripe-webhook --no-verify-jwt

# Redeploy modified checkout session
npx supabase functions deploy create-checkout-session
```

### Step 2: Verify Deployment

```bash
# List all functions
npx supabase functions list

# Should show:
# - create-portal-session (NEW)
# - stripe-webhook (UPDATED)
# - create-checkout-session (UPDATED)
```

### Step 3: Configure Stripe Automatic Emails

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Settings → Emails**
3. Enable **"Successful payments"**
4. Optionally customize email template
5. Save changes

**Email will now be sent automatically for:**
- Subscription renewals
- One-time payments (AI minutes)
- Subscription upgrades/downgrades

### Step 4: Configure Stripe Customer Portal (Optional)

1. Go to **Settings → Customer Portal**
2. Configure allowed features:
   - ✅ Update payment methods (recommended)
   - ✅ View invoices (recommended)
   - ✅ Cancel subscriptions (recommended)
   - ⚠️ Update subscription (optional, can allow plan changes)
3. Set business information (company name, logo, etc.)
4. Save settings

**Note:** Portal is functional without this configuration, but customization improves branding.

---

## Testing

### Test 1: Individual User Portal Access

**Scenario:** Premium user updates payment method

**Steps:**
1. Login as user with Premium or Pro subscription
2. Navigate to Profile page
3. Scroll to SubscriptionCard
4. Click "Gérer ma facturation"
5. **Expected:** Redirected to Stripe Customer Portal
6. Update payment method (use test card: `4242 4242 4242 4242`)
7. Click "Return to Application"
8. **Expected:** Back to profile page

**Validation:**
```bash
# Check Supabase logs
npx supabase functions logs create-portal-session

# Should see:
# "🔐 Creating portal session for individual user: [user_id]"
# "✅ Portal session created: [session_id]"
```

### Test 2: Organization Admin Portal Access

**Scenario:** School admin manages organization billing

**Steps:**
1. Login as organization admin
2. Navigate to Organization Dashboard
3. Scroll to OrganizationSubscriptionCard
4. Click "Gérer la facturation"
5. **Expected:** Redirected to Stripe Customer Portal
6. View billing history
7. Return to dashboard

**Validation:**
```bash
# Check logs
npx supabase functions logs create-portal-session

# Should see:
# "🏢 Creating portal session for organization: [org_id]"
# "✅ Portal session created: [session_id]"
```

### Test 3: Non-Admin Member Blocked

**Scenario:** Regular org member tries to access billing

**Steps:**
1. Login as organization member (NOT admin)
2. Navigate to Organization Dashboard
3. Scroll to OrganizationSubscriptionCard
4. **Expected:** Button shows "Gérer la facturation (Admin uniquement)"
5. **Expected:** Button is disabled (greyed out)
6. Click button (if somehow enabled)
7. **Expected:** Error toast: "Seuls les administrateurs peuvent gérer la facturation"

**Validation:**
```bash
# If user bypasses frontend and calls API directly:
npx supabase functions logs create-portal-session

# Should see:
# "❌ Error creating portal session: Only organization admins can access billing management"
```

### Test 4: Basic Plan User (No Portal)

**Scenario:** Free plan user has no billing to manage

**Steps:**
1. Login as user with Basic (free) subscription
2. Navigate to Profile page
3. Scroll to SubscriptionCard
4. **Expected:** NO "Gérer ma facturation" button shown
5. **Expected:** Only "Acheter des minutes IA" button visible

**Reasoning:**
- Free users have no subscription to manage
- No payment method to update
- Button hidden to avoid confusion

### Test 5: Update Payment Method Flow

**Complete scenario:**

1. User subscription on file: Card ending in 1234
2. Card expires next month
3. User receives Stripe email: "Update your payment method"
4. User logs into Savistas
5. Clicks "Gérer ma facturation"
6. Stripe portal opens
7. User clicks "Update payment method"
8. Enters new card: `4242 4242 4242 4242` (test card)
9. Saves new card
10. **Expected:** Portal shows "Payment method updated"
11. User returns to application
12. Next renewal uses new card automatically

**Stripe Webhook Events:**
```
customer.updated → payment_method attached
```

**No code changes needed** - Stripe handles this automatically!

### Test 6: Invoice Download

**Scenario:** User needs invoice for accounting

**Steps:**
1. User with paid subscription
2. Opens Customer Portal
3. Clicks "Invoices" tab
4. **Expected:** List of all invoices
5. Click "Download" on any invoice
6. **Expected:** PDF downloads with:
   - Invoice number
   - Amount paid
   - Date
   - Payment method
   - Business details

---

## Troubleshooting

### Issue 1: Button Not Showing

**Symptoms:**
- "Gérer ma facturation" button not visible
- User has paid subscription

**Diagnosis:**
```typescript
// Check in browser console
console.log(subscription.plan);  // Should be 'premium' or 'pro'
console.log(subscription.stripe_customer_id);  // Should exist
```

**Solution:**
```bash
# Check database
SELECT user_id, plan, stripe_customer_id
FROM user_subscriptions
WHERE user_id = 'user_id_here';

# If stripe_customer_id is NULL:
# User needs to create subscription via checkout first
```

### Issue 2: Portal Opens But Shows Error

**Symptoms:**
- Redirected to Stripe portal
- Stripe shows "Invalid session"

**Diagnosis:**
```bash
# Check Edge Function logs
npx supabase functions logs create-portal-session --tail

# Look for errors in session creation
```

**Solution:**
```bash
# Verify Stripe API key is correct
npx supabase secrets list

# Should show STRIPE_SECRET_KEY
# Redeploy if needed:
npx supabase functions deploy create-portal-session
```

### Issue 3: Org Admin Can't Access Portal

**Symptoms:**
- Admin user clicks button
- Error: "Only organization admins can access billing management"

**Diagnosis:**
```sql
-- Check user's role in organization
SELECT role, status
FROM organization_members
WHERE user_id = 'user_id_here'
  AND organization_id = 'org_id_here';

-- Should return: role = 'admin', status = 'active'
```

**Solution:**
```sql
-- If role is wrong, update it:
UPDATE organization_members
SET role = 'admin'
WHERE user_id = 'user_id_here'
  AND organization_id = 'org_id_here';
```

### Issue 4: Return URL Not Working

**Symptoms:**
- User finishes in portal
- Clicks "Return to Application"
- Goes to wrong page or shows error

**Diagnosis:**
```typescript
// Check return_url being sent
console.log(window.location.href);  // Should be correct URL
```

**Solution:**
```typescript
// Update Edge Function call with explicit URL
body: {
  context: 'individual',
  return_url: 'https://yourdomain.com/profile',  // Full URL
}
```

### Issue 5: CORS Error

**Symptoms:**
- Browser console shows CORS error
- Request blocked

**Diagnosis:**
```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```

**Solution:**
```typescript
// Already implemented in Edge Function:
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Make sure OPTIONS request returns 200
if (req.method === 'OPTIONS') {
  return new Response('ok', { headers: corsHeaders });
}
```

### Issue 6: Slow Portal Loading

**Symptoms:**
- Button click takes 5-10 seconds
- User sees loading state for long time

**Diagnosis:**
```bash
# Check Edge Function cold start time
npx supabase functions logs create-portal-session

# Look for slow queries
```

**Optimization:**
```typescript
// Database queries are already optimized with .single()
// Stripe API call is fast (usually < 500ms)

// If slow, check:
1. Network latency (user location vs Supabase region)
2. Database connection pool (usually not an issue)
3. Stripe API status (status.stripe.com)
```

---

## Additional Features

### Feature 1: Webhook Notifications

When user updates payment method via portal, you can track it:

```typescript
// In stripe-webhook/index.ts
case 'customer.updated': {
  const customer = event.data.object as Stripe.Customer;

  // Check if payment method changed
  if (customer.invoice_settings.default_payment_method) {
    console.log('Payment method updated for customer:', customer.id);

    // Optionally: Send notification to user
    // Optionally: Update database tracking
  }
  break;
}
```

### Feature 2: Portal Session Logging

Track when users access the portal:

```typescript
// In create-portal-session/index.ts
// After successful session creation

await supabase
  .from('portal_access_log')
  .insert({
    user_id: user.id,
    context: context,
    organization_id: organization_id || null,
    session_id: portalSession.id,
    accessed_at: new Date().toISOString(),
  });
```

**Database schema:**
```sql
CREATE TABLE portal_access_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(user_id),
  context TEXT NOT NULL,
  organization_id UUID REFERENCES organizations(id),
  session_id TEXT NOT NULL,
  accessed_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Feature 3: Custom Return URL Per Action

Allow different return URLs based on user action:

```typescript
// Frontend can pass custom URL
body: {
  context: 'individual',
  return_url: window.location.href + '?billing_updated=true',
}

// Then check query param on return
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('billing_updated') === 'true') {
    toast({ title: 'Facturation mise à jour avec succès!' });
  }
}, []);
```

---

## Summary

### What We Built

✅ **Stripe Customer Portal Integration**
- Individual users can manage their billing
- Organization admins can manage org billing
- Secure, role-based access control

✅ **Simplified Email System**
- Removed Resend integration
- Using Stripe automatic emails
- Less code to maintain

✅ **Security-First Design**
- JWT authentication required
- Database ownership validation
- Admin role enforcement for organizations
- Defense in depth (frontend + backend checks)

### Files Modified

1. `/supabase/functions/create-portal-session/index.ts` (NEW)
2. `/supabase/functions/stripe-webhook/index.ts` (MODIFIED)
3. `/src/components/subscription/SubscriptionCard.tsx` (MODIFIED)
4. `/src/components/organization/OrganizationSubscriptionCard.tsx` (MODIFIED)

### Lines of Code

- Edge Function: ~130 lines
- SubscriptionCard: +40 lines
- OrganizationSubscriptionCard: +60 lines
- Webhook changes: -47 lines (removed Resend)
- **Total:** +183 lines (net positive for significant feature)

### Next Steps

1. ✅ Deploy Edge Functions (see Deployment section)
2. ✅ Enable Stripe automatic emails
3. ✅ Test all scenarios (see Testing section)
4. 📝 Consider adding portal access logging (optional)
5. 📝 Consider adding customer.updated webhook handler (optional)

---

**Generated:** 2025-11-05
**Version:** 1.0
**Status:** ✅ Production Ready
**Author:** Claude Code
