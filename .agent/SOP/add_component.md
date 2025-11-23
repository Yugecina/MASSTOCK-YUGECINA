# SOP: Add React Component

**Last Updated:** 2025-11-23

## Overview

This guide explains how to add a new React component to the MasStock frontend following TDD and design system best practices.

---

## Architecture

```
Component → Service (API) → Backend
Component → Store (Zustand) → State Management
Component → CSS Classes (global.css) → Styling
```

---

## Steps (TDD Approach)

### 1. Write Test First (RED)

Create test file in `frontend/src/__tests__/components/`

**File:** `frontend/src/__tests__/components/MyComponent.test.jsx`

```javascript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import MyComponent from '../../components/MyComponent'

describe('MyComponent', () => {
  it('renders component with props', () => {
    render(
      <BrowserRouter>
        <MyComponent title="Test Title" />
      </BrowserRouter>
    )

    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })

  it('handles button click', async () => {
    const handleClick = vi.fn()

    render(
      <BrowserRouter>
        <MyComponent onAction={handleClick} />
      </BrowserRouter>
    )

    const button = screen.getByRole('button', { name: /action/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })

  it('displays loading state', () => {
    render(
      <BrowserRouter>
        <MyComponent loading={true} />
      </BrowserRouter>
    )

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('displays error state', () => {
    render(
      <BrowserRouter>
        <MyComponent error="Something went wrong" />
      </BrowserRouter>
    )

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
  })
})
```

**Run test (should FAIL):**
```bash
cd frontend
npm test -- MyComponent.test.jsx
```

---

### 2. Create Component (GREEN)

**File:** `frontend/src/components/MyComponent.jsx`

```jsx
import { useState, useEffect } from 'react'
import { Button } from './ui/Button'
import { Spinner } from './ui/Spinner'

/**
 * MyComponent - Description of what this component does
 *
 * @param {Object} props
 * @param {string} props.title - Component title
 * @param {boolean} props.loading - Loading state
 * @param {string} props.error - Error message
 * @param {Function} props.onAction - Callback for action button
 */
export default function MyComponent({
  title = 'Default Title',
  loading = false,
  error = null,
  onAction
}) {
  const [localState, setLocalState] = useState(null)

  useEffect(() => {
    // Component mount logic
    console.log('✅ MyComponent: Component mounted', { title })

    return () => {
      // Cleanup logic
      console.log('🔍 MyComponent: Component unmounting')
    }
  }, [title])

  const handleAction = () => {
    try {
      console.log('✅ MyComponent: Action button clicked')
      onAction?.()
    } catch (err) {
      console.error('❌ MyComponent.handleAction: Error:', {
        error: err,
        message: err.message
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Spinner />
        <span className="ml-2">Loading...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card bg-error">
        <p className="text-error">{error}</p>
      </div>
    )
  }

  return (
    <div className="card">
      <h2 className="text-h2">{title}</h2>

      <div className="mt-4">
        <Button onClick={handleAction}>
          Action
        </Button>
      </div>
    </div>
  )
}
```

---

### 3. Styling with CSS (NO Tailwind)

**Use classes from `frontend/src/styles/global.css`:**

#### Layout Classes

```jsx
<div className="flex items-center justify-between gap-md">
  <div className="flex-1">Content</div>
</div>
```

Available:
- `.flex`, `.flex-col`, `.flex-wrap`
- `.items-center`, `.items-start`, `.items-end`
- `.justify-center`, `.justify-between`, `.justify-end`
- `.gap-sm`, `.gap-md`, `.gap-lg`

#### Spacing Classes

```jsx
<div className="p-6 mt-4 mb-8">
  Content with padding and margins
</div>
```

Available:
- Padding: `.p-{2,4,6,8}`, `.px-{2,4,6}`, `.py-{2,4,6}`
- Margin: `.m-{2,4,6,8}`, `.mt-{2,4,6}`, `.mb-{2,4,6}`

#### Typography Classes

```jsx
<h1 className="text-h1">Main Title</h1>
<p className="text-body">Body text</p>
<span className="text-sm text-muted">Small muted text</span>
```

Available:
- `.text-h1`, `.text-h2`, `.text-h3`
- `.text-body`, `.text-sm`, `.text-xs`
- `.text-muted`, `.text-error`, `.text-success`

#### Component Classes

```jsx
<div className="card">Card content</div>
<button className="btn btn-primary">Button</button>
<span className="badge badge-success">Badge</span>
```

Available:
- `.card`
- `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-danger`
- `.badge`, `.badge-success`, `.badge-warning`, `.badge-error`

