# Migration Instructions: Questionnaire Flags Synchronization

## Overview
This migration adds database triggers to automatically synchronize questionnaire completion flags in the `profiles` table based on actual questionnaire data. This ensures perfect consistency between flags and data.

## What Changed

### Database Triggers Added
Three triggers have been created to automatically manage completion flags:

1. **`sync_troubles_detection_flag()`** - Updates `troubles_detection_completed`
   - Triggers on INSERT/UPDATE/DELETE of `troubles_questionnaire_reponses`
   - Triggers on INSERT/UPDATE/DELETE of `troubles_detection_scores`
   - Sets flag to `true` only when ALL 13 questions are answered AND scores exist
   - Sets flag to `false` when data is deleted or incomplete

2. **`sync_learning_styles_flag()`** - Updates `learning_styles_completed`
   - Triggers on INSERT/UPDATE/DELETE of `styles_apprentissage`
   - Sets flag to `true` only when ALL 12 scores are present and non-null
   - Sets flag to `false` when data is deleted

3. **`sync_survey_flag()`** - Updates `survey_completed`
   - Triggers on INSERT/UPDATE/DELETE of `profiles_infos`
   - Sets flag to `true` only when ALL 10 questions are answered
   - Sets flag to `false` when data is deleted

### Frontend Changes
- **TroublesDetectionDialog.tsx** (lines 416-420, 475, 546-560)
  - Removed manual `UPDATE profiles SET troubles_detection_completed = true`
  - Triggers now handle this automatically

- **Profile.tsx** (handleRetakeQuestionnaires function, lines 461-504)
  - Changed from manually setting flags to false
  - Now deletes questionnaire data (triggers auto-reset flags)

- **New Hook: useQuestionnaireStatus.ts**
  - Provides reactive access to completion status
  - Cached for 5 minutes for performance
  - Can be used by chatbot/n8n for personalization

## How to Apply Migration

### Option 1: Supabase Dashboard (RECOMMENDED)
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/vvmkbpkoccxpmfpxhacv/sql/new)
2. Copy the contents of `supabase/migrations/20251014102734_sync_questionnaire_flags.sql`
3. Paste into SQL Editor
4. Click "Run" to execute

### Option 2: Supabase CLI (if linked)
```bash
# If you have the database password
npx supabase link --project-ref vvmkbpkoccxpmfpxhacv
npx supabase db push
```

### Option 3: Manual SQL Execution
1. Connect to your Supabase PostgreSQL database
2. Execute the migration file:
```bash
psql -h aws-0-eu-west-3.pooler.supabase.com -U postgres.vvmkbpkoccxpmfpxhacv -d postgres -f supabase/migrations/20251014102734_sync_questionnaire_flags.sql
```

## What the Migration Does

### 1. Data Cleanup (First-time only)
```sql
-- Resets all flags to false
UPDATE profiles SET
  survey_completed = false,
  troubles_detection_completed = false,
  learning_styles_completed = false;

-- Then re-enables flags where data is actually complete
-- (checks all questions/scores are present)
```

### 2. Creates Trigger Functions
- Checks if complete data exists in questionnaire tables
- Updates corresponding flag in profiles table
- Works on INSERT, UPDATE, and DELETE operations

## Testing the Migration

### Test Case 1: Complete Troubles Questionnaire
✅ **Expected:** `troubles_detection_completed` → `true`
```sql
-- Check flag status
SELECT troubles_detection_completed FROM profiles WHERE user_id = '<your-user-id>';
```

### Test Case 2: Partial Questionnaire (abandon)
✅ **Expected:** Flag stays `false`
```sql
-- Insert partial data (only 5 of 13 questions)
INSERT INTO troubles_questionnaire_reponses (user_id, q1_attention, q2_lecture)
VALUES ('<user-id>', 'A', 'B');

-- Check flag - should still be false
SELECT troubles_detection_completed FROM profiles WHERE user_id = '<user-id>';
```

### Test Case 3: Delete Questionnaire Data
✅ **Expected:** Flag automatically resets to `false`
```sql
-- Delete data
DELETE FROM troubles_questionnaire_reponses WHERE user_id = '<user-id>';
DELETE FROM troubles_detection_scores WHERE user_id = '<user-id>';

-- Check flag - should be false
SELECT troubles_detection_completed FROM profiles WHERE user_id = '<user-id>';
```

### Test Case 4: Learning Styles Completion
✅ **Expected:** `learning_styles_completed` → `true` when all 12 scores exist
```sql
SELECT learning_styles_completed FROM profiles WHERE user_id = '<your-user-id>';
```

## Rollback Instructions (if needed)

If you need to rollback this migration:

```sql
-- Drop triggers
DROP TRIGGER IF EXISTS trigger_sync_troubles_reponses ON troubles_questionnaire_reponses;
DROP TRIGGER IF EXISTS trigger_sync_troubles_scores ON troubles_detection_scores;
DROP TRIGGER IF EXISTS trigger_sync_learning_styles ON styles_apprentissage;
DROP TRIGGER IF EXISTS trigger_sync_survey ON profiles_infos;

-- Drop functions
DROP FUNCTION IF EXISTS sync_troubles_detection_flag();
DROP FUNCTION IF EXISTS sync_learning_styles_flag();
DROP FUNCTION IF EXISTS sync_survey_flag();
```

⚠️ **Note:** If you rollback, you'll need to manually manage flags again in the frontend code.

## Benefits

### Before Migration ❌
- Flags set to `true` at the start of questionnaires
- Flags didn't reset when data deleted
- Chatbot couldn't trust flags for personalization
- Manual flag management prone to bugs

### After Migration ✅
- Flags automatically sync with actual data
- Single source of truth (database)
- Works even with direct DB modifications
- No frontend code needed for flag management
- Chatbot can reliably use flags

## n8n Integration

The chatbot (n8n) can now use the `useQuestionnaireStatus` hook or query flags directly:

```typescript
// In your chatbot/messaging component
import { useQuestionnaireStatus } from '@/hooks/useQuestionnaireStatus';

const { data: status } = useQuestionnaireStatus();

const getChatbotContext = () => {
  let context = "L'utilisateur est un étudiant.";

  if (status?.hasTroublesData) {
    context += " Adapte tes réponses selon ses troubles détectés.";
  }

  if (status?.hasLearningStylesData) {
    context += " Utilise ses styles d'apprentissage préférés.";
  }

  if (status?.hasSurveyData) {
    context += " Tiens compte de ses informations de profil.";
  }

  return context;
};
```

## Troubleshooting

### Issue: Flags not updating
**Solution:** Check that migration was applied successfully:
```sql
-- Verify triggers exist
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public';
```

### Issue: Performance concerns
**Solution:** Triggers are optimized with:
- Single UPDATE per trigger execution
- Index-friendly queries (user_id filter)
- No unnecessary data fetching

### Issue: Flags stuck at wrong value
**Solution:** Manually run the data cleanup part of the migration:
```sql
-- Reset all flags
UPDATE profiles SET troubles_detection_completed = false WHERE troubles_detection_completed = true;

-- Then complete a questionnaire to trigger auto-update
```

## Contact

For questions or issues with this migration:
- Check CLAUDE.md for project documentation
- Review VALIDATION_QUESTIONNAIRES_LOGIC.md for business logic
- See migration file: `supabase/migrations/20251014102734_sync_questionnaire_flags.sql`
