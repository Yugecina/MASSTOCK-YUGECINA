Create a new React component following TDD approach (Test → Component).

**Arguments:** $ARGUMENTS (component description, e.g., "UserProfileCard")

## Steps:

### 1. Parse Component Details
Extract from $ARGUMENTS:
- Component name (PascalCase)
- Component type (page, layout, feature)
- File location (src/components/ or src/pages/)

### 2. Create Test First (TDD - RED)
File: `frontend/src/__tests__/[category]/[ComponentName].test.jsx`

```javascript
import { render, screen } from '@testing-library/react';
import { [ComponentName] } from '../../[path]/[ComponentName]';

describe('[ComponentName]', () => {
  it('should render [expected element]', () => {
    // Arrange
    const props = { /* test props */ };

    // Act
    render(<[ComponentName] {...props} />);

    // Assert
    expect(screen.getByText('[expected text]')).toBeInTheDocument();
  });

  it('should handle [user interaction]', async () => {
    const { user } = renderWithUser(<[ComponentName] />);

    await user.click(screen.getByRole('button', { name: '[button text]' }));

    expect(screen.getByText('[expected result]')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(<[ComponentName] loading={true} />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
```

### 3. Create Component (TDD - GREEN)
File: `frontend/src/[category]/[ComponentName].jsx`

```javascript
import React, { useState, useEffect } from 'react';

/**
 * [ComponentName] Component
 * [Brief description]
 *
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function [ComponentName]({
  propName = 'defaultValue',
  onAction,
  loading = false
}) {
  const [state, setState] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        console.log('🔍 [ComponentName]: Fetching data');
        const data = await service.getData();
        console.log('✅ [ComponentName]: Data loaded', { data });
        setState(data);
      } catch (error) {
        console.error('❌ [ComponentName]: Failed to load', {
          error,
          message: error.message,
          response: error.response
        });
      }
    }
    fetchData();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="card" style={{ padding: 'var(--spacing-xl)' }}>
        <div className="spinner"></div>
        <p className="text-neutral-600">Loading...</p>
      </div>
    );
  }

  // Empty state
  if (!state) {
    return (
      <div className="card empty-state">
        <p className="text-neutral-600">No data found</p>
      </div>
    );
  }

  // Main render
  return (
    <div className="card">
      {/* Use CSS classes from global.css */}
      <h2 className="text-h2">[ComponentName]</h2>
      <p className="text-body">[Content]</p>

      <button
        className="btn btn-primary"
        onClick={() => onAction?.()}
      >
        Action
      </button>
    </div>
  );
}
```

### 4. Styling Rules (CRITICAL)

**✅ DO:**
```javascript
// Use CSS classes from src/styles/global.css
<button className="btn btn-primary">Click</button>
<div className="flex items-center gap-md p-6">

// Use CSS variables for dynamic styles
<div style={{
  padding: 'var(--spacing-md)',
  color: 'var(--primary)',
  backgroundColor: 'var(--neutral-50)'
}}>
```

**❌ NEVER DO (BLOCKED):**
```javascript
// ❌ Tailwind classes - will be auto-blocked by hook
<div className="px-4 py-2 bg-blue-500 rounded-lg">
<button className="text-sm font-bold hover:bg-gray-100">
```

### 5. Error Logging Pattern

**ALWAYS use comprehensive error logging:**
```javascript
try {
  const data = await service.fetchData();
  console.log('✅ ComponentName: Success', { data, keys: Object.keys(data) });
} catch (error) {
  console.error('❌ ComponentName.function: Failed', {
    error: error,
    message: error.message,
    response: error.response,
    status: error.response?.status,
    data: error.response?.data,
    context: { userId, executionId }
  });
  setError(`Failed: ${error.response?.data?.message || error.message}`);
}
```

### 6. Run Tests
```bash
cd frontend && npm test -- [ComponentName].test.jsx
```

### 7. Checklist
- [ ] Test written and failing (RED)
- [ ] Component implements behavior (GREEN)
- [ ] **PURE CSS only** - NO Tailwind classes
- [ ] Uses CSS variables (var(--spacing-md))
- [ ] Comprehensive error logging with emoji indicators
- [ ] Loading and empty states handled
- [ ] Props have default values
- [ ] Named export (not default)
- [ ] Tests passing
- [ ] Coverage ≥70%

Refer to: [.agent/SOP/add_component.md](.agent/SOP/add_component.md)
