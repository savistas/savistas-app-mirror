# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Savistas AI-Cademy is a comprehensive learning platform built with React, TypeScript, Vite, and Supabase. The application focuses on personalized education with learning disability pre-detection, learning style assessment, adaptive course management, and B2B organization management.

### Key Features
- **Adaptive Learning**: Personalized learning paths based on detected learning disabilities and styles
- **Subscription Management**: Tiered subscription plans (Basic, Premium, Pro) with usage tracking via Stripe
- **B2B Organizations**: School and company organization management with admin validation
- **AI-Powered Features**: Virtual teacher (ElevenLabs/Equos), AI-generated revision sheets and quizzes
- **Error Tracking**: "Cahier d'erreurs" for tracking and revising student mistakes

## Development Commands

### Essential Commands
```bash
# Install dependencies
npm i

# Start development server (runs on http://localhost:8080)
npm run dev

# Build for production
npm run build

# Build in development mode (useful for debugging)
npm run build:dev

# Preview production build
npm run preview

# Run linter
npm run lint
```

### Supabase Commands
```bash
# Initialize local Supabase (requires Docker)
npx supabase start

# Stop local Supabase
npx supabase stop

# Check Supabase status
npx supabase status

# Generate TypeScript types from database
npx supabase gen types typescript --local > src/integrations/supabase/types.ts

# Create a new migration
npx supabase migration new <migration_name>

# Apply migrations
npx supabase db push
```

### Stripe CLI Commands
```bash
# Check Stripe CLI version
~/.local/bin/stripe --version

# Configure Stripe CLI
~/.local/bin/stripe config

# Login to Stripe
~/.local/bin/stripe login

# List webhook endpoints
~/.local/bin/stripe webhook_endpoints list

# View recent events
~/.local/bin/stripe events

# Listen to webhooks locally
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
```

## Architecture Overview

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite + SWC
- **UI Framework**: shadcn/ui (Radix UI primitives) + Tailwind CSS
- **Routing**: React Router v6
- **State Management**: React Context (AuthContext) + TanStack Query
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts

### Project Structure

```
src/
├── pages/                  # Page components (route-level)
│   ├── Auth.tsx           # Login/Signup page
│   ├── Dashboard.tsx      # Main dashboard with surveys
│   ├── Profile.tsx        # User profile management
│   ├── DailyQuiz.tsx      # Quiz interface
│   ├── Result.tsx         # Quiz results
│   └── ...
├── components/            # Reusable components
│   ├── ui/               # shadcn/ui components (DO NOT manually edit)
│   ├── register/         # Registration flow components
│   ├── ProtectedRoute.tsx
│   ├── ProfileCompletionGuard.tsx
│   ├── InformationSurveyDialog.tsx
│   └── TroublesDetectionDialog.tsx
├── contexts/
│   └── AuthContext.tsx    # Authentication state management
├── hooks/                 # Custom React hooks
│   ├── useProfileCompletion.ts
│   └── use-mobile.tsx
├── integrations/
│   └── supabase/
│       ├── client.ts      # Supabase client instance
│       └── types.ts       # Auto-generated DB types
├── lib/
│   └── utils.ts          # Utility functions (cn for className merging)
└── types/
    └── troubles.ts       # TypeScript type definitions
```

### Routing Structure

All routes are defined in [src/App.tsx](src/App.tsx). The app supports two routing modes:

#### Public Routes
- `/auth` - Authentication page (login/signup)
- `/reset-password` - Password reset
- `/terms` - Terms of service
- `/privacy` - Privacy policy

#### Protected Routes (with Layout/BottomNav)

**Admin Routes (contact.savistas@gmail.com only)**:
- `/admin` - Admin dashboard
- `/admin/organization-requests` - B2B organization validation backoffice

