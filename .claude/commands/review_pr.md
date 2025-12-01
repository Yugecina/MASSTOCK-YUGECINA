Perform comprehensive PR review following MasStock standards.

## Review Checklist

### 1. Code Quality
- [ ] TDD followed: Tests written before implementation?
- [ ] Test coverage ≥70% for new code
- [ ] No skipped tests (`test.skip`, `describe.skip`)
- [ ] Functions under 50 lines
- [ ] Descriptive variable names (no single letters except loops)
- [ ] Complex logic extracted into utilities

### 2. Testing
Backend:
```bash
cd backend && npm test
```

Frontend:
```bash
cd frontend && npm run lint && npm test
```

- [ ] All tests passing
- [ ] Coverage report reviewed
- [ ] Edge cases tested
- [ ] Error cases tested

### 3. Security (CRITICAL)
- [ ] No secrets committed (API keys, tokens, passwords)
- [ ] Input validation with Zod on all new endpoints
- [ ] RLS enabled on new database tables
- [ ] Rate limiting on public endpoints
- [ ] httpOnly cookies for tokens (not localStorage)
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] Proper error handling (no stack traces in production)

Check secrets:
```bash
git diff main | grep -E '(API_KEY|SECRET|TOKEN|PASSWORD)'
```

### 4. Styling (Frontend)
**CRITICAL: ZERO Tailwind tolerance**

Check for Tailwind violations:
```bash
rg -n "className=[\"'].*\b(px|py|bg|text|rounded|w-|h-)-" frontend/src
```

- [ ] **NO Tailwind classes** (`px-4`, `py-2`, `bg-blue-500`, etc.)
- [ ] Uses CSS classes from `src/styles/global.css`
- [ ] Uses CSS variables (`var(--spacing-md)`, `var(--primary)`)
- [ ] Inline styles only for dynamic values with CSS variables

### 5. Backend Patterns
- [ ] Controllers use Zod validation
- [ ] Winston logging for all errors
- [ ] Try/catch blocks with proper error handling
- [ ] Supabase client usage (not raw SQL)
- [ ] No console.log in production code

Check console.log:
```bash
rg -n "console\\.log" backend/src --glob '!__tests__'
```

### 6. Frontend Patterns
- [ ] Functional components only (no class components)
- [ ] Named exports (not default)
- [ ] Props with default values
- [ ] Zustand for global state
- [ ] Axios service layer for API calls
- [ ] Comprehensive error logging with emoji indicators

### 7. Error Logging
All errors must include:
- [ ] Emoji indicators (🔍 ✅ ❌ 📦)
- [ ] Component/function name
- [ ] Full error object
- [ ] Response data and status
- [ ] Relevant context (IDs, user data)

Example:
```javascript
console.error('❌ Component.function: Error', {
  error: err,
  message: err.message,
  response: err.response,
  status: err.response?.status,
  context: { executionId }
});
```

### 8. Git Conventions
- [ ] Conventional Commits format (`feat:`, `fix:`, `docs:`)
- [ ] Branch named correctly (`feature/`, `fix/`, etc.)
- [ ] Commit messages descriptive
- [ ] No direct commits to main

### 9. Documentation
- [ ] Code comments for complex logic
- [ ] Update CLAUDE.md if patterns changed
- [ ] Update .agent/ docs if architecture changed
- [ ] API docs updated (Swagger)

### 10. Database Changes
If migration added:
- [ ] RLS enabled on new tables
- [ ] RLS policies for SELECT, INSERT, UPDATE, DELETE
- [ ] Indexes on foreign keys
- [ ] Migration tested locally
- [ ] No DROP commands without explicit approval

### 11. Performance
- [ ] No N+1 queries
- [ ] Pagination for large datasets
- [ ] Appropriate use of memoization
- [ ] No unnecessary re-renders
- [ ] Images optimized

### 12. Accessibility (Frontend)
- [ ] Semantic HTML
- [ ] ARIA labels where needed
- [ ] Keyboard navigation works
- [ ] Focus management
- [ ] Color contrast sufficient

## Review Output Format

**Summary:**
- Files changed: X
- Lines added: Y
- Lines deleted: Z

**✅ Passed (N/12 categories):**
- List passed items

**❌ Failed (N/12 categories):**
- List failed items with file:line references
- Provide specific fix recommendations

**⚠️ Warnings:**
- List items that need attention

**Recommendation:**
- ✅ **Approve** - Ready to merge
- 🔄 **Request Changes** - Issues must be fixed
- 💬 **Comment** - Suggestions for improvement

Refer to:
- [CLAUDE.md](CLAUDE.md)
- [.agent/SOP/security_audit_2025_11.md](.agent/SOP/security_audit_2025_11.md)
- [.agent/SOP/add_route.md](.agent/SOP/add_route.md)
- [.agent/SOP/add_component.md](.agent/SOP/add_component.md)
