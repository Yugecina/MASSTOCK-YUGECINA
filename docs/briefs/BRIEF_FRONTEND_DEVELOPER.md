# 📙 BRIEF #3 : FRONTEND-DEVELOPER

```
═══════════════════════════════════════════════════════════════════
PROJECT: MasStock - SaaS Automation Workflows for Agencies
PHASE: Frontend UI Development & Integration
AGENT: Frontend-Developer
TIMELINE: 5-7 jours (après Backend-Architect et UI-Designer)
═══════════════════════════════════════════════════════════════════

## 🎯 CONTEXTE DU PROJET

MasStock est un SaaS qui permet aux agences d'automatiser leurs workflows
d'IA. Tu vas construire l'interface complète (client + admin) basée sur:
1. Design Figma du UI-Designer
2. API endpoints du Backend-Architect

**Client MVP:** Estee
- 10 workflows à automatiser
- 2-5 utilisateurs
- Focus: Vitesse + Facilité d'utilisation

---

## 💻 TECH STACK À UTILISER

### Frontend Stack
```
Framework: React 18+
  Reason: Modern, performant, great ecosystem

Styling: TailwindCSS + shadcn/ui (optional)
  Reason: Fast dev, consistent with design system

State Management: Zustand (lightweight + performant)
  Alternative: React Context for simpler needs
  Reason: Avoid Redux complexity for MVP

HTTP Client: axios or fetch + custom wrapper
  Reason: Handle authentication, logging, error handling

Routing: React Router v6+
  Reason: Established standard

Form Handling: React Hook Form + Zod (validation)
  Reason: Lightweight, performant forms

Build Tool: Vite (not Create React App)
  Reason: Faster dev experience

Hosting: Vercel (built for React)
  Reason: Seamless deployment, serverless functions if needed
```

### Optional but Recommended Libraries
```
- SWR or React Query: Data fetching + caching
  Reason: Automatic refetching, cache invalidation

- date-fns: Date formatting
  Reason: Lightweight alternative to moment.js

- recharts: Charting library (for admin dashboard)
  Reason: React-native, lightweight

- framer-motion: Animations
  Reason: Smooth micro-interactions

- react-hot-toast: Toast notifications
  Reason: Simple notifications without heavy deps

- clsx or classnames: Conditional CSS classes
  Reason: Cleaner component code
```

---

## 📁 PROJECT STRUCTURE

```
masstock-frontend/
├── public/
│   ├── favicon.ico
│   └── ...
├── src/
│   ├── components/
│   │   ├── common/          # Reusable components
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Badge.jsx
│   │   │   ├── Spinner.jsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── ClientLayout.jsx  # Sidebar + main for client
│   │   │   └── AdminLayout.jsx   # Sidebar + main for admin
│   │   ├── client/          # Client pages
│   │   │   ├── Dashboard.jsx
│   │   │   ├── WorkflowsList.jsx
│   │   │   ├── WorkflowExecute.jsx
│   │   │   ├── WorkflowResults.jsx
│   │   │   ├── RequestWorkflow.jsx
│   │   │   ├── RequestsInProgress.jsx
│   │   │   ├── Settings.jsx
│   │   │   └── ...
│   │   └── admin/           # Admin pages
│   │       ├── AdminDashboard.jsx
│   │       ├── ClientsManagement.jsx
│   │       ├── WorkflowsManagement.jsx
│   │       ├── ErrorsAndLogs.jsx
│   │       ├── SupportTickets.jsx
│   │       ├── FinancesAnalytics.jsx
│   │       ├── AuthenticationMonitoring.jsx
│   │       └── AdminSettings.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── NotFound.jsx
│   │   └── ...
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.js
│   │   ├── useWorkflows.js
│   │   ├── useApi.js
│   │   └── ...
│   ├── services/            # API calls
│   │   ├── api.js           # Axios instance + interceptors
│   │   ├── auth.js          # Auth endpoints
│   │   ├── workflows.js     # Workflow endpoints
│   │   ├── clients.js       # Client endpoints (admin)
│   │   └── ...
│   ├── store/               # Zustand stores
│   │   ├── authStore.js
│   │   ├── workflowStore.js
│   │   └── uiStore.js
│   ├── styles/
│   │   ├── globals.css
│   │   ├── tailwind.css
│   │   └── ...
│   ├── utils/
│   │   ├── constants.js
│   │   ├── helpers.js
│   │   ├── formatters.js
│   │   └── ...
│   ├── types/               # TypeScript types (if using TS)
│   │   └── index.ts
│   ├── App.jsx
│   ├── main.jsx
│   └── ...
├── .env.example
├── .eslintrc.json
├── tailwind.config.js
├── vite.config.js
├── package.json
├── README.md
└── ...
```

---

## 🔐 AUTHENTICATION FLOW

### Implementation
```
1. Login page
   - User enters email + password
   - POST /api/auth/login (from Backend-Architect)
   - Receive: { access_token, refresh_token, user, client }

