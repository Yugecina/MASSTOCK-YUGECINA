import React, { useEffect, ReactNode } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { WorkflowsList } from './pages/WorkflowsList'
import { WorkflowDetail } from './pages/WorkflowDetail'
import { WorkflowExecute } from './pages/WorkflowExecute'
import { Executions } from './pages/Executions'
import { ExecutionDetail } from './pages/ExecutionDetail'
import { Assets } from './pages/Assets'
import SmartResizer from './pages/SmartResizer'
import { Requests } from './pages/Requests'
import { Settings } from './pages/Settings'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { AdminUsers } from './pages/admin/AdminUsers'
import { AdminClients } from './pages/admin/AdminClients'
import { AdminClientDetail } from './pages/admin/AdminClientDetail'
import { AdminWorkflows } from './pages/admin/AdminWorkflows'
import { AdminErrors } from './pages/admin/AdminErrors'
import { AdminTickets } from './pages/admin/AdminTickets'
import { AdminFinances } from './pages/admin/AdminFinances'
import { AdminSettings } from './pages/admin/AdminSettings'
import { NotFound } from './pages/NotFound'
import { useAuth } from './hooks/useAuth'
import { useAuthStore } from './store/authStore'

interface AppProps {
  children?: ReactNode
}

interface LoadingStateProps {
  minHeight: string
}

/**
 * Main App component - Sets up routing and authentication
 * - Initializes auth state on startup
 * - Shows loading screen while checking authentication
 * - Routes public (Login) and protected routes
 * - Provides toast notifications via react-hot-toast
 */
export default function App(_props: AppProps): React.ReactElement {
  const { isAuthenticated, user, loading } = useAuth()
  const initAuth = useAuthStore((state) => state.initAuth)

  // Initialize authentication state on app startup
  useEffect(() => {
    initAuth()
  }, [initAuth])

  // Show loading indicator while checking authentication
  if (loading) {
    const loadingStyle: LoadingStateProps = { minHeight: '100vh' }
    return (
      <div className="flex items-center justify-center" style={loadingStyle}>
        <div className="text-center">
          <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              !isAuthenticated
                ? <Login />
                : <Navigate to={user?.role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace />
            }
          />

          {/* Protected Routes - User Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workflows"
            element={
              <ProtectedRoute>
                <WorkflowsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workflows/:id"
            element={
              <ProtectedRoute>
                <WorkflowDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workflows/:id/execute"
            element={
              <ProtectedRoute>
                <WorkflowExecute />
              </ProtectedRoute>
            }
          />
          <Route
            path="/executions"
            element={
              <ProtectedRoute>
                <Executions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/executions/:id"
            element={
              <ProtectedRoute>
                <ExecutionDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assets"
            element={
              <ProtectedRoute>
                <Assets />
              </ProtectedRoute>
            }
          />
          <Route
            path="/requests"
            element={
              <ProtectedRoute>
                <Requests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />

          {/* Protected Routes - Admin Dashboard */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/clients"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminClients />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/clients/:id"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminClientDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/workflows"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminWorkflows />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/errors"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminErrors />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/tickets"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminTickets />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/finances"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminFinances />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminSettings />
              </ProtectedRoute>
            }
          />

          {/* Catch-all Routes */}
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
      <Toaster />
    </>
  )
}
