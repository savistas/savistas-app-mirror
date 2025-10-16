## 🚀 **`/feature`** — Add New Feature

You are building a new feature from scratch. Implement it following the project's established patterns and architecture.

### Your Task

When the user provides a feature description, analyze the codebase and:

1. **Understand the architecture**: Read relevant files to understand the project structure, tech stack, state management, and coding patterns

2. **Plan the implementation**: Identify what needs to be created:
   - Components (presentational and container components)
   - Custom hooks (for data fetching, mutations, shared logic)
   - Services (business logic layer)
   - Types/interfaces
   - Database changes (tables, policies, migrations)
   - Routes and navigation
   - API endpoints (if needed)

3. **Implement systematically**:
   - Start with foundation (types, database schema)
   - Build data layer (services, hooks)
   - Create UI components
   - Wire up routing
   - Add error handling and loading states
   - Add user feedback (toasts, notifications)

4. **Follow best practices**:
   - Use TypeScript with strict types (no `any`)
   - Handle errors gracefully with user-friendly messages
   - Implement loading, error, and empty states
   - Ensure mobile responsiveness
   - Add accessibility attributes
   - Validate all user input
   - Follow the project's existing conventions

5. **Integrate properly**:
   - Use existing state management (contexts, React Query)
   - Reuse existing UI components
   - Match the design system
   - Follow routing patterns
   - Respect authentication and authorization

### Output

After implementation, provide:
- Summary of what was created
- List of files created/modified with paths
- Any database changes made
- Testing steps to verify functionality
- Any follow-up work or limitations
