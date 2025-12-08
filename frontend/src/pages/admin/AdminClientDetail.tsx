import { useEffect, ReactElement } from 'react'
import { useParams, useNavigate, Params } from 'react-router-dom'
import { Spinner } from '../../components/ui/Spinner'
import { AdminLayout } from '../../components/layout/AdminLayout'
import useAdminClientStore from '../../store/adminClientStore'
import { ClientOverviewTab } from '../../components/admin/ClientOverviewTab'
import { ClientMembersTab } from '../../components/admin/ClientMembersTab'
import { ClientWorkflowsTab } from '../../components/admin/ClientWorkflowsTab'
import { ClientExecutionsTab } from '../../components/admin/ClientExecutionsTab'
import { ClientActivityTab } from '../../components/admin/ClientActivityTab'

/**
 * Type Definitions
 */
interface ClientData {
  company_name?: string;
  name?: string;
  email?: string;
  status?: string;
  plan?: string;
}

interface ClientState {
  client?: ClientData | { client: ClientData };
  stats?: any;
}

type TabId = 'overview' | 'members' | 'workflows' | 'executions' | 'activity';

interface Tab {
  id: TabId;
  label: string;
  icon: ReactElement;
}

/**
 * SVG Icons for tabs - Clean, minimal line icons
 */
const TabIcons = {
  overview: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </svg>
  ),
  members: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  workflows: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  ),
  executions: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.85 1.03 6.5 2.75" />
      <polyline points="21 3 21 9 15 9" />
    </svg>
  ),
  activity: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  ),
  back: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  )
}

/**
 * AdminClientDetail - Client detail page with tabs
 * Dark Premium Style
 */
export function AdminClientDetail() {
  const { id: clientId } = useParams<Params>()
  const navigate = useNavigate()

  const {
    client,
    clientLoading,
    clientError,
    activeTab,
    setActiveTab,
    fetchClientDetail,
    resetStore
  } = useAdminClientStore()

  console.log('🔍 AdminClientDetail: Render', {
    clientId,
    client,
    clientLoading,
    clientError,
    activeTab
  })

  useEffect(() => {
    console.log('🔍 AdminClientDetail: useEffect triggered', { clientId })
    if (clientId) {
      fetchClientDetail(clientId)
    }

    // Cleanup on unmount
    return () => {
      console.log('🔍 AdminClientDetail: Cleanup - resetting store')
      resetStore()
    }
  }, [clientId, fetchClientDetail, resetStore])

  const tabs: Tab[] = [
    { id: 'overview', label: 'Overview', icon: TabIcons.overview },
    { id: 'members', label: 'Members', icon: TabIcons.members },
    { id: 'workflows', label: 'Workflows', icon: TabIcons.workflows },
    { id: 'executions', label: 'Executions', icon: TabIcons.executions },
    { id: 'activity', label: 'Activity', icon: TabIcons.activity }
  ]

  const renderTabContent = (): ReactElement => {
    if (!clientId) return <div>No client ID</div>

    switch (activeTab) {
      case 'overview':
        return <ClientOverviewTab clientId={clientId} />
      case 'members':
        return <ClientMembersTab clientId={clientId} />
      case 'workflows':
        return <ClientWorkflowsTab clientId={clientId} />
      case 'executions':
        return <ClientExecutionsTab clientId={clientId} />
      case 'activity':
        return <ClientActivityTab clientId={clientId} />
      default:
        return <ClientOverviewTab clientId={clientId} />
    }
  }

  if (clientLoading) {
    return (
      <AdminLayout>
        <div className="admin-page">
          <div className="admin-loading">
            <Spinner size="lg" />
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (clientError) {
    return (
      <AdminLayout>
        <div className="admin-page">
          <div className="admin-card">
            <div className="admin-empty">
              <div className="admin-empty-icon admin-empty-icon--error">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
              <h3 className="admin-empty-title">Error loading client</h3>
              <p className="admin-empty-text">{clientError}</p>
              <button className="btn btn-primary" onClick={() => navigate('/admin/clients')}>
                Back to Clients
              </button>
            </div>
          </div>
        </div>
      </AdminLayout>
    )
  }

  const clientData: ClientData = (client as any)?.client || client || {}

  console.log('🔍 AdminClientDetail: clientData extracted', {
    clientFromStore: client,
    clientData,
    stats: (client as ClientState)?.stats
  })

  return (
    <AdminLayout>
      <div className="admin-page">
        {/* Header */}
        <header className="admin-header">
          <div className="admin-header-back">
            <button
              className="btn btn-secondary btn-sm admin-back-btn"
              onClick={() => navigate('/admin/clients')}
            >
              {TabIcons.back}
              <span>Back</span>
            </button>
            <div>
              <h1 className="admin-title">{clientData?.company_name || clientData?.name || 'Client'}</h1>
              <p className="admin-subtitle">{clientData?.email}</p>
            </div>
          </div>
          <div className="admin-header-actions">
            <span className={`admin-badge admin-badge--lg ${clientData?.status === 'active' ? 'admin-badge--success' : 'admin-badge--warning'}`}>
              {clientData?.status || 'Unknown'}
            </span>
            <span className="admin-badge admin-badge--lg admin-badge--info">
              {clientData?.plan || 'No Plan'}
            </span>
          </div>
        </header>

        {/* Tabs */}
        <div className="admin-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="admin-tab-icon">{tab.icon}</span>
              <span className="admin-tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="admin-tab-content">
          {renderTabContent()}
        </div>
      </div>
    </AdminLayout>
  )
}
