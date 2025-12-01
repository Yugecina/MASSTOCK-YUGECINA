# Frontend - React 19 SPA

**Technology**: React 19.2, Vite 7.2, **Pure CSS (NO Tailwind)**, Zustand 5.0, React Router DOM 7.9
**Entry Point**: `src/main.jsx`
**Parent Context**: This extends [../CLAUDE.md](../CLAUDE.md)

---

## Development Commands

### From This Directory
```bash
# Development server (Vite with HMR)
npm run dev              # Starts on http://localhost:5173

# Production build
npm run build            # Outputs to dist/

# Preview production build
npm run preview

# Linting
npm run lint             # ESLint with React rules
npm run lint:fix         # Auto-fix linting issues

# Testing
npm test                 # Run all tests with coverage
npm run test:unit        # Unit tests only
npm run test:watch       # Watch mode (Vitest)
npm run test:ui          # Vitest UI (interactive)
npm run test:coverage    # Coverage report
```

### From Root
```bash
cd frontend && npm run dev
cd frontend && npm test
cd frontend && npm run lint
```

### Pre-PR Checklist
```bash
# Must pass before creating PR
npm run lint             # ESLint must pass
npm test                 # Coverage must be ≥70%
```

---

## Architecture

### Directory Structure
```
frontend/
├── src/
│   ├── main.jsx                     # Vite entry point
│   ├── App.jsx                      # React Router setup
│   ├── index.css                    # Global CSS imports
│   ├── pages/                       # Route components
│   │   ├── Login.jsx                # Public: /login
│   │   ├── Home.jsx                 # Protected: /
│   │   ├── Executions.jsx           # Protected: /executions
│   │   ├── AdminUsers.jsx           # Admin: /admin/users
│   │   └── AdminAnalytics.jsx       # Admin: /admin/analytics
│   ├── components/                  # Reusable UI components
│   │   ├── layout/                  # Layout components
│   │   │   ├── Sidebar.jsx          # Main navigation
│   │   │   └── AdminLayout.jsx      # Admin page wrapper
│   │   ├── admin/                   # Admin-specific components
│   │   │   ├── WorkflowTable.jsx    # Workflow data table
│   │   │   └── AddMemberModal.jsx   # Add client member modal
│   │   └── workflows/               # Workflow components
│   │       ├── NanoBananaForm.jsx   # Nano Banana execution form
│   │       └── BatchResultsView.jsx # Execution results display
│   ├── store/                       # Zustand global state
│   │   ├── authStore.js             # Auth state (user, login, logout)
│   │   └── themeStore.js            # Theme state (dark mode toggle)
│   ├── services/                    # API client
│   │   ├── api.js                   # Axios instance with interceptors
│   │   ├── authService.js           # Auth API calls
│   │   ├── workflowService.js       # Workflow API calls
│   │   └── adminUserService.js      # Admin user management
│   ├── hooks/                       # Custom React hooks
│   │   ├── useAuth.js               # Auth hook (login, logout, user)
│   │   └── useTheme.js              # Theme hook (dark mode)
│   ├── styles/                      # **PURE CSS ONLY (NO TAILWIND)**
│   │   ├── global.css               # Main CSS import file
│   │   ├── variables.css            # Design tokens (colors, spacing, typography)
│   │   ├── base.css                 # CSS reset, base styles
│   │   ├── utilities.css            # Utility classes (flex, spacing, text)
│   │   ├── components.css           # Component styles (buttons, cards, forms)
│   │   ├── layout.css               # Layout styles (sidebar, grid)
│   │   └── pages.css                # Page-specific styles
│   ├── utils/                       # Utility functions
│   │   └── logger.js                # Production-safe logging
│   └── __tests__/                   # Vitest tests
│       ├── App.init.test.jsx        # App initialization tests
│       ├── components/              # Component tests
│       ├── hooks/                   # Hook tests
│       ├── pages/                   # Page tests
│       └── services/                # Service tests
├── public/                          # Static assets
│   ├── fonts/                       # Inter font files
│   └── favicon.svg                  # Favicon
├── index.html                       # HTML template
├── vite.config.js                   # Vite configuration
├── vitest.config.js                 # Vitest configuration
├── eslint.config.js                 # ESLint configuration
└── package.json
```

---

## Code Organization Patterns

