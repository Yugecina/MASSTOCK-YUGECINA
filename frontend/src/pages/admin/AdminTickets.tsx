/**
 * AdminTickets Page - TypeScript
 * Support ticket management with filtering
 * PURE CSS ONLY - No Tailwind
 */

import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Spinner } from '../../components/ui/Spinner';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { adminDashboardService } from '../../services/adminDashboardService';
import logger from '@/utils/logger';
import './AdminTickets.css';

type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
type TicketPriority = 'urgent' | 'high' | 'medium' | 'low';

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority?: TicketPriority;
  client_name: string;
  created_at: string;
}

interface TicketsResponse {
  tickets?: Ticket[];
}

interface Stats {
  total: number;
  open: number;
  inProgress: number;
  urgent: number;
}

/**
 * AdminTickets Component
 * Dark Premium Editorial Design - Refined ticket management with visual hierarchy
 */
export function AdminTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  useEffect(() => {
    async function loadTickets() {
      try {
        logger.debug('💬 AdminTickets: Loading tickets...');
        const response: { data?: TicketsResponse } = await adminDashboardService.getTickets();
        logger.debug('✅ AdminTickets: Response received:', response);
        setTickets(response.data?.tickets || []);
      } catch (err: any) {
        logger.error('❌ AdminTickets: Failed to fetch tickets:', err);
        toast.error('Failed to load tickets');
      } finally {
        setLoading(false);
      }
    }
    loadTickets();
  }, []);

  // Calculate stats
  const stats: Stats = useMemo(() => {
    return {
      total: tickets.length,
      open: tickets.filter(t => t.status === 'open').length,
      inProgress: tickets.filter(t => t.status === 'in_progress').length,
      urgent: tickets.filter(t => t.priority === 'urgent').length
    };
  }, [tickets]);

  // Filter tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      const statusMatch = statusFilter === 'all' || ticket.status === statusFilter;
      const priorityMatch = priorityFilter === 'all' || ticket.priority === priorityFilter;
      return statusMatch && priorityMatch;
    });
  }, [tickets, statusFilter, priorityFilter]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleStatusChange = (ticketId: string, newStatus: TicketStatus) => {
    toast.success(`Ticket #${ticketId.substring(0, 8)} marked as ${newStatus}`);
    // TODO: Implement API call
  };

  return (
    <AdminLayout>
      <div className="admin-page">
        {/* Header */}
        <header className="admin-header">
          <div>
            <h1 className="admin-title">Support Tickets</h1>
            <p className="admin-subtitle">Manage customer support requests and issues</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => toast('Add Ticket feature coming soon', { icon: 'ℹ️' })}
          >
            + New Ticket
          </button>
        </header>

        {loading ? (
          <div className="admin-loading">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="admin-tickets-container">
            {/* Stats Overview */}
            <div className="tickets-stats-bar">
              <div className="tickets-stat-card">
                <span className="tickets-stat-label">Total Tickets</span>
                <span className="tickets-stat-value">{stats.total}</span>
                <span className="tickets-stat-trend">All time</span>
              </div>
              <div className="tickets-stat-card">
                <span className="tickets-stat-label">Open</span>
                <span className="tickets-stat-value">{stats.open}</span>
                <span className="tickets-stat-trend">Awaiting response</span>
              </div>
              <div className="tickets-stat-card">
                <span className="tickets-stat-label">In Progress</span>
                <span className="tickets-stat-value">{stats.inProgress}</span>
                <span className="tickets-stat-trend">Being worked on</span>
              </div>
              <div className="tickets-stat-card">
                <span className="tickets-stat-label">Urgent</span>
                <span className="tickets-stat-value">{stats.urgent}</span>
                <span className="tickets-stat-trend">High priority</span>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="tickets-filter-bar">
              <div className="tickets-filter-group">
                <button
                  className={`filter-chip ${statusFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('all')}
                >
                  All Status
                </button>
                <button
                  className={`filter-chip ${statusFilter === 'open' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('open')}
                >
                  Open
                </button>
                <button
                  className={`filter-chip ${statusFilter === 'in_progress' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('in_progress')}
                >
                  In Progress
                </button>
                <button
                  className={`filter-chip ${statusFilter === 'resolved' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('resolved')}
                >
                  Resolved
                </button>
              </div>

              <div className="filter-divider" />

              <div className="tickets-filter-group">
                <button
                  className={`filter-chip ${priorityFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setPriorityFilter('all')}
                >
                  All Priority
                </button>
                <button
                  className={`filter-chip ${priorityFilter === 'urgent' ? 'active' : ''}`}
                  onClick={() => setPriorityFilter('urgent')}
                >
                  Urgent
                </button>
                <button
                  className={`filter-chip ${priorityFilter === 'high' ? 'active' : ''}`}
                  onClick={() => setPriorityFilter('high')}
                >
                  High
                </button>
                <button
                  className={`filter-chip ${priorityFilter === 'medium' ? 'active' : ''}`}
                  onClick={() => setPriorityFilter('medium')}
                >
                  Medium
                </button>
                <button
                  className={`filter-chip ${priorityFilter === 'low' ? 'active' : ''}`}
                  onClick={() => setPriorityFilter('low')}
                >
                  Low
                </button>
              </div>
            </div>

            {/* Tickets Grid */}
            {filteredTickets.length === 0 ? (
              <div className="tickets-empty-state">
                <div className="tickets-empty-icon">💬</div>
                <h3 className="tickets-empty-title">
                  {tickets.length === 0
                    ? 'No support tickets'
                    : 'No tickets match your filters'}
                </h3>
                <p className="tickets-empty-text">
                  {tickets.length === 0
                    ? 'All tickets have been resolved. Great job!'
                    : 'Try adjusting your filters to see more results.'}
                </p>
              </div>
            ) : (
              <div className="admin-tickets-grid">
                {filteredTickets.map((ticket) => (
                  <article
                    key={ticket.id}
                    className={`admin-ticket-card priority-${ticket.priority?.toLowerCase() || 'medium'}`}
                  >
                    {/* Card Header */}
                    <div className="ticket-card-header">
                      <span className="ticket-id-badge">
                        #{ticket.id.substring(0, 8)}
                      </span>
                      <div className="ticket-badges">
                        <span className={`ticket-status-badge status-${ticket.status}`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                        <span className={`ticket-priority-badge priority-${ticket.priority?.toLowerCase() || 'medium'}`}>
                          {ticket.priority}
                        </span>
                      </div>
                    </div>

                    {/* Ticket Content */}
                    <div className="ticket-content">
                      <h3 className="ticket-title">{ticket.title}</h3>
                      <p className="ticket-description">{ticket.description}</p>
                    </div>

                    {/* Ticket Meta */}
                    <div className="ticket-meta">
                      <div className="ticket-meta-left">
                        <span className="ticket-client-label">Client</span>
                        <span className="ticket-client">{ticket.client_name}</span>
                      </div>
                      <span className="ticket-timestamp">
                        {formatDate(ticket.created_at)}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    {(ticket.status === 'open' || ticket.status === 'in_progress') && (
                      <div className="ticket-actions">
                        {ticket.status === 'open' && (
                          <button
                            className="ticket-action-btn primary"
                            onClick={() => handleStatusChange(ticket.id, 'in_progress')}
                          >
                            Start Working
                          </button>
                        )}
                        {ticket.status === 'in_progress' && (
                          <button
                            className="ticket-action-btn primary"
                            onClick={() => handleStatusChange(ticket.id, 'resolved')}
                          >
                            Mark Resolved
                          </button>
                        )}
                        <button
                          className="ticket-action-btn"
                          onClick={() => toast('View details coming soon', { icon: 'ℹ️' })}
                        >
                          View Details
                        </button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