#### CSS Variables

```jsx
<div style={{
  backgroundColor: 'var(--surface)',
  color: 'var(--text-primary)',
  padding: 'var(--spacing-md)'
}}>
  Custom styled element
</div>
```

Available variables (see `global.css`):
- Colors: `--primary`, `--surface`, `--text-primary`, `--error`
- Spacing: `--spacing-sm`, `--spacing-md`, `--spacing-lg`
- Radius: `--radius-sm`, `--radius-md`
- Shadow: `--shadow-sm`, `--shadow-md`

---

### 4. State Management with Zustand

**Create Store** (`frontend/src/store/myStore.js`):

```javascript
import { create } from 'zustand'
import api from '../services/api'
import logger from '@/utils/logger'

export const useMyStore = create((set, get) => ({
  items: [],
  loading: false,
  error: null,

  // Fetch items
  fetchItems: async () => {
    set({ loading: true, error: null })
    try {
      logger.debug('🔍 MyStore: Fetching items')
      const response = await api.get('/v1/my-items')

      logger.debug('✅ MyStore: Items fetched', {
        count: response.data.length
      })

      set({ items: response.data, loading: false })
    } catch (err) {
      logger.error('❌ MyStore: Failed to fetch items', {
        error: err,
        message: err.message,
        response: err.response
      })

      set({
        error: err.response?.data?.message || 'Failed to fetch items',
        loading: false
      })
    }
  },

  // Create item
  createItem: async (itemData) => {
    set({ loading: true, error: null })
    try {
      logger.debug('🔍 MyStore: Creating item', itemData)
      const response = await api.post('/v1/my-items', itemData)

      logger.debug('✅ MyStore: Item created', {
        id: response.data.id
      })

      // Add to existing items
      set((state) => ({
        items: [response.data, ...state.items],
        loading: false
      }))

      return response.data
    } catch (err) {
      logger.error('❌ MyStore: Failed to create item', {
        error: err,
        message: err.message,
        response: err.response,
        itemData
      })

      set({
        error: err.response?.data?.message || 'Failed to create item',
        loading: false
      })
      throw err
    }
  },

  // Reset state
  reset: () => {
    set({ items: [], loading: false, error: null })
  }
}))
```

**Use in Component:**

```jsx
import { useMyStore } from '../store/myStore'

export default function MyComponent() {
  const { items, loading, error, fetchItems } = useMyStore()

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  return (
    <div className="card">
      {loading && <Spinner />}
      {error && <p className="text-error">{error}</p>}
      {items.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  )
}
```

---

### 5. API Service

**Create Service** (`frontend/src/services/myService.js`):

```javascript
import api from './api'
import logger from '@/utils/logger'

/**
 * Get all items
 */
export async function getItems() {
  try {
    logger.debug('🔍 MyService: Getting items')
    const response = await api.get('/v1/my-items')

    logger.debug('✅ MyService: Items retrieved', {
      count: response.data.length,
      data: response.data
    })

    return response
  } catch (err) {
    logger.error('❌ MyService: Failed to get items', {
      error: err,
      message: err.message,
      response: err.response
    })
    throw err
  }
}

/**
 * Create item
 */
export async function createItem(itemData) {
  try {
    logger.debug('🔍 MyService: Creating item', itemData)
    const response = await api.post('/v1/my-items', itemData)

    logger.debug('✅ MyService: Item created', {
      id: response.data.id,
      data: response.data
    })

    return response
  } catch (err) {
    logger.error('❌ MyService: Failed to create item', {
      error: err,
      message: err.message,
      response: err.response,
      itemData
    })
    throw err
  }
}

/**
 * Update item
 */
export async function updateItem(id, updates) {
  try {
    logger.debug('🔍 MyService: Updating item', { id, updates })
    const response = await api.patch(`/v1/my-items/${id}`, updates)

    logger.debug('✅ MyService: Item updated', {
      id,
      data: response.data
    })

    return response
  } catch (err) {
    logger.error('❌ MyService: Failed to update item', {
      error: err,
      message: err.message,
      response: err.response,
      id,
      updates
    })
    throw err
  }
}

/**
 * Delete item
 */
export async function deleteItem(id) {
  try {
    logger.debug('🔍 MyService: Deleting item', { id })
    const response = await api.delete(`/v1/my-items/${id}`)

    logger.debug('✅ MyService: Item deleted', { id })

    return response
  } catch (err) {
    logger.error('❌ MyService: Failed to delete item', {
      error: err,
      message: err.message,
      response: err.response,
      id
    })
    throw err
  }
}
```