2. Store in Zustand authStore:
   ```javascript
   const useAuthStore = create((set) => ({
     user: null,
     client: null,
     isAuthenticated: false,
     accessToken: null,
     refreshToken: null,

     login: async (email, password) => {
       const { access_token, refresh_token, user, client } =
         await api.post('/auth/login', { email, password })
       set({
         accessToken: access_token,
         refreshToken: refresh_token,
         user,
         client,
         isAuthenticated: true
       })
       localStorage.setItem('accessToken', access_token)
       localStorage.setItem('refreshToken', refresh_token)
     },

     logout: () => {
       set({
         user: null,
         isAuthenticated: false,
         accessToken: null,
         refreshToken: null
       })
       localStorage.clear()
     }
   }))
   ```

3. axios interceptor for API calls:
   ```javascript
   // Add token to all requests
   api.interceptors.request.use(config => {
     const token = useAuthStore.getState().accessToken
     if (token) {
       config.headers.Authorization = `Bearer ${token}`
     }
     return config
   })

   // Handle 401 Unauthorized
   api.interceptors.response.use(
     response => response,
     async error => {
       if (error.response.status === 401) {
         // Try to refresh token
         const refreshToken = localStorage.getItem('refreshToken')
         const { access_token } = await api.post('/auth/refresh',
           { refresh_token })
         // Retry original request with new token
       }
     }
   )
   ```

4. Protected routes
   ```javascript
   function ProtectedRoute({ children }) {
     const { isAuthenticated } = useAuthStore()
     return isAuthenticated ? children : <Navigate to="/login" />
   }

   // Usage:
   <Routes>
     <Route path="/login" element={<Login />} />
     <Route
       path="/dashboard"
       element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
     />
   </Routes>
   ```

5. Persist auth state
   - Check localStorage on app mount
   - If token exists, restore auth state
   - If token expired, clear auth
```

---

## 🎨 STYLING APPROACH

### TailwindCSS Setup
```
1. Install: npm install -D tailwindcss postcss autoprefixer
2. Generate config: npx tailwindcss init -p
3. tailwind.config.js:
   export default {
     content: [
       "./index.html",
       "./src/**/*.{js,jsx}"
     ],
     theme: {
       extend: {
         colors: {
           primary: {
             50: '#E8F4FF',
             600: '#007AFF',
             700: '#0051D5'
           },
           success: '#34C759',
           warning: '#FF9500',
           error: '#FF3B30'
         }
       }
     }
   }

4. Use Tailwind classes in components:
   <button className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg transition-colors">
     Action
   </button>
```

### Component Styling Examples
```javascript
// Button.jsx
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  ...props
}) {
  const variants = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white',
    secondary: 'border border-gray-300 text-gray-900 hover:bg-gray-50',
    danger: 'bg-error text-white hover:bg-red-600'
  }

  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  }

  return (
    <button
      className={`${variants[variant]} ${sizes[size]} rounded-lg transition-colors disabled:opacity-50`}
      disabled={loading}
      {...props}
    >
      {loading ? <Spinner /> : children}
    </button>
  )
}

