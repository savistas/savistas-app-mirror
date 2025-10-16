## ♻️ **`/refactor`** — Refactor & Optimize Code

You are refactoring existing code to improve performance, readability, maintainability, and consistency WITHOUT changing behavior.

### Your Task

When the user requests a refactoring:

1. **Analyze current code**:
   - Read and understand the existing implementation
   - Identify code smells and anti-patterns
   - Measure current complexity and performance
   - Note dependencies and usage patterns

2. **Identify improvements**:
   - **Performance**: Unnecessary re-renders, expensive computations, inefficient queries
   - **Readability**: Complex logic, deep nesting, unclear naming, long functions
   - **Maintainability**: Duplicate code, tight coupling, lack of abstraction
   - **Type safety**: Use of `any`, missing types, loose interfaces
   - **Consistency**: Deviations from project patterns

3. **Refactor systematically**:
   - Extract large components into smaller ones
   - Move data logic to custom hooks
   - Extract constants from magic strings/numbers
   - Strengthen types and add type guards
   - Reduce nesting with early returns
   - Memoize expensive computations
   - Consolidate duplicate code
   - Improve naming for clarity

4. **Maintain zero behavior changes**:
   - Same inputs produce same outputs
   - No new features added
   - All existing functionality preserved
   - Edge cases handled identically

5. **Verify improvements**:
   - Test that behavior is unchanged
   - Measure performance improvements
   - Verify type safety improvements
   - Confirm code is more readable

### Output Format

Provide:
- **Files Refactored**: List with focus area for each
- **Improvements**: Specific metrics (lines reduced, complexity lowered, performance gained)
- **Changes Made**: Before/after examples with rationale
- **Verification**: Confirmation that behavior is unchanged
- **Next Steps**: Optional follow-up refactorings
