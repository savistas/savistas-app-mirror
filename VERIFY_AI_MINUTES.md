# AI Agent Minutes Verification Guide

## Current Configuration

**ElevenLabs Agent ID:** `agent_5901k7s57ptne94thf6jaf9ngqas`
**Location:** `src/pages/VirtualTeacher.tsx:31`

## Verification Steps

### 1. Verify ElevenLabs Agent Name
```bash
# Check what agent name is configured in ElevenLabs dashboard
curl -X GET "https://api.elevenlabs.io/v1/convai/agents/agent_5901k7s57ptne94thf6jaf9ngqas" \
  -H "xi-api-key: sk_634179baf28c2e9e6b47f016522d147f7d4aaebcee2000e8"
```

This will show you the agent's name and confirm if it's "Ultrathink" or something else.

### 2. Test Minutes Deduction

1. **Before test:** Check user's minutes balance
   ```sql
   SELECT
     ai_minutes_purchased,
     (SELECT ai_minutes_used FROM monthly_usage WHERE user_id = profiles.user_id) as used
   FROM user_subscriptions
   JOIN profiles ON profiles.user_id = user_subscriptions.user_id
   WHERE profiles.id = 'YOUR_USER_ID';
   ```

2. **Run test:** Have a 2-minute conversation with the virtual teacher

3. **After test:** Check if minutes were deducted
   ```sql
   -- Should show 2 minutes added to ai_minutes_used
   SELECT * FROM monthly_usage WHERE user_id = 'YOUR_USER_ID';
   ```

### 3. Verify Stripe Products Match

Check that purchased AI minute packs are correctly mapped:

| Product ID | Minutes | Price | Status |
|-----------|---------|-------|--------|
| `prod_TKZEb1hffKMjt9` | 10 min | €5 | ✅ Mapped |
| `prod_TKZEPlyD9oRz7p` | 30 min | €15 | ✅ Mapped |
| `prod_TKZE9LG0MXrH1i` | 60 min | €20 | ✅ Mapped |

**Verification code:** `supabase/functions/stripe-webhook/index.ts:39-43`

### 4. Check Usage Tracking

The `incrementUsage()` function should be called when the conversation ends:

**File:** `src/pages/VirtualTeacher.tsx:312`
```typescript
await incrementUsage(user.id, 'ai_minutes', durationMinutes);
```

This updates the PostgreSQL database via the `increment_usage()` function.

### 5. Test Limit Enforcement

1. Exhaust all available AI minutes
2. Try to start a new conversation
3. Should see: `LimitReachedDialog` component
4. Should offer: "Acheter des minutes IA" button

## Common Issues

### Issue: Minutes not deducting
**Cause:** `onDisconnect` handler not firing
**Fix:** Check ElevenLabs conversation status in console logs

### Issue: Wrong amount deducted
**Cause:** `Math.ceil()` rounds up to nearest minute
**Expected:** 1.5 min conversation = 2 minutes charged

### Issue: Purchased minutes not showing
**Cause:** Stripe webhook not processing correctly
**Debug:** Check `supabase/functions/stripe-webhook` logs

## Questions to Answer

1. **What is "Ultrathink"?**
   - Is it the name of the ElevenLabs agent?
   - Is it a different AI service you want to integrate?
   - Is it a future feature?

2. **Is the current agent the correct one?**
   - Agent ID: `agent_5901k7s57ptne94thf6jaf9ngqas`
   - Should minutes be tracked for THIS specific agent?

3. **Are there multiple agents planned?**
   - If yes, each agent should track minutes separately
   - Current implementation uses ONE agent for all conversation types

## Contact

If you need to:
- Change the agent ID
- Integrate a different AI service (like "Ultrathink")
- Add multiple agents with separate minute tracking

Please provide more details about the "Ultrathink" integration.