// Usage:
<Button variant="primary" size="lg" onClick={handleClick}>
  Click me
</Button>
```

---

## 📡 API INTEGRATION

### Setup axios instance
```javascript
// services/api.js
import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000/api'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000
})

// Request interceptor (add token)
api.interceptors.request.use(config => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor (handle errors)
api.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error:', error.response?.status, error.message)
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
    }
    return Promise.reject(error)
  }
)

export default api
```

### Service methods
```javascript
// services/workflows.js
import api from './api'

export const workflowService = {
  list: () => api.get('/workflows'),

  get: (id) => api.get(`/workflows/${id}`),

  execute: (id, inputData) =>
    api.post(`/workflows/${id}/execute`, { input_data: inputData }),

  getExecution: (executionId) =>
    api.get(`/executions/${executionId}`),

  getExecutions: (workflowId, { limit, offset } = {}) =>
    api.get(`/workflows/${workflowId}/executions`,
      { params: { limit, offset } }),

  getStats: (workflowId) =>
    api.get(`/workflows/${workflowId}/stats`)
}

// Usage in components:
import { workflowService } from '../services/workflows'

const [workflows, setWorkflows] = useState([])

useEffect(() => {
  workflowService.list()
    .then(data => setWorkflows(data.workflows))
    .catch(err => console.error(err))
}, [])
```

---

## 🎣 CUSTOM HOOKS

### useApi hook
```javascript
// hooks/useApi.js
import { useState, useEffect } from 'react'

export function useApi(fn, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const result = await fn()
        setData(result)
        setError(null)
      } catch (err) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, deps)

  return { data, loading, error, refetch: () => fetchData() }
}

// Usage:
const { data: workflows, loading } = useApi(
  () => workflowService.list(),
  []
)
```

### useAuth hook
```javascript
// hooks/useAuth.js
import { useAuthStore } from '../store/authStore'

export function useAuth() {
  const { user, isAuthenticated, login, logout } = useAuthStore()
  return { user, isAuthenticated, login, logout }
}

// Usage in components:
const { user, logout } = useAuth()
```

---

## 🔧 STATE MANAGEMENT WITH ZUSTAND

### Structure
```javascript
// store/authStore.js
import { create } from 'zustand'
import { authService } from '../services/auth'

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  loading: false,

  login: async (email, password) => {
    set({ loading: true })
    try {
      const response = await authService.login(email, password)
      set({
        user: response.user,
        isAuthenticated: true,
        loading: false
      })
      localStorage.setItem('accessToken', response.accessToken)
    } catch (error) {
      set({ loading: false, error: error.message })
    }
  },

  logout: () => {
    set({ user: null, isAuthenticated: false })
    localStorage.clear()
  }
}))

// store/workflowStore.js
export const useWorkflowStore = create((set) => ({
  workflows: [],
  selectedWorkflow: null,

  setWorkflows: (workflows) => set({ workflows }),
  setSelectedWorkflow: (workflow) => set({ selectedWorkflow: workflow })
}))
```

---

## 📋 PAGE IMPLEMENTATIONS

### 1. LOGIN PAGE
```javascript
// pages/Login.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Button from '../components/common/Button'
import Input from '../components/common/Input'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8">MasStock</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button type="submit" loading={loading} size="lg">
            Se connecter
          </Button>
        </form>
      </div>
    </div>
  )
}
```

### 2. CLIENT DASHBOARD
```javascript
// components/client/Dashboard.jsx
import { useEffect, useState } from 'react'
import { useWorkflowStore } from '../../store/workflowStore'
import { workflowService } from '../../services/workflows'
import WorkflowCard from '../common/WorkflowCard'
import StatBox from '../common/StatBox'
import Button from '../common/Button'

