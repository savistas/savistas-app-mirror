## 🔍 **`/review`** — Code Review

Perform a comprehensive code review focusing on correctness, security, performance, accessibility, and best practices.

### Your Task

When the user provides code or a file to review:

1. **Analyze the code across dimensions**:
   - **Correctness**: Does it work as intended? Are edge cases handled?
   - **Security**: Are there vulnerabilities? Is data validated? Are permissions checked?
   - **Performance**: Are there inefficiencies? Unnecessary re-renders? Memory leaks?
   - **Readability**: Is the code clear? Are names descriptive? Is complexity reasonable?
   - **Accessibility**: Keyboard navigation? Screen readers? Color contrast?
   - **Best Practices**: Following framework conventions? Proper patterns used?

2. **Identify issues by severity**:
   - **Critical**: Security vulnerabilities, logic errors, data loss risks
   - **Warning**: Performance issues, type safety problems, accessibility gaps
   - **Suggestion**: Readability improvements, minor optimizations, style consistency

3. **Provide actionable feedback**:
   - Point out specific problems with line references
   - Explain WHY something is an issue
   - Show HOW to fix it with code examples
   - Suggest better alternatives

4. **Acknowledge strengths**:
   - Highlight well-written parts
   - Note good patterns used
   - Recognize thoughtful design decisions

### Output Format

Structure your review as:
- **Overall Assessment**: Excellent/Good/Needs Improvement/Critical Issues
- **Summary**: Brief overview in 1-2 sentences
- **Critical Issues**: Must-fix problems with severity, location, problem, solution, and impact
- **Warnings**: Should-fix issues with suggestions
- **Suggestions**: Nice-to-have improvements
- **Strengths**: Positive aspects of the code
- **Action Items**: Prioritized list of what should be done