### Components (Functional Components Only)

**✅ DO: Functional Components + Hooks + Pure CSS**

Example: `src/components/admin/WorkflowTable.jsx`
```javascript
import React from 'react';

export function WorkflowTable({ workflows = [], onViewDetails, loading = false }) {
  // Helper functions
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'deployed':
        return 'badge-success';  // CSS class from components.css
      case 'draft':
        return 'badge-warning';
      default:
        return 'badge-neutral';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="card" style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>
        <div className="spinner"></div>
        <p className="text-neutral-600" style={{ marginTop: 'var(--spacing-md)' }}>
          Loading workflows...
        </p>
      </div>
    );
  }

  // Empty state
  if (workflows.length === 0) {
    return (
      <div className="card empty-state">
        <p className="text-neutral-600">No workflows found</p>
      </div>
    );
  }

  // Main render
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {workflows.map((workflow) => (
            <tr key={workflow.id}>
              <td>{workflow.id}</td>
              <td>{workflow.name}</td>
              <td>
                <span className={getStatusBadgeClass(workflow.status)}>
                  {workflow.status}
                </span>
              </td>
              <td>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => onViewDetails(workflow.id)}
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

**Component Pattern:**
1. Named export (not default)
2. Props with default values
3. Helper functions inside component
4. Early returns for loading/empty states
5. Use CSS classes from `src/styles/`
6. Inline styles only for dynamic values using CSS variables

**❌ DON'T:**
```javascript
// ❌ Class components
class WorkflowTable extends React.Component { }

// ❌ Default export (use named exports)
export default WorkflowTable;

// ❌ Tailwind classes
<div className="px-4 py-2 bg-blue-500 rounded-lg">  // BLOCKED!

// ❌ Hardcoded colors
<div style={{ backgroundColor: '#3B82F6' }}>  // Use var(--primary)!