export default function Dashboard() {
  const { workflows, setWorkflows } = useWorkflowStore()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await workflowService.list()
        setWorkflows(data.workflows)
        // Calculate stats
        setStats({
          activeWorkflows: data.workflows.length,
          pendingRequests: 1,
          assetsGenerated: 1200,
          timeSaved: '42h'
        })
      } catch (error) {
        console.error('Failed to load workflows:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [setWorkflows])

  if (loading) return <div>Loading...</div>

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Espace Estee</h1>
        <p className="text-gray-600">Bienvenue, Estee</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatBox label="Active Workflows" value={stats.activeWorkflows} />
        <StatBox label="Pending Requests" value={stats.pendingRequests} />
        <StatBox label="Assets Generated" value={stats.assetsGenerated} />
        <StatBox label="Time Saved" value={stats.timeSaved} />
      </div>

      {/* Workflows */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Mes Workflows</h2>
        <div className="grid grid-cols-3 gap-4">
          {workflows.map(workflow => (
            <WorkflowCard key={workflow.id} workflow={workflow} />
          ))}
        </div>
      </div>

      {/* Request button */}
      <Button variant="primary" size="lg">
        📝 Demander un nouveau workflow
      </Button>
    </div>
  )
}
```

### 3. WORKFLOW EXECUTION (Multi-step form)
```javascript
// components/client/WorkflowExecute.jsx
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import Button from '../common/Button'
import { workflowService } from '../../services/workflows'

export default function WorkflowExecute() {
  const { workflowId } = useParams()
  const [step, setStep] = useState(1) // 1: Input, 2: Confirm, 3: Processing, 4: Results
  const [formData, setFormData] = useState({})
  const [execution, setExecution] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleExecute = async () => {
    setLoading(true)
    try {
      const result = await workflowService.execute(workflowId, formData)
      setExecution(result)
      setStep(3) // Go to processing

      // Poll for status
      pollExecutionStatus(result.id)
    } catch (error) {
      console.error('Execution failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const pollExecutionStatus = async (executionId) => {
    const interval = setInterval(async () => {
      const status = await workflowService.getExecution(executionId)
      setExecution(status)

      if (status.status === 'completed' || status.status === 'failed') {
        clearInterval(interval)
        setStep(4)
      }
    }, 2000)
  }

  return (
    <div>
      {step === 1 && (
        <StepInput
          onNext={() => setStep(2)}
          onDataChange={setFormData}
        />
      )}
      {step === 2 && (
        <StepConfirm
          data={formData}
          onExecute={handleExecute}
          loading={loading}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && (
        <StepProcessing execution={execution} />
      )}
      {step === 4 && (
        <StepResults execution={execution} />
      )}
    </div>
  )
}
```

---

## 📊 ADMIN DASHBOARD FEATURES

### Admin Dashboard Overview
```javascript
// components/admin/AdminDashboard.jsx
import { useEffect, useState } from 'react'
import { adminService } from '../../services/admin'
import KPIBox from '../common/KPIBox'
import Chart from '../common/Chart'

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null)

  useEffect(() => {
    adminService.getDashboard()
      .then(setDashboard)
      .catch(console.error)
  }, [])

  if (!dashboard) return <div>Loading...</div>

  return (
    <div className="space-y-8">
      {/* Health Check */}
      <div className="grid grid-cols-4 gap-4">
        <KPIBox
          label="Uptime"
          value={`${dashboard.uptime}%`}
          status={dashboard.uptime > 99 ? 'good' : 'warning'}
        />
        <KPIBox label="Errors (24h)" value={dashboard.errors24h} />
        <KPIBox label="Perf API" value={`${dashboard.avgLatency}ms`} />
        <KPIBox label="Storage" value={dashboard.storageCost} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4">
        <Chart
          title="Requests Timeline"
          data={dashboard.requestsTimeline}
          type="line"
        />
        <Chart
          title="Usage by Workflow"
          data={dashboard.usageByWorkflow}
          type="pie"
        />
      </div>

      {/* Recent Activity */}
      <div>
        <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
        {dashboard.recentActivity.map(activity => (
          <ActivityItem key={activity.id} activity={activity} />
        ))}
      </div>
    </div>
  )
}
```

---

## 🧪 TESTING

### Setup
```
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

### Example test
```javascript
// __tests__/Button.test.jsx
import { render, screen } from '@testing-library/react'
import { Button } from '../components/common/Button'

describe('Button', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toHaveTextContent('Click me')
  })

  it('shows loading state', () => {
    render(<Button loading>Loading...</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
```

---

## 📦 BUILD & DEPLOYMENT

### Build commands
```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Vite config
```javascript
// vite.config.js
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
```

### Environment variables
```
// .env.example
VITE_API_URL=http://localhost:3000/api
VITE_ENV=development
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

---

## 🎯 PRIORITY FEATURES (MVP)

### MUST-HAVE (Days 1-3):
- ✅ Login page + authentication
- ✅ Client dashboard (view workflows)
- ✅ Workflow execution (multi-step form)
- ✅ Display workflow results

### SHOULD-HAVE (Days 4-5):
- ✅ Request new workflow form
- ✅ Requests in progress page
- ✅ Client settings page
- ✅ Basic admin dashboard

### COULD-HAVE (Days 6-7):
- ✅ Admin clients management
- ✅ Admin workflows management
- ✅ Admin errors/logs viewer
- ✅ Admin support tickets

---

## 🚨 ERROR HANDLING STRATEGY

### Global error boundary
```javascript
// components/ErrorBoundary.jsx
import { Component } from 'react'

export class ErrorBoundary extends Component {
  componentDidCatch(error, errorInfo) {
    console.error('Error caught:', error, errorInfo)
  }

  render() {
    if (this.state?.hasError) {
      return <div>Something went wrong. Please refresh.</div>
    }
    return this.props.children
  }
}
```

### API error handling
```javascript
// Wrap all API calls with try-catch
try {
  const data = await workflowService.execute(id, input)
} catch (error) {
  if (error.response?.status === 401) {
    // Redirect to login
  } else if (error.response?.status === 400) {
    // Show validation error
  } else {
    // Show generic error
  }
}
```

---

## 📱 RESPONSIVE DESIGN CHECKLIST

- ✅ Sidebar collapses on mobile
- ✅ Cards/grids stack vertically on mobile
- ✅ Touch-friendly buttons (min 44px)
- ✅ Images optimized for different screens
- ✅ Tables become cards on mobile
- ✅ Modals full-width on mobile

---

## 🔍 PERFORMANCE OPTIMIZATION

- ✅ Code splitting with React.lazy()
- ✅ Image optimization (lazy loading)
- ✅ Memoization (React.memo, useMemo)
- ✅ Virtual scrolling for long lists
- ✅ Debounce API calls
- ✅ Cache API responses

---

## 📚 DELIVERABLES

1. ✅ **Complete React app** with all features
2. ✅ **All screens** from UI-Designer
3. ✅ **API integration** with Backend
4. ✅ **Authentication** flow working
5. ✅ **Error handling** implemented
6. ✅ **Responsive design** for mobile/tablet/desktop
7. ✅ **Tests** for critical components
8. ✅ **README** with setup instructions
9. ✅ **Deployed on Vercel** (live URL)

---

## 🚀 SUCCESS CRITERIA

Your frontend is complete when:
- ✅ User can login with Estee credentials
- ✅ User can view their workflows
- ✅ User can execute a workflow and see results
- ✅ Admin can view dashboard with all KPIs
- ✅ Admin can manage clients, workflows, errors
- ✅ All pages are responsive
- ✅ Error handling works smoothly
- ✅ App deployed and live
- ✅ Performance is optimized
- ✅ No console errors/warnings

---

## 📞 DEPENDENCIES

You'll be integrating with:
1. **Backend API** from Backend-Architect
   - Start with API specification (Swagger/OpenAPI)
   - Test endpoints in Postman before integration

2. **Design System** from UI-Designer
   - Get Figma link with all components
   - Import design tokens (colors, typography, spacing)
   - Match pixels-perfect if possible

---

Bon développement! 🚀

```
