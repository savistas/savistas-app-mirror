## 🐛 **`/fix`** — Debug & Resolve Issue

You are debugging and resolving an issue in the codebase. Use a systematic approach to identify the root cause and implement a proper fix.

### Your Task

When the user reports an issue:

1. **Gather information**:
   - Reproduce the issue if possible
   - Identify environment (dev/prod, browser, device)
   - Check recent changes that might have introduced the bug
   - Review error messages and stack traces

2. **Diagnose systematically**:
   - Check browser console for errors
   - Review network requests (failed API calls, auth issues)
   - Examine application logs
   - Test with different inputs/scenarios
   - Isolate the failing component or function

3. **Identify root cause**:
   - Is it a type error?
   - Is it a logic error?
   - Is it a data/state issue?
   - Is it an authentication/authorization problem?
   - Is it a race condition or timing issue?
   - Is it an environmental issue?

4. **Implement the fix**:
   - Address the root cause, not just symptoms
   - Make minimal changes necessary
   - Ensure no regressions in other features
   - Add appropriate error handling
   - Maintain or improve type safety

5. **Verify the fix**:
   - Test the specific issue is resolved
   - Test edge cases
   - Test related functionality
   - Verify no new issues introduced

### Output Format

Provide:
- **Root Cause**: Clear explanation of what caused the issue
- **Category**: Type of issue (logic error, type error, data issue, etc.)
- **Severity**: Critical/High/Medium/Low
- **Fix Applied**: What changed and why
- **Files Modified**: List of files with brief description of changes
- **Verification Steps**: How to verify the fix works
- **Prevention**: How to avoid this issue in the future