**Role-based Routes** (pattern: `/:role/route`):
- `/:role/dashboard` - Main dashboard
- `/:role/dashboard-organization` - Organization dashboard (B2B)
- `/:role/creation-request` - Organization request status
- `/:role/profile` - User profile with subscription management
- `/:role/upload-course` - Course upload interface
- `/:role/calendar` - Calendar view
- `/:role/planning` - Planning interface
- `/:role/daily-quiz/:id` - Quiz taking interface
- `/:role/result/:id` - Quiz results
- `/:role/messaging` - Messaging interface
- `/:role/progression` - Progress tracking
- `/:role/cahier-erreurs` - Error notebook
- `/:role/courses/:id` - Course detail page
- `/:role/professeur-virtuel` - Virtual teacher (ElevenLabs)
- `/:role/professeur-particulier-virtuel` - Private virtual teacher (Equos)
- `/:role/documents` - Student documents
- `/:role/revision-sheets` - Student revision sheets

**Special Routes**:
- `/student/revision-sheets` - Revision sheets listing
- `/student/revision-sheets/:courseId/ai-session` - AI-powered revision session

**Legacy Routes** (without role prefix for backward compatibility):
- `/dashboard`, `/profile`, `/upload-course`, etc.
### Authentication Flow

1. **AuthContext** ([src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx)) provides:
   - `user`: Current user object
   - `session`: Active session
   - `loading`: Loading state
   - `signUp`, `signIn`, `signOut` methods

2. **ProtectedRoute** wraps all authenticated routes and redirects to `/auth` if not logged in

3. **ProfileCompletionGuard** manages onboarding flow (surveys and questionnaires)

### Database Schema (Supabase)

Key tables:

**User Management**:
- `profiles` - User profile data with completion flags, role, and subscription info
  - `troubles_detection_completed`: Boolean for troubles questionnaire
  - `learning_styles_completed`: Boolean for learning styles survey
  - `survey_completed`: Boolean for general survey completion
  - `role`: 'student' | 'parent' | 'professor' | 'school' | 'company'
  - `subscription`: 'basic' | 'premium' | 'pro'

**Learning Disabilities & Styles**:
- `troubles_questionnaire_reponses` - Raw questionnaire responses (13 questions)
- `troubles_detection_scores` - Calculated scores for 10 different learning disabilities
- `learning_styles` - User learning style preferences and assessments

