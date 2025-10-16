## 🧪 **`/test`** — Generate Tests

Generate comprehensive tests for components, hooks, services, or utilities in the project.

### Your Task

When the user requests tests:

1. **Understand what to test**:
   - Component: UI rendering, interactions, states
   - Hook: Data fetching, mutations, state changes
   - Service: CRUD operations, error handling, business logic
   - Utility: Input/output, edge cases, error handling

2. **Identify test type needed**:
   - **Unit tests**: Isolated functions or components
   - **Integration tests**: Component + hook + service interactions
   - **End-to-end tests**: Complete user flows

3. **Write comprehensive tests**:
   - **Happy path**: Normal, expected usage
   - **Edge cases**: Empty data, null/undefined, boundary conditions
   - **Error cases**: Network failures, validation errors, permission issues
   - **Interactions**: User clicks, form inputs, keyboard navigation
   - **States**: Loading, error, empty, success states
   - **Accessibility**: Keyboard navigation, screen reader compatibility

4. **Follow testing best practices**:
   - **AAA pattern**: Arrange, Act, Assert
   - **Descriptive names**: Test name explains what it verifies
   - **One concept per test**: Keep tests focused
   - **Mock external dependencies**: Don't hit real APIs/databases
   - **Test behavior, not implementation**: Focus on what users see/do
   - **Clean up after tests**: Reset mocks, clear state

5. **Set up properly**:
   - Create test wrappers with necessary providers
   - Mock external services appropriately
   - Use factories for test data
   - Configure test utilities correctly

### Output

Provide:
- Complete test file(s) ready to run
- Test setup/configuration if needed
- Mock factories or utilities if needed
- Coverage considerations
- Testing checklist for manual verification
