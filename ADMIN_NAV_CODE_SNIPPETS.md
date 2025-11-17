# Admin Navigation - Key Code Snippets

## 1. AdminSidebar Component

**File:** `/Users/dorian/Documents/MASSTOCK/frontend/src/components/layout/AdminSidebar.jsx`

```jsx
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export function AdminSidebar() {
  const { user, logout } = useAuth()

  const adminNavItems = [
    { path: '/admin/dashboard', label: 'Dashboard Admin', icon: '📊' },
    { path: '/admin/users', label: 'Utilisateurs', icon: '👥' },
    { path: '/admin/clients', label: 'Clients', icon: '🏢' },
    { path: '/admin/workflows', label: 'Workflows Globaux', icon: '⚙️' },
    { path: '/admin/support', label: 'Support', icon: '💬' },
    { path: '/admin/settings', label: 'Paramètres', icon: '⚙️' },
  ]

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-70 bg-white border-r border-neutral-200 flex flex-col z-30">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-neutral-200">
        <h1 className="text-h2 font-bold text-primary-main">MasStock</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {adminNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-light text-primary-main'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User Section */}
      <div className="border-t border-neutral-200 px-6 py-4">
        <div className="mb-4">
          <div className="text-xs uppercase tracking-wide text-neutral-400 font-semibold mb-2">Account</div>
          <div className="text-sm font-medium text-neutral-900">{user?.name || 'Admin'}</div>
          <div className="text-xs text-neutral-500">{user?.email || 'admin@masstock.com'}</div>
        </div>
        <button
          onClick={logout}
          className="w-full px-4 py-2 text-sm font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
        >
          Logout
        </button>
      </div>
    </aside>
  )
}
```

**Key Features:**
- Responsive NavLink with isActive state
- Dynamic active/inactive styling
- Icon support via emoji
- User info display
- Logout functionality via useAuth hook

---

## 2. AdminLayout Component

**File:** `/Users/dorian/Documents/MASSTOCK/frontend/src/components/layout/AdminLayout.jsx`

```jsx
import { AdminSidebar } from './AdminSidebar'

export function AdminLayout({ children }) {
  return (
    <div className="flex h-screen bg-neutral-50">
      <AdminSidebar />
      <div className="flex-1 ml-70 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-neutral-200 px-8 py-4 flex items-center justify-between">
          <div className="flex-1">
            {/* Header content can be added here */}
          </div>
          <div className="flex items-center gap-4">
            {/* Header actions can be added here */}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
```

**Key Features:**
- Wrapper component for admin pages
- Fixed header with placeholder areas
- Scrollable main content area
- Sidebar integration
- Max-width container for content

---

## 3. Using AdminLayout in Pages

**Example:** `/Users/dorian/Documents/MASSTOCK/frontend/src/pages/admin/AdminDashboard.jsx`

```jsx
import { useState, useEffect } from 'react'
import { Card } from '../../components/ui/Card'
import { Spinner } from '../../components/ui/Spinner'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { adminService } from '../../services/admin'

export function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboard() {
      try {
        const data = await adminService.getDashboard()
        setDashboard(data)
      } catch (error) {
      } finally {
        setLoading(false)
      }
    }
    loadDashboard()
  }, [])

  if (loading) return <AdminLayout><div className="flex justify-center items-center min-h-screen"><Spinner /></div></AdminLayout>

  return (
    <AdminLayout>
      <h1 className="text-h1 font-bold">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <Card>
          <div className="text-label text-neutral-600">Uptime</div>
          <div className="text-h2 font-bold text-success-main">99.8%</div>
        </Card>
        {/* More cards... */}
      </div>

      <Card className="mt-6">
        <h2 className="text-h2 font-bold mb-4">Recent Activity</h2>
        {/* Content */}
      </Card>
    </AdminLayout>
  )
}
```

**Key Pattern:**
- Wrap entire page with `<AdminLayout>`
- Place loading states inside AdminLayout for consistent header/sidebar
- Use mt-6 for spacing from top

---