**Course Management**:
- `courses` - Course content and metadata
- `quizzes` - Quiz data linked to courses
- `user_quiz_attempts` - User quiz attempts and scores
- `fiches_revision` - Revision sheets generated from courses
- `user_errors` - Student error tracking (cahier d'erreurs)
- `error_revision` - Error revision sessions and progress

**Subscription & Usage (Stripe Integration)**:
- `user_subscriptions` - Stripe subscription data and AI minutes purchased
- `monthly_usage` - Tracks monthly resource usage (courses, exercises, fiches, AI minutes)

**B2B Organizations**:
- `organizations` - School/company organization data with validation status
- `organization_members` - Organization membership with roles
- `organization_requests` - Pending organization creation requests for admin validation

**Email Registry**:
- `emails_registry` - Tracks sent emails to prevent duplicates

### Critical Onboarding Logic

The application has a **specific order** for onboarding dialogs (see [VALIDATION_QUESTIONNAIRES_LOGIC.md](VALIDATION_QUESTIONNAIRES_LOGIC.md)):

1. **First**: Troubles Detection Dialog (13-question assessment)
2. **Second**: Learning Styles Dialog
3. Both must be completed before accessing main features

**Important Rules**:
- When user clicks "Modify/Refaire le test" for troubles ONLY, do NOT re-trigger the learning styles dialog
- Only reset both dialogs when user explicitly requests "Refaire les questionnaires de prédétection" from profile page
- Check completion flags in `profiles` table before showing dialogs

### Troubles Detection Feature

The troubles detection system (see [IMPLEMENTATION_TROUBLES_SECTION.md](IMPLEMENTATION_TROUBLES_SECTION.md)) displays:

1. **Medical Diagnosis** (if declared): Blue banner with priority display
2. **QCM Results**: Color-coded badges for 10 different learning disabilities
   - Green = "Faible" (Low)
   - Orange = "Modéré" (Moderate)
   - Red = "Élevé" (High)
   - Dark Red = "Très élevé" (Very High)
3. Only shows scores that are NOT "Faible"

Color mapping function:
```typescript
const getTroubleColor = (level: string) => {
  switch (level) {
    case 'Faible': return 'bg-green-100 text-green-800 border-green-200';
    case 'Modéré': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'Élevé': return 'bg-red-100 text-red-800 border-red-200';
    case 'Très élevé': return 'bg-red-200 text-red-900 border-red-300';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};
```

## Subscription & Payments System

The platform implements a comprehensive subscription system with Stripe integration. See [SUBSCRIPTION_IMPLEMENTATION.md](SUBSCRIPTION_IMPLEMENTATION.md) for full details.

### Plans and Pricing

| Feature | Basic (Free) | Premium (9.90€) | Pro (19.90€) |
|---------|-------------|----------------|--------------|
| Courses/month | 2 | 10 | 30 |
| Exercises/month | 2 | 10 | 30 |
| Revision sheets/month | 2 | 10 | 30 |
| AI Minutes | 3 + purchases | 0 + purchases | 0 + purchases |

### Key Components
- `<SubscriptionCard />` - Display subscription info in Profile page
- `<UpgradeDialog />` - Modal for upgrading plans or purchasing AI minutes
- `<LimitReachedDialog />` - Modal shown when usage limits are reached
- `<PlanSelectionCards />` - Plan comparison and selection
- `<PlanDetailsDialog />` - Detailed plan information

### Hooks
- `useSubscription()` - Get subscription and limits
- `useUsageLimits()` - Track usage and check limits
- `useConversationTimeLimit()` - Manage AI conversation time limits

### Edge Functions
- `stripe-webhook` - Handle Stripe events (NO JWT verification needed)
- `create-checkout-session` - Create Stripe checkout sessions
- `check-usage-limits` - Verify usage limits server-side
- `reset-usage-periods` - Monthly reset cron job
- `cancel-subscription` - Cancel user subscriptions

### Usage Tracking
Always check limits before creating resources and increment after success:

```typescript
import { useUsageLimits } from '@/hooks/useUsageLimits';
import { incrementUsage } from '@/services/usageService';

const { canCreate } = useUsageLimits();

// Before creating
if (!canCreate('course')) {
  setShowLimitDialog(true);
  return;
}

// After successful creation
await incrementUsage(userId, 'course', 1);
```

### Proration Logic
When users upgrade (e.g., Premium → Pro), Stripe automatically calculates prorated charges. See [SUBSCRIPTION_UPGRADE_GUIDE.md](SUBSCRIPTION_UPGRADE_GUIDE.md).

## B2B Organization Management

The platform supports B2B organizations (schools and companies) with an admin validation system. See [BACKOFFICE_ADMIN_GUIDE.md](BACKOFFICE_ADMIN_GUIDE.md).

### Organization Creation Flow
1. User with role 'school' or 'company' submits organization request
2. Request stored in `organization_requests` table with status 'pending'
3. Admin (contact.savistas@gmail.com) reviews in `/admin/organization-requests`
4. Admin approves or rejects request
5. If approved, organization is created and admin becomes organization admin

### Key Components
- `OrganizationProfileForm` - Form for requesting organization creation
- `AdminOrganizationRequests` - Admin backoffice page for validating requests
- `OrganizationRequestCard` - Display individual organization requests
- `DashboardOrganization` - Organization management dashboard

### Hooks
- `useAdminAccess()` - Check if user is admin (contact.savistas@gmail.com)
- `useOrganizationRequests()` - Manage organization requests
- `useOrganization()` - Get organization data
- `useOrganizationMembers()` - Manage organization members
- `useOrganizationCode()` - Generate and validate organization codes

## AI-Powered Features

### Virtual Teacher (ElevenLabs)
- Agent ID: `agent_5901k7s57ptne94thf6jaf9ngqas`
- Location: `src/pages/VirtualTeacher.tsx`
- Uses conversation time tracking with AI minutes
- See [VERIFY_AI_MINUTES.md](VERIFY_AI_MINUTES.md) for verification steps

### Private Virtual Teacher (Equos)
- Uses Equos SDK for advanced AI conversations
- Dynamic instruction generation based on user profile
- Location: `src/pages/ProfesseurParticulierVirtuel.tsx`
- See [CONFIGURATION_EQUOS.md](CONFIGURATION_EQUOS.md)

### AI-Generated Content
- Revision sheets: Generated via `generate-revision-sheet` Edge Function
- Quizzes: Generated via `generate-quiz-from-fiche` Edge Function
- Error reports: AI-powered analysis of student errors

## UI Component Guidelines

### shadcn/ui Components
- Located in `src/components/ui/`
- **DO NOT manually edit** - these are managed by shadcn CLI
- Add new components with: `npx shadcn-ui@latest add <component-name>`
- Configure via [components.json](components.json)

### Styling
- Use Tailwind CSS utility classes
- Use `cn()` from `@/lib/utils` for conditional class merging
- Colors defined in [tailwind.config.ts](tailwind.config.ts)
- Custom scrollbar hiding via `tailwind-scrollbar-hide`

### Forms
- Use React Hook Form with Zod validation
- Import resolver: `@hookform/resolvers/zod`
- Example pattern in registration components

## Common Patterns

### Supabase Queries
```typescript
// Import client
import { supabase } from '@/integrations/supabase/client';

// Query example
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('user_id', user.id)
  .single();

// Insert/Update
await supabase
  .from('profiles')
  .update({ troubles_detection_completed: true })
  .eq('user_id', user.id);
```

### TanStack Query Pattern
```typescript
import { useQuery, useMutation } from '@tanstack/react-query';

const { data, isLoading } = useQuery({
  queryKey: ['key'],
  queryFn: async () => { /* fetch logic */ }
});
```

### Protected Routes
```typescript
<Route path="/page" element={
  <ProtectedRoute>
    <PageComponent />
  </ProtectedRoute>
} />
```

## Important Notes

### Path Aliases
- `@/` maps to `src/` directory (configured in [vite.config.ts](vite.config.ts))
- Always use `@/` imports for consistency

### Environment Variables
- Supabase credentials are hardcoded in [src/integrations/supabase/client.ts](src/integrations/supabase/client.ts)
- Project ID: `vvmkbpkoccxpmfpxhacv`

### Mobile Responsiveness
- Use `useIsMobile()` hook from `@/hooks/use-mobile`
- Bottom navigation component available: `<BottomNav />`
- Test at breakpoints: mobile (< 768px), tablet (768-1024px), desktop (> 1024px)

### Debugging Files
Several debugging scripts exist in the root:
- `debug-troubles.js` - Debug troubles detection
- `debug-delete-troubles.js` - Delete troubles data
- `test-troubles.js` - Test troubles functionality
- `test-retake-functionality.js` - Test retake logic
- `migrate-troubles.js` - Migration script

These are development utilities and should not be deleted.

## Services Layer

The application includes several service modules for business logic:

### Key Services
- `usageService.ts` - Subscription usage tracking and limit checking
- `elevenLabsService.ts` / `elevenLabsAgentService.ts` - ElevenLabs AI integration
- `equosService.ts` / `equosAgentService.ts` - Equos AI integration
- `revisionSheetService.ts` - Revision sheet generation
- `documentService.ts` - Document management
- `errorRevisionService.ts` - Error tracking and revision
- `learningStylesAnalyzer.ts` - Learning style analysis
- `systemPromptGenerator.ts` - Dynamic AI prompt generation

## Known Issues & Considerations

1. **Dialog State Management**: The troubles detection and learning styles dialogs have complex state interdependencies. Always check completion flags before opening dialogs.

2. **Supabase RLS**: Row-level security is enabled. Always filter by `user_id` and ensure policies allow operations.

3. **French Language**: UI is primarily in French. Maintain French for user-facing strings.

4. **Lovable Integration**: Project was originally created on Lovable platform. The `lovable-tagger` plugin is used in development mode.

5. **Stripe Webhooks**: The `stripe-webhook` Edge Function must be deployed with `--no-verify-jwt` flag as it receives unsigned requests from Stripe.

6. **AI Minutes Tracking**: Conversation duration is tracked and rounded up to nearest minute. Minutes purchased accumulate without expiration, while subscription limits reset monthly.

7. **Organization Validation**: Only the admin email (contact.savistas@gmail.com) can approve/reject organization requests. This is enforced via RLS policies.

## Testing Strategy

### Survey/Questionnaire Testing
When testing survey/questionnaire flows:
1. Check database state in `profiles` table
2. Verify completion flags are correctly set
3. Test "Modify/Refaire" button behavior
4. Ensure no duplicate dialogs appear
5. Validate data is saved to both response and scores tables

See [VALIDATION_QUESTIONNAIRES_LOGIC.md](VALIDATION_QUESTIONNAIRES_LOGIC.md) for specific test scenarios.

### Subscription Testing
Test subscription upgrades using Stripe test mode:
1. Use test card `4242 4242 4242 4242` for payments
2. Verify proration calculations are correct
3. Check webhook events are received and processed
4. Validate database updates in `user_subscriptions` and `monthly_usage`
5. Test limit enforcement for each resource type

See [SUBSCRIPTION_IMPLEMENTATION.md](SUBSCRIPTION_IMPLEMENTATION.md) for detailed testing procedures.

### Organization Testing
Test B2B organization flows:
1. Create organization request with school/company role
2. Verify request appears in admin backoffice
3. Test approval creates organization and adds admin member
4. Test rejection stores reason correctly
5. Verify RLS policies prevent unauthorized access

See [BACKOFFICE_ADMIN_GUIDE.md](BACKOFFICE_ADMIN_GUIDE.md) for test cases.

## Deployment & Maintenance

### Edge Functions Deployment
```bash
# Deploy all functions
npx supabase functions deploy stripe-webhook --no-verify-jwt
npx supabase functions deploy create-checkout-session
npx supabase functions deploy check-usage-limits
npx supabase functions deploy reset-usage-periods
npx supabase functions deploy cancel-subscription
npx supabase functions deploy generate-revision-sheet
npx supabase functions deploy generate-quiz-from-fiche
npx supabase functions deploy create-equos-session
npx supabase functions deploy create-equos-agent
```

### Setting Secrets
```bash
# Stripe secrets
npx supabase secrets set STRIPE_SECRET_KEY=sk_live_...
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...

# Other API keys (if needed)
npx supabase secrets set ELEVENLABS_API_KEY=sk_...
npx supabase secrets set EQUOS_API_KEY=...
```

### Cron Jobs
Configure via Supabase Dashboard or SQL for:
- Monthly usage reset (`reset-usage-periods`)
- Should run hourly or daily to catch expired subscriptions

### Migration Management
```bash
# Apply all pending migrations
npx supabase db push

# Create new migration
npx supabase migration new <migration_name>

# Regenerate types after schema changes
npx supabase gen types typescript --local > src/integrations/supabase/types.ts
```

## Important Documentation Files

- [SUBSCRIPTION_IMPLEMENTATION.md](SUBSCRIPTION_IMPLEMENTATION.md) - Complete subscription system docs
- [SUBSCRIPTION_UPGRADE_GUIDE.md](SUBSCRIPTION_UPGRADE_GUIDE.md) - Proration and upgrade logic
- [BACKOFFICE_ADMIN_GUIDE.md](BACKOFFICE_ADMIN_GUIDE.md) - B2B organization validation
- [VALIDATION_QUESTIONNAIRES_LOGIC.md](VALIDATION_QUESTIONNAIRES_LOGIC.md) - Onboarding flow
- [IMPLEMENTATION_TROUBLES_SECTION.md](IMPLEMENTATION_TROUBLES_SECTION.md) - Troubles detection
- [VERIFY_AI_MINUTES.md](VERIFY_AI_MINUTES.md) - AI minutes verification
- [CONFIGURATION_EQUOS.md](CONFIGURATION_EQUOS.md) - Equos integration
- [A_FAIRE_MAINTENANT.md](A_FAIRE_MAINTENANT.md) - Current TODO items
