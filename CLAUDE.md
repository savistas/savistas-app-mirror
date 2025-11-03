# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Savistas AI-Cademy is a learning platform built with React, TypeScript, Vite, and Supabase. The application focuses on personalized education with learning disability pre-detection, learning style assessment, and adaptive course management.

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

# Generate TypeScript types from database
npx supabase gen types typescript --local > src/integrations/supabase/types.ts

# Create a new migration
npx supabase migration new <migration_name>

# Apply migrations
npx supabase db push
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

All routes are defined in [src/App.tsx](src/App.tsx):
- `/auth` - Authentication page (login/signup)
- `/reset-password` - Password reset
- `/informations` - Initial information survey (protected)
- `/dashboard` - Main dashboard (protected)
- `/profile` - User profile (protected)
- `/upload-course` - Course upload interface (protected)
- `/calendar` - Calendar view (protected)
- `/planning` - Planning interface (protected)
- `/daily-quiz/:id` - Quiz taking interface (protected)
- `/result/:id` - Quiz results (protected)
- `/messaging` - Messaging interface (protected)
- `/courses/:id` - Course detail page (protected)
- `/terms` - Terms of service
- `/privacy` - Privacy policy
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2bWticGtvY2N4cG1mcHhoYWN2Iiwicm9sZS
I6ImFub24iLCJpYXQiOjE3NTQ3NzY2MTEsImV4cCI6MjA3MDM1MjYxMX0.I6XUsURaSpVwsZY-DrFw6tAUY50nzFkDBM4FqoPJpm4
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
- `profiles` - User profile data with completion flags
  - `troubles_detection_completed`: Boolean for troubles questionnaire
  - `learning_styles_completed`: Boolean for learning styles survey
  - `survey_completed`: Boolean for general survey completion

- `troubles_questionnaire_reponses` - Raw questionnaire responses (13 questions)
- `troubles_detection_scores` - Calculated scores for 10 different learning disabilities
- `courses` - Course content and metadata
- `quizzes` - Quiz data linked to courses
- `user_quiz_attempts` - User quiz attempts and scores

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

## Known Issues & Considerations

1. **Dialog State Management**: The troubles detection and learning styles dialogs have complex state interdependencies. Always check completion flags before opening dialogs.

2. **Supabase RLS**: Row-level security is enabled. Always filter by `user_id` and ensure policies allow operations.

3. **French Language**: UI is primarily in French. Maintain French for user-facing strings.

4. **Lovable Integration**: Project was originally created on Lovable platform. The `lovable-tagger` plugin is used in development mode.

## Testing Strategy

When testing survey/questionnaire flows:
1. Check database state in `profiles` table
2. Verify completion flags are correctly set
3. Test "Modify/Refaire" button behavior
4. Ensure no duplicate dialogs appear
5. Validate data is saved to both response and scores tables

See [VALIDATION_QUESTIONNAIRES_LOGIC.md](VALIDATION_QUESTIONNAIRES_LOGIC.md) for specific test scenarios.