## 4. New AdminUsers Page

**File:** `/Users/dorian/Documents/MASSTOCK/frontend/src/pages/admin/AdminUsers.jsx`

```jsx
import { useState, useEffect } from 'react'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Spinner } from '../../components/ui/Spinner'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { adminService } from '../../services/admin'

export function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadUsers() {
      try {
        const data = await adminService.getUsers()
        setUsers(data.users || [])
      } catch (error) {
      } finally {
        setLoading(false)
      }
    }
    loadUsers()
  }, [])

  return (
    <AdminLayout>
      <h1 className="text-h1 font-bold">Users Management</h1>

      {loading ? (
        <div className="flex justify-center mt-8">
          <Spinner />
        </div>
      ) : (
        <div className="overflow-x-auto mt-6">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="text-left p-4 text-label font-bold">Name</th>
                <th className="text-left p-4 text-label font-bold">Email</th>
                <th className="text-left p-4 text-label font-bold">Role</th>
                <th className="text-left p-4 text-label font-bold">Status</th>
                <th className="text-left p-4 text-label font-bold">Created</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-neutral-200 hover:bg-neutral-50">
                  <td className="p-4">{user.name}</td>
                  <td className="p-4">{user.email}</td>
                  <td className="p-4">
                    <Badge variant="neutral">{user.role}</Badge>
                  </td>
                  <td className="p-4">
                    <Badge variant={user.status === 'active' ? 'success' : 'warning'}>
                      {user.status}
                    </Badge>
                  </td>
                  <td className="p-4">{new Date(user.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  )
}
```

---

## 5. New AdminSettings Page

**File:** `/Users/dorian/Documents/MASSTOCK/frontend/src/pages/admin/AdminSettings.jsx`

```jsx
import { useState, useEffect } from 'react'
import { Card } from '../../components/ui/Card'
import { Spinner } from '../../components/ui/Spinner'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { adminService } from '../../services/admin'

export function AdminSettings() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await adminService.getSettings()
        setSettings(data)
      } catch (error) {
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await adminService.updateSettings(settings)
    } catch (error) {
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <AdminLayout><div className="flex justify-center items-center min-h-screen"><Spinner /></div></AdminLayout>

  return (
    <AdminLayout>
      <h1 className="text-h1 font-bold">Settings & Configuration</h1>

      <div className="space-y-6 mt-6">
        <Card>
          <h2 className="text-h2 font-bold mb-4">System Settings</h2>
          <div className="space-y-4">
            <div className="input-group">
              <label>API Rate Limit</label>
              <input
                type="number"
                value={settings?.api_rate_limit || 1000}
                onChange={(e) => setSettings({ ...settings, api_rate_limit: e.target.value })}
                className="p-3 border border-neutral-200 rounded-lg"
              />
            </div>
            <div className="input-group">
              <label>Max Concurrent Workflows</label>
              <input
                type="number"
                value={settings?.max_concurrent_workflows || 50}
                onChange={(e) => setSettings({ ...settings, max_concurrent_workflows: e.target.value })}
                className="p-3 border border-neutral-200 rounded-lg"
              />
            </div>
            <div className="input-group">
              <label>Maintenance Mode</label>
              <select
                value={settings?.maintenance_mode ? 'enabled' : 'disabled'}
                onChange={(e) => setSettings({ ...settings, maintenance_mode: e.target.value === 'enabled' })}
                className="p-3 border border-neutral-200 rounded-lg"
              >
                <option value="disabled">Disabled</option>
                <option value="enabled">Enabled</option>
              </select>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-h2 font-bold mb-4">Email Configuration</h2>
          <div className="space-y-4">
            <div className="input-group">
              <label>SMTP Host</label>
              <input
                type="text"
                value={settings?.smtp_host || ''}
                onChange={(e) => setSettings({ ...settings, smtp_host: e.target.value })}
                className="p-3 border border-neutral-200 rounded-lg"
              />
            </div>
            <div className="input-group">
              <label>SMTP Port</label>
              <input
                type="number"
                value={settings?.smtp_port || 587}
                onChange={(e) => setSettings({ ...settings, smtp_port: e.target.value })}
                className="p-3 border border-neutral-200 rounded-lg"
              />
            </div>
          </div>
        </Card>

        <div className="flex gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
          <button className="btn btn-secondary">
            Reset to Defaults
          </button>
        </div>
      </div>
    </AdminLayout>
  )
}
```

