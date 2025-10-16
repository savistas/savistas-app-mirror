## 🗺️ **`/plan-flow`** — Map Data & Component Flow

Generate a comprehensive end-to-end architecture overview showing data flow, component hierarchy, state management, and user interactions.

### Your Task

When the user requests a flow map:

1. **Analyze the feature/system**:
   - Identify entry points (user actions, routes)
   - Trace data flow from source to UI
   - Map component hierarchy
   - Document state management
   - Understand database schema
   - Note authentication and permissions

2. **Create visual diagrams**:
   - **Data flow**: ASCII diagram showing how data moves through layers (UI → Hook → Service → Database → Cache → UI)
   - **Component tree**: Hierarchical structure of components
   - **State management**: Where state lives and how it updates
   - **User journey**: Step-by-step interaction flows

3. **Document thoroughly**:
   - **File locations**: Exact paths to relevant code
   - **Database schema**: Tables, columns, relationships, policies
   - **Error handling**: How errors are caught and displayed
   - **Performance considerations**: Caching, optimization strategies
   - **Security**: Authentication, authorization, data validation

4. **Show interactions**:
   - How user actions trigger changes
   - How data fetching works
   - How mutations update cache
   - How errors propagate
   - How loading states display

5. **Link related features**:
   - Dependencies between features
   - Shared components or hooks
   - Related documentation

### Output Format

Provide:
- **Overview**: High-level description
- **Data Flow Diagram**: ASCII art showing end-to-end flow
- **Component Tree**: Hierarchical structure
- **State Management**: Tables showing state locations
- **File Locations**: Paths to relevant code
- **Database Schema**: Tables and relationships
- **User Journeys**: Step-by-step flows for key actions
- **Error Handling**: How errors are managed
- **Performance Notes**: Optimizations in place
- **Security Considerations**: Auth and validation
