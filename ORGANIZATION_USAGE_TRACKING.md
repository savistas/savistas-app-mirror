# Organization Member Usage Tracking

## Overview
Added usage tracking columns to the organization members table in the `/school` and `/company` dashboard to track individual member usage of organization benefits.

## Features Implemented

### 1. Usage Tracking Columns
The "Gestion des membres" data table now displays the following columns for **active members only**:

| Column | Format | Description | Limit |
|--------|--------|-------------|-------|
| **Exercices** | Remaining/Max | Number of exercises remaining | 30/month |
| **Fiches** | Remaining/Max | Number of revision sheets remaining | 30/month |
| **Minutes IA** | Remaining/Max | AI Agent minutes remaining | 60/month |
| **Cours** | Count only | Number of courses created | Unlimited |

### 2. Display Logic
- **Active Members**: Show full usage data in "Tous" and "Actifs" tabs
- **Pending Members**: No usage columns shown (they don't have access yet)
- **Visual Indicators**:
  - Normal display when usage is available
  - Red text when limit is reached (0 remaining)
  - Loading state while fetching data

### 3. Files Created/Modified

#### New Files:
- `/src/hooks/useOrganizationMembersUsage.ts` - Custom hook to fetch and manage organization member usage data

#### Modified Files:
- `/src/components/MembersTable.tsx` - Updated to display usage columns
- `/src/pages/DashboardOrganization.tsx` - Pass organizationId prop to MembersTable

### 4. Monthly Reset Functionality

Usage limits are **automatically reset every month** based on the organization's subscription billing cycle. The reset is handled by the PostgreSQL function `get_or_create_org_usage_period()` which:

1. Calculates the current billing period based on the organization subscription's anniversary date
2. Automatically creates a new usage record with all counters reset to 0 when a new period begins
3. Preserves historical usage data from previous periods

**No manual intervention or cron jobs needed** - resets happen automatically when members use resources in a new billing period.

## Usage Limits (All B2B Plans)

All organization plans (PRO, MAX, ULTRA) have the same per-student limits:

- ✅ **Courses**: Unlimited
- ✅ **Exercises**: 30 per month
- ✅ **Fiches de révision**: 30 per month
- ✅ **AI Avatar Minutes**: 60 per month

## Technical Details

### Database Schema
Usage data is stored in the `organization_monthly_usage` table with the following structure:

```sql
organization_monthly_usage (
  id uuid PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id),
  user_id uuid REFERENCES auth.users(id),
  period_start date,
  period_end date,
  courses_created integer DEFAULT 0,
  exercises_created integer DEFAULT 0,
  fiches_created integer DEFAULT 0,
  ai_minutes_used integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)
```

### Key Functions

#### `useOrganizationMembersUsage(organizationId)`
Custom React hook that fetches all member usage for an organization.

**Returns:**
- `membersUsage`: Array of usage data for all members
- `isLoading`: Loading state
- `getUserUsage(userId)`: Get usage for a specific user
- `getRemaining(userId, resourceType)`: Get remaining count for a resource

**Example:**
```typescript
const { getRemaining, isLoading } = useOrganizationMembersUsage(organizationId);
const exercisesData = getRemaining(userId, 'exercises');
// Returns: { current: 10, max: 30, remaining: 20 }
```

### Service Layer

The existing `organizationSubscriptionService.ts` already provides:
- `getOrganizationMembersUsage(organizationId, periodStart?)` - Fetch usage for all members
- `getOrganizationMonthlyUsage(organizationId, userId)` - Get/create current period usage
- `incrementOrganizationUsage(organizationId, userId, resourceType, amount)` - Increment usage counters

## Testing

To verify the implementation:

1. Navigate to `/school/dashboard-organization` or `/company/dashboard-organization`
2. Ensure you have active members in your organization
3. Check the "Gestion des membres" section
4. Verify usage columns are displayed for active members
5. Create resources (exercises, fiches, courses) and verify counters increment
6. Wait for the next billing period to verify automatic reset

## Future Enhancements

Potential improvements:
- Add usage trend graphs for organization admins
- Email notifications when members approach limits
- Bulk usage reports export
- Per-member usage analytics dashboard
