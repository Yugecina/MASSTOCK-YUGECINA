Run all tests (backend + frontend) with coverage and report results:

1. **Backend Tests:**
   - Run: `cd backend && npm test`
   - Check coverage ≥70% (branches, functions, lines, statements)
   - Report any failing tests with details

2. **Frontend Tests:**
   - Run: `cd frontend && npm run lint`
   - Run: `cd frontend && npm test`
   - Check coverage ≥70%
   - Report any linting errors

3. **Summary:**
   - Total tests run
   - Total tests passed/failed
   - Coverage percentages (backend + frontend)
   - Action items if any failures

**Run tests in parallel when possible using multiple Bash tool calls in a single message.**