---

### 6. Error Logging (CRITICAL)

**Every error must be logged with full context:**

```jsx
try {
  const data = await api.post('/endpoint', payload)
  console.log('✅ Component: Success', {
    status: response.status,
    data: response.data
  })
} catch (err) {
  console.error('❌ Component.functionName: Error', {
    error: err,
    message: err.message,
    response: err.response,
    status: err.response?.status,
    data: err.response?.data,
    payload: payload
  })
  setError(`Failed: ${err.response?.data?.message || err.message}`)
}
```

**Emoji indicators:**
- 🔍 Loading/fetching
- ✅ Success
- ❌ Error
- 📦 Data received
- 🎬 Action started
- 🏁 Action completed

---

### 7. Run Tests (GREEN)

```bash
cd frontend
npm test -- MyComponent.test.jsx
```

Tests should now **PASS**.

---

### 8. Add to Page/Route

**Option A: Use in existing page**

```jsx
// In pages/Dashboard.jsx
import MyComponent from '../components/MyComponent'

export function Dashboard() {
  return (
    <div>
      <MyComponent title="Dashboard Component" />
    </div>
  )
}
```

**Option B: Create new page route**

```jsx
// In App.jsx
import { MyPage } from './pages/MyPage'

<Route
  path="/my-page"
  element={
    <ProtectedRoute>
      <MyPage />
    </ProtectedRoute>
  }
/>
```

---

## Component Types

### 1. UI Component (Reusable)

**Location:** `frontend/src/components/ui/`

**Example:** Button, Card, Badge, Input

```jsx
// frontend/src/components/ui/MyUIComponent.jsx
export default function MyUIComponent({ children, variant = 'default' }) {
  return (
    <div className={`my-ui-component ${variant}`}>
      {children}
    </div>
  )
}
```

### 2. Layout Component

**Location:** `frontend/src/components/layout/`

**Example:** Sidebar, Header, Footer

```jsx
// frontend/src/components/layout/MyLayout.jsx
export default function MyLayout({ children }) {
  return (
    <div className="layout">
      <aside className="sidebar">Sidebar</aside>
      <main className="content">{children}</main>
    </div>
  )
}
```

### 3. Feature Component

**Location:** `frontend/src/components/feature/`

**Example:** Workflow-specific, Admin-specific

```jsx
// frontend/src/components/workflows/WorkflowForm.jsx
export default function WorkflowForm({ onSubmit }) {
  // Complex form logic
}
```

### 4. Page Component

**Location:** `frontend/src/pages/`

**Example:** Dashboard, Login, WorkflowsList

```jsx
// frontend/src/pages/MyPage.jsx
export function MyPage() {
  return (
    <div className="page">
      <h1 className="text-h1">Page Title</h1>
      {/* Page content */}
    </div>
  )
}
```

---

## Best Practices

### ✅ DO

- **Pure CSS**: Use classes from `global.css` (NO Tailwind)
- **Comprehensive Logging**: Log all actions, errors with full context
- **Error Handling**: Wrap all API calls in try-catch
- **PropTypes/TypeScript**: Document expected props
- **Loading States**: Show spinner during async operations
- **Error States**: Display user-friendly error messages
- **Accessibility**: Use semantic HTML, ARIA labels
- **Test Coverage**: Write tests for all user interactions

### ❌ DON'T

- **No Tailwind**: Never use `className="px-4 py-2 bg-blue-500"`
- **No Inline Styles**: Except for dynamic CSS variables
- **No localStorage for Auth**: Use httpOnly cookies via API
- **No Console.log in Production**: Use logger utility instead
- **No Test Scripts**: User tests in real conditions

---

## Testing Checklist

### ✅ Test Coverage

- [ ] **Renders**: Component renders without crashing
- [ ] **Props**: Accepts and displays props correctly
- [ ] **User Interaction**: Button clicks, form submissions work
- [ ] **Loading State**: Shows loading indicator
- [ ] **Error State**: Shows error message
- [ ] **API Calls**: Mocked API responses
- [ ] **State Changes**: Component updates on state change

---

## Related Documentation

- **[project_architecture.md](../system/project_architecture.md)** - Frontend architecture
- **[add_route.md](./add_route.md)** - Backend API endpoints
- **[../../CLAUDE.md](../../CLAUDE.md)** - Development workflow
- **[../../frontend/src/styles/global.css](../../frontend/src/styles/global.css)** - CSS Design System