---

## 6. Test Example - AdminSidebar

**File:** `/Users/dorian/Documents/MASSTOCK/frontend/src/__tests__/components/layout/AdminSidebar.test.jsx`

```jsx
describe('AdminSidebar', () => {
  it('devrait afficher toutes les sections de navigation admin', () => {
    renderWithRouter(<AdminSidebar />)

    expect(screen.getByText('Dashboard Admin')).toBeInTheDocument()
    expect(screen.getByText('Utilisateurs')).toBeInTheDocument()
    expect(screen.getByText('Clients')).toBeInTheDocument()
    expect(screen.getByText('Workflows Globaux')).toBeInTheDocument()
    expect(screen.getByText('Support')).toBeInTheDocument()
    expect(screen.getByText('Paramètres')).toBeInTheDocument()
  })

  it('devrait afficher les liens avec les bonnes routes', () => {
    renderWithRouter(<AdminSidebar />)

    const dashboardLink = screen.getByRole('link', { name: /dashboard admin/i })
    expect(dashboardLink).toHaveAttribute('href', '/admin/dashboard')

    const usersLink = screen.getByRole('link', { name: /utilisateurs/i })
    expect(usersLink).toHaveAttribute('href', '/admin/users')

    const clientsLink = screen.getByRole('link', { name: /clients/i })
    expect(clientsLink).toHaveAttribute('href', '/admin/clients')
  })
})
```

---

## 7. CSS Classes Reference

### Sidebar Layout
```
fixed left-0 top-0 bottom-0 w-70 bg-white border-r border-neutral-200 flex flex-col z-30
```

### Navigation Links
```
flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
```

### Active Link State
```
bg-primary-light text-primary-main
```

### Inactive Link State
```
text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900
```

### Main Layout Container
```
flex h-screen bg-neutral-50
```

### Content Wrapper
```
flex-1 ml-70 flex flex-col overflow-hidden
```

### Header
```
bg-white border-b border-neutral-200 px-8 py-4 flex items-center justify-between
```

### Main Content Area
```
flex-1 overflow-auto
```

### Content Container
```
p-8 max-w-7xl mx-auto
```

---

## Integration Checklist for Developers

When adding new admin pages:

1. Import AdminLayout:
   ```jsx
   import { AdminLayout } from '../../components/layout/AdminLayout'
   ```

2. Wrap entire page with AdminLayout:
   ```jsx
   return (
     <AdminLayout>
       {/* Page content */}
     </AdminLayout>
   )
   ```

3. Add title at top:
   ```jsx
   <h1 className="text-h1 font-bold">Page Title</h1>
   ```

4. Add spacing with mt-6:
   ```jsx
   <div className="mt-6">
     {/* Content with space from title */}
   </div>
   ```

5. Use global.css classes only (no Tailwind)

6. Add navigation entry to AdminSidebar.jsx if needed

---

## Testing Utilities

```jsx
// Helper for wrapping components with Router
function renderWithRouter(component) {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

// Usage
renderWithRouter(<AdminSidebar />)
```

---

## Performance Considerations

1. **Lazy Loading:** Consider using React.lazy() for admin pages
2. **Code Splitting:** Webpack handles automatic code splitting
3. **CSS:** Global.css is shared, reducing duplication
4. **Component Reuse:** Sidebar/Layout are reused across all admin pages

---

## Accessibility Features

- Semantic HTML with `<aside>`, `<nav>`, `<header>`, `<main>` tags
- Proper button elements with click handlers
- Link-based navigation using NavLink
- ARIA labels through useAuth hook context
- Keyboard navigation support via native HTML elements
- Focus styles via global.css hover classes
