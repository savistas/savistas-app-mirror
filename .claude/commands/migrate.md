## 🗄️ **`/migrate`** — Generate Database Migration

Generate database migrations for new tables, columns, relationships, policies, functions, or schema changes.

### Your Task

When the user requests a migration:

1. **Understand the change**:
   - Creating new table(s)?
   - Altering existing table(s)?
   - Adding/modifying relationships?
   - Creating/updating access policies?
   - Adding indexes for performance?
   - Creating functions or triggers?

2. **Plan the migration**:
   - What SQL statements are needed?
   - What's the correct order of operations?
   - What constraints are needed?
   - What indexes should be added?
   - What access policies are required?
   - How to handle existing data?

3. **Write robust SQL**:
   - Use `IF EXISTS` / `IF NOT EXISTS` clauses
   - Wrap multiple operations in transactions
   - Add appropriate constraints (NOT NULL, CHECK, UNIQUE, FOREIGN KEY)
   - Create indexes for foreign keys and frequently queried columns
   - Enable and configure row-level security
   - Add comments to document schema
   - Specify ON DELETE behavior for foreign keys

4. **Ensure security and performance**:
   - Row-level security enabled on all tables
   - Access policies for SELECT, INSERT, UPDATE, DELETE
   - Indexes on foreign keys and filter columns
   - Appropriate data types and constraints
   - Defaults for common values

5. **Include rollback**:
   - Provide rollback SQL to undo the migration
   - Test both forward and backward migration
   - Document any data loss risks

### Output

Provide:
- **Migration SQL**: Complete, production-ready migration
- **Rollback SQL**: How to undo the migration
- **File naming**: Suggested timestamp-based filename
- **Testing steps**: How to verify the migration
- **Type updates**: Reminder to update TypeScript types
- **Documentation**: Comments explaining the schema changes