// ❌ Missing prop types/defaults
export function WorkflowTable({ workflows, onViewDetails }) {  // Add defaults!
```

---

### Styling (PURE CSS ONLY - ZERO Tailwind)

**✅ DO: Use CSS Classes from global.css**

**CSS Variable Pattern:**
```javascript
// ✅ Use CSS variables for dynamic values
<div style={{
  padding: 'var(--spacing-md)',
  color: 'var(--primary)',
  backgroundColor: 'var(--neutral-50)'
}}>
```

**CSS Class Pattern:**
```javascript
// ✅ Use predefined CSS classes
<button className="btn btn-primary">Click Me</button>
<div className="card">
  <h2 className="text-h2">Title</h2>
  <p className="text-neutral-600">Description</p>
</div>

// ✅ Combine utility classes
<div className="flex items-center gap-md p-6">
  <span className="badge badge-success">Active</span>
</div>
```

**Available CSS Classes (from `src/styles/`):**

**Buttons:**
- `.btn` - Base button
- `.btn-primary` - Primary action
- `.btn-secondary` - Secondary action
- `.btn-danger` - Destructive action
- `.btn-sm`, `.btn-lg` - Size variants

**Cards:**
- `.card` - Base card component
- `.card-header` - Card header
- `.card-body` - Card body

**Badges:**
- `.badge` - Base badge
- `.badge-success`, `.badge-warning`, `.badge-danger`, `.badge-neutral`

**Typography:**
- `.text-h1`, `.text-h2`, `.text-h3` - Headings
- `.text-body`, `.text-body-sm` - Body text
- `.text-neutral-600`, `.text-neutral-700` - Color variants

**Layout:**
- `.flex`, `.items-center`, `.justify-between` - Flexbox
- `.gap-sm`, `.gap-md`, `.gap-lg` - Gaps
- `.p-4`, `.p-6`, `.p-8` - Padding
- `.m-4`, `.m-6`, `.m-8` - Margin

**CSS Variables (from `src/styles/variables.css`):**
```css
/* Colors */
--primary: #0D7C7C
--primary-light: #10A3A3
--primary-dark: #0A5C5C
--danger: #DC2626
--success: #059669
--warning: #F59E0B
--neutral-50: #F9FAFB
--neutral-600: #4B5563

/* Spacing */
--spacing-xs: 4px
--spacing-sm: 8px
--spacing-md: 16px
--spacing-lg: 24px
--spacing-xl: 32px

/* Typography */
--font-size-h1: 2.5rem
--font-size-h2: 2rem
--font-size-body: 1rem
--font-size-body-sm: 0.875rem
```

**❌ NEVER USE TAILWIND:**
```javascript
// ❌ BLOCKED - Will trigger PreToolUse hook
<div className="px-4 py-2">
<button className="bg-blue-500 hover:bg-blue-700">
<span className="text-sm font-bold">
```

---

### State Management (Zustand)

**✅ DO: Use Zustand for Global State**

Example: `src/store/authStore.js`
```javascript
import { create } from 'zustand';
import { authService } from '../services/authService';

export const useAuthStore = create((set) => ({
  // State
  user: null,
  isAuthenticated: false,
  isLoading: true,

  // Actions
  setUser: (user) => set({ user, isAuthenticated: !!user }),

  login: async (email, password) => {
    try {
      const response = await authService.login(email, password);
      set({ user: response.user, isAuthenticated: true });
      return response;
    } catch (error) {
      console.error('❌ authStore.login: Login failed', { error });
      throw error;
    }
  },

  logout: async () => {
    try {
      await authService.logout();
      set({ user: null, isAuthenticated: false });
    } catch (error) {
      console.error('❌ authStore.logout: Logout failed', { error });
      // Clear state anyway
      set({ user: null, isAuthenticated: false });
    }
  },

  setLoading: (isLoading) => set({ isLoading })
}));
```

**Usage in Component:**
```javascript
import { useAuthStore } from '../store/authStore';

function LoginPage() {
  const { login, isLoading } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      console.log('✅ LoginPage: Login successful');
    } catch (error) {
      console.error('❌ LoginPage: Login failed', { error });
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

**Zustand Pattern:**
- Create store with `create()`
- State + actions in same object
- Use hook in components: `const { state, action } = useStore()`
- No providers needed (unlike Context API)

---

### API Integration (Axios)

**✅ DO: Use Service Layer with Error Logging**

**API Client:** `src/services/api.js`
```javascript
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // Send cookies
  timeout: 30000
});

// Request interceptor: Add token if available
api.interceptors.request.use(
  (config) => {
    console.log('🔍 API Request:', {
      method: config.method,
      url: config.url,
      data: config.data
    });
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor: Handle token refresh
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  async (error) => {
    console.error('❌ API Response Error:', {
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data,
      message: error.message
    });

    // Auto-refresh token on 401
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;

      try {
        await axios.post(`${import.meta.env.VITE_API_URL}/auth/refresh`, {}, {
          withCredentials: true
        });
        return api(error.config); // Retry original request
      } catch (refreshError) {
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

**Service Pattern:** `src/services/workflowService.js`
```javascript
import api from './api';

export const workflowService = {
  async getWorkflows(clientId) {
    try {
      console.log('🔍 workflowService.getWorkflows: Fetching', { clientId });

      const response = await api.get('/workflows', {
        params: { client_id: clientId }
      });

      console.log('✅ workflowService.getWorkflows: Success', {
        count: response.data.length,
        workflows: response.data
      });

      return response.data;
    } catch (error) {
      console.error('❌ workflowService.getWorkflows: Failed', {
        error: error,
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data,
        clientId
      });
      throw error;
    }
  },

  async createWorkflow(workflowData) {
    try {
      const response = await api.post('/workflows', workflowData);
      console.log('✅ workflowService.createWorkflow: Success', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ workflowService.createWorkflow: Failed', {
        error,
        workflowData
      });
      throw error;
    }
  }
};
```

**Error Logging Pattern:**
```javascript
// ✅ Comprehensive error logging
try {
  const data = await service.fetchData();
  console.log('✅ Component: Data loaded', { data, keys: Object.keys(data) });
} catch (error) {
  console.error('❌ Component.function: Error details', {
    error: error,
    message: error.message,
    response: error.response,
    status: error.response?.status,
    data: error.response?.data,
    context: { executionId, userId }
  });
  setError(`Failed: ${error.response?.data?.message || error.message}`);
}
```

---

### Routing (React Router DOM 7)

**✅ DO: Nested Routes with Protection**

Example: `src/App.jsx`
```javascript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import Home from './pages/Home';
import Executions from './pages/Executions';
import AdminLayout from './components/layout/AdminLayout';
import AdminUsers from './pages/AdminUsers';

// Protected Route wrapper
function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } />

        <Route path="/executions" element={
          <ProtectedRoute>
            <Executions />
          </ProtectedRoute>
        } />

        {/* Admin routes */}
        <Route path="/admin" element={
          <ProtectedRoute adminOnly>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route path="users" element={<AdminUsers />} />
          <Route path="analytics" element={<AdminAnalytics />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

---

### Forms (React Hook Form + Zod)

**✅ DO: Controlled Forms with Validation**

```javascript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Define schema
const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data) => {
    try {
      await login(data.email, data.password);
      console.log('✅ LoginForm: Login successful');
    } catch (error) {
      console.error('❌ LoginForm: Login failed', { error });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="form">
      <div className="form-group">
        <label htmlFor="email" className="form-label">Email</label>
        <input
          id="email"
          type="email"
          className="form-input"
          {...register('email')}
        />
        {errors.email && (
          <span className="form-error">{errors.email.message}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="password" className="form-label">Password</label>
        <input
          id="password"
          type="password"
          className="form-input"
          {...register('password')}
        />
        {errors.password && (
          <span className="form-error">{errors.password.message}</span>
        )}
      </div>

      <button type="submit" className="btn btn-primary btn-lg">
        Login
      </button>
    </form>
  );
}
```

---

## Key Files

### Core Files

**`src/main.jsx`** - Vite entry point
- ReactDOM render
- Imports global CSS
- App component mount

**`src/App.jsx`** - React Router setup
- Route definitions
- Protected route logic
- Layout wrappers

**`src/index.css`** - Global CSS imports
- Imports all CSS modules from `src/styles/`

### Styling System

**`src/styles/global.css`** - Main CSS file
- Imports all other CSS modules
- Single import point

**`src/styles/variables.css`** - Design tokens
- CSS variables for colors, spacing, typography
- Dark mode variables
- Theme configuration

**`src/styles/components.css`** - Component styles
- Buttons, cards, badges, forms, tables
- Reusable UI components

### State Management

**`src/store/authStore.js`** - Auth state
- User object, isAuthenticated flag
- login(), logout() actions
- Zustand store

**`src/store/themeStore.js`** - Theme state
- Dark mode toggle
- Theme persistence

### API Layer

**`src/services/api.js`** - Axios instance
- Base URL configuration
- Request/response interceptors
- Token refresh logic

**`src/services/authService.js`** - Auth API
- login(), refresh(), logout()

**`src/services/workflowService.js`** - Workflow API
- CRUD operations for workflows

---

## Common Patterns

### Loading States

```javascript
function MyComponent() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        console.log('🔍 MyComponent: Fetching data');
        const result = await service.getData();
        console.log('✅ MyComponent: Data loaded', { result });
        setData(result);
      } catch (error) {
        console.error('❌ MyComponent: Failed to load', { error });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return <div className="spinner">Loading...</div>;
  }

  return <div>{/* render data */}</div>;
}
```

### Error Handling

```javascript
function MyComponent() {
  const [error, setError] = useState(null);

  const handleAction = async () => {
    try {
      setError(null);
      await service.doSomething();
      console.log('✅ MyComponent: Action successful');
    } catch (err) {
      console.error('❌ MyComponent.handleAction: Failed', {
        error: err,
        message: err.message,
        response: err.response
      });
      setError(err.response?.data?.message || 'An error occurred');
    }
  };

  return (
    <div>
      {error && <div className="alert alert-danger">{error}</div>}
      <button onClick={handleAction} className="btn btn-primary">
        Do Something
      </button>
    </div>
  );
}
```

### Conditional Rendering

```javascript
function WorkflowList({ workflows }) {
  // Empty state
  if (workflows.length === 0) {
    return (
      <div className="card empty-state">
        <p className="text-neutral-600">No workflows found</p>
      </div>
    );
  }

  // Render list
  return (
    <div className="workflow-list">
      {workflows.map((workflow) => (
        <WorkflowCard key={workflow.id} workflow={workflow} />
      ))}
    </div>
  );
}
```

---

## Quick Search Commands

### Find Components
```bash
# Find all components
rg -n "^export (function|const).*\(" frontend/src/components

# Find specific component
rg -n "export.*WorkflowTable" frontend/src/components

# Find component usage
rg -n "<WorkflowTable" frontend/src
```

### Find Pages
```bash
# Find all pages
ls -la frontend/src/pages/

# Find page component
rg -n "^(function|const).*=.*\(" frontend/src/pages
```

### Find Stores
```bash
# Find Zustand stores
rg -n "create\(" frontend/src/store

# Find store usage
rg -n "use.*Store" frontend/src
```

### Find Services
```bash
# Find API services
rg -n "export.*Service" frontend/src/services

# Find API calls
rg -n "api\.(get|post|put|delete)" frontend/src/services
```

### Find Styles
```bash
# Find CSS classes
rg -n "^\." frontend/src/styles/components.css

# Find CSS variable usage
rg -n "var\(--" frontend/src

# Find Tailwind violations (should be empty!)
rg -n "className=[\"'].*\b(px|py|bg|text)-" frontend/src
```

---

## Common Gotchas

### Environment Variables
- **Prefix required:** All env vars must start with `VITE_`
- **Access:** Use `import.meta.env.VITE_VAR_NAME` (not `process.env`)
- **No secrets:** Never put secrets in frontend env vars (visible to users)

### CSS
- **NO Tailwind:** Zero tolerance - will be blocked by hook
- **Use variables:** Always use `var(--spacing-md)` not hardcoded values
- **CSS classes:** Use predefined classes from `components.css`

### Routing
- **Protected routes:** Wrap with `<ProtectedRoute>` component
- **Navigation:** Use `<Link to="/path">` not `<a href="/path">`
- **Redirect after login:** Use `<Navigate to="/" replace />`

### State Management
- **Global state:** Use Zustand (not Context API)
- **Local state:** Use `useState` for component-specific state
- **Derived state:** Use `useMemo` for computed values

### API Calls
- **withCredentials:** Always set `withCredentials: true` for cookies
- **Error logging:** Always log errors with full context (see pattern above)
- **Token refresh:** Automatic via Axios interceptor (401 → refresh → retry)

---

## Testing Guidelines

### Component Tests

**Location:** Co-located with source (`src/__tests__/components/`)

**Framework:** Vitest + React Testing Library

**Pattern:** Render → Interact → Assert

**Example:** `src/__tests__/components/WorkflowTable.test.jsx`
```javascript
import { render, screen } from '@testing-library/react';
import { WorkflowTable } from '../../components/admin/WorkflowTable';

describe('WorkflowTable', () => {
  it('should render workflows', () => {
    const workflows = [
      { id: '1', name: 'Workflow 1', status: 'deployed' }
    ];

    render(<WorkflowTable workflows={workflows} />);

    expect(screen.getByText('Workflow 1')).toBeInTheDocument();
    expect(screen.getByText('deployed')).toBeInTheDocument();
  });

  it('should show empty state when no workflows', () => {
    render(<WorkflowTable workflows={[]} />);

    expect(screen.getByText('No workflows found')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(<WorkflowTable workflows={[]} loading={true} />);

    expect(screen.getByText('Loading workflows...')).toBeInTheDocument();
  });
});
```

### Hook Tests

```javascript
import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '../../store/authStore';

describe('useAuthStore', () => {
  it('should login user', async () => {
    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toBeDefined();
  });
});
```

### Running Tests

```bash
# All tests with coverage
npm test

# Watch mode
npm run test:watch

# UI mode (interactive)
npm run test:ui

# Specific test file
npm test -- WorkflowTable.test.jsx
```

---

## Pre-PR Validation

Run this command before creating a PR:
```bash
npm run lint && npm test
```

**All checks must pass:**
- ✅ ESLint passing (no errors)
- ✅ All tests passing
- ✅ Coverage ≥70%
- ✅ NO Tailwind classes anywhere
- ✅ All CSS uses variables or predefined classes
- ✅ All errors logged with emoji indicators

---

## Related Documentation

- **Root Guide:** [../CLAUDE.md](../CLAUDE.md)
- **Architecture:** [../.agent/system/project_architecture.md](../.agent/system/project_architecture.md)
- **Add Component:** [../.agent/SOP/add_component.md](../.agent/SOP/add_component.md)
- **Design System:** Defined in `src/styles/` (variables.css, components.css)

---

**Last Updated:** 2025-11-30
**Version:** 1.0
