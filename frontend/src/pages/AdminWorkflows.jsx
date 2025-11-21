/**
 * AdminWorkflows Page
 * Main page for admin workflow and request management
 */

import React, { useState, useEffect, useCallback } from 'react';
import { WorkflowTable } from '../components/admin/WorkflowTable';
import { WorkflowRequestsList } from '../components/admin/WorkflowRequestsList';
import { adminWorkflowService } from '../services/adminWorkflowService';

export function AdminWorkflows() {
  const [activeTab, setActiveTab] = useState('workflows');
  const [workflows, setWorkflows] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Workflows state
  const [workflowsPage, setWorkflowsPage] = useState(1);
  const [workflowsTotal, setWorkflowsTotal] = useState(0);
  const [workflowsTotalPages, setWorkflowsTotalPages] = useState(0);
  const [workflowFilters, setWorkflowFilters] = useState({
    status: '',
    search: '',
  });

  // Requests state
  const [requestsPage, setRequestsPage] = useState(1);
  const [requestsTotal, setRequestsTotal] = useState(0);
  const [requestsTotalPages, setRequestsTotalPages] = useState(0);
  const [requestFilters, setRequestFilters] = useState({
    status: '',
    search: '',
  });

  // Debounce timer
  const [searchTimer, setSearchTimer] = useState(null);

  // Load workflows
  const loadWorkflows = useCallback(async (page = 1, filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const cleanFilters = {};
      if (filters.status) cleanFilters.status = filters.status;
      if (filters.search) cleanFilters.search = filters.search;

      const response = await adminWorkflowService.getWorkflows(page, cleanFilters);

      if (response.success) {
        setWorkflows(response.data.workflows);
        setWorkflowsTotal(response.data.total);
        setWorkflowsTotalPages(response.data.totalPages);
        setWorkflowsPage(response.data.page);
      }
    } catch (err) {
      setError(err.message || 'Failed to load workflows');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load requests
  const loadRequests = useCallback(async (page = 1, filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const cleanFilters = {};
      if (filters.status) cleanFilters.status = filters.status;
      if (filters.search) cleanFilters.search = filters.search;

      const response = await adminWorkflowService.getWorkflowRequests(page, cleanFilters);

      if (response.success) {
        setRequests(response.data.requests);
        setRequestsTotal(response.data.total);
        setRequestsTotalPages(response.data.totalPages);
        setRequestsPage(response.data.page);
      }
    } catch (err) {
      setError(err.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load initial workflows
  useEffect(() => {
    loadWorkflows(1, {});
  }, [loadWorkflows]);

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'requests' && requests.length === 0) {
      loadRequests(1, {});
    }
  };

  // Handle workflow filter changes
  const handleWorkflowStatusChange = (status) => {
    const newFilters = { ...workflowFilters, status };
    setWorkflowFilters(newFilters);
    loadWorkflows(1, newFilters);
  };

  const handleWorkflowSearchChange = (search) => {
    const newFilters = { ...workflowFilters, search };
    setWorkflowFilters(newFilters);

    // Debounce search
    if (searchTimer) {
      clearTimeout(searchTimer);
    }

    const timer = setTimeout(() => {
      loadWorkflows(1, newFilters);
    }, 300);

    setSearchTimer(timer);
  };

  // Handle request filter changes
  const handleRequestStageChange = (status) => {
    const newFilters = { ...requestFilters, status };
    setRequestFilters(newFilters);
    loadRequests(1, newFilters);
  };

  const handleRequestSearchChange = (search) => {
    const newFilters = { ...requestFilters, search };
    setRequestFilters(newFilters);

    // Debounce search
    if (searchTimer) {
      clearTimeout(searchTimer);
    }

    const timer = setTimeout(() => {
      loadRequests(1, newFilters);
    }, 300);

    setSearchTimer(timer);
  };

  // Handle pagination
  const handleWorkflowsNextPage = () => {
    if (workflowsPage < workflowsTotalPages) {
      loadWorkflows(workflowsPage + 1, workflowFilters);
    }
  };

  const handleWorkflowsPrevPage = () => {
    if (workflowsPage > 1) {
      loadWorkflows(workflowsPage - 1, workflowFilters);
    }
  };

  const handleRequestsNextPage = () => {
    if (requestsPage < requestsTotalPages) {
      loadRequests(requestsPage + 1, requestFilters);
    }
  };

  const handleRequestsPrevPage = () => {
    if (requestsPage > 1) {
      loadRequests(requestsPage - 1, requestFilters);
    }
  };

  // Handle workflow actions
  const handleViewDetails = (workflowId) => {
    // TODO: Implement modal or navigate to details page
  };

  const handleArchiveWorkflow = async (workflowId) => {
    try {
      await adminWorkflowService.deleteWorkflow(workflowId);
      loadWorkflows(workflowsPage, workflowFilters);
    } catch (err) {
      setError(err.message || 'Failed to archive workflow');
    }
  };

  // Handle request stage update
  const handleUpdateRequestStage = async (requestId, stage) => {
    try {
      await adminWorkflowService.updateWorkflowRequestStage(requestId, stage);
      loadRequests(requestsPage, requestFilters);
    } catch (err) {
      setError(err.message || 'Failed to update request stage');
    }
  };

  return (
    <div style={{ padding: 'var(--spacing-xl)', minHeight: '100vh', backgroundColor: 'var(--neutral-50)' }}>
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: 'var(--spacing-xl)' }}>
          <h1 className="text-h1">Admin Workflows</h1>
          <p className="text-body text-neutral-600" style={{ marginTop: 'var(--spacing-sm)' }}>
            Manage workflows and workflow requests
          </p>
        </div>

        {/* Tabs */}
        <div
          className="flex gap-md"
          style={{
            marginBottom: 'var(--spacing-lg)',
            borderBottom: '2px solid var(--neutral-200)',
          }}
        >
          <button
            onClick={() => handleTabChange('workflows')}
            style={{
              padding: 'var(--spacing-md) var(--spacing-lg)',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'workflows' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'workflows' ? 'var(--primary)' : 'var(--neutral-600)',
              fontWeight: activeTab === 'workflows' ? '600' : '500',
              cursor: 'pointer',
              marginBottom: '-2px',
              transition: 'all 200ms ease',
            }}
          >
            Workflows
          </button>
          <button
            onClick={() => handleTabChange('requests')}
            style={{
              padding: 'var(--spacing-md) var(--spacing-lg)',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'requests' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'requests' ? 'var(--primary)' : 'var(--neutral-600)',
              fontWeight: activeTab === 'requests' ? '600' : '500',
              cursor: 'pointer',
              marginBottom: '-2px',
              transition: 'all 200ms ease',
            }}
          >
            Requests
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div
            className="card"
            style={{
              padding: 'var(--spacing-md)',
              marginBottom: 'var(--spacing-lg)',
              backgroundColor: 'var(--error-light)',
              borderColor: 'var(--error)',
            }}
          >
            <p className="text-error">{error}</p>
          </div>
        )}

        {/* Workflows Tab */}
        {activeTab === 'workflows' && (
          <>
            {/* Filters */}
            <div className="flex gap-md" style={{ marginBottom: 'var(--spacing-lg)', flexWrap: 'wrap' }}>
              <div className="flex-1" style={{ minWidth: '200px' }}>
                <input
                  type="text"
                  placeholder="Search workflows..."
                  value={workflowFilters.search}
                  onChange={(e) => handleWorkflowSearchChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: 'var(--font-size-body-sm)',
                    border: '1px solid var(--neutral-200)',
                    borderRadius: 'var(--radius-lg)',
                  }}
                />
              </div>
              <div style={{ minWidth: '200px' }}>
                <label htmlFor="workflow-status-filter" style={{ display: 'block', marginBottom: 'var(--spacing-xs)' }}>
                  Status
                </label>
                <select
                  id="workflow-status-filter"
                  value={workflowFilters.status}
                  onChange={(e) => handleWorkflowStatusChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: 'var(--font-size-body-sm)',
                    border: '1px solid var(--neutral-200)',
                    borderRadius: 'var(--radius-lg)',
                  }}
                >
                  <option value="">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="deployed">Deployed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            {/* Workflows Table */}
            <WorkflowTable
              workflows={workflows}
              onViewDetails={handleViewDetails}
              onArchive={handleArchiveWorkflow}
              loading={loading}
            />

            {/* Pagination */}
            {workflowsTotalPages > 1 && (
              <div className="flex justify-between items-center" style={{ marginTop: 'var(--spacing-lg)' }}>
                <p className="text-body-sm text-neutral-600">
                  Page {workflowsPage} of {workflowsTotalPages}
                </p>
                <div className="flex gap-sm">
                  <button
                    className="btn-sm btn-secondary"
                    onClick={handleWorkflowsPrevPage}
                    disabled={workflowsPage === 1 || loading}
                    aria-label="Previous page"
                  >
                    Previous
                  </button>
                  <button
                    className="btn-sm btn-secondary"
                    onClick={handleWorkflowsNextPage}
                    disabled={workflowsPage === workflowsTotalPages || loading}
                    aria-label="Next page"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <>
            {/* Filters */}
            <div className="flex gap-md" style={{ marginBottom: 'var(--spacing-lg)', flexWrap: 'wrap' }}>
              <div className="flex-1" style={{ minWidth: '200px' }}>
                <input
                  type="text"
                  placeholder="Search requests..."
                  value={requestFilters.search}
                  onChange={(e) => handleRequestSearchChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: 'var(--font-size-body-sm)',
                    border: '1px solid var(--neutral-200)',
                    borderRadius: 'var(--radius-lg)',
                  }}
                />
              </div>
              <div style={{ minWidth: '200px' }}>
                <label htmlFor="request-stage-filter" style={{ display: 'block', marginBottom: 'var(--spacing-xs)' }}>
                  Stage
                </label>
                <select
                  id="request-stage-filter"
                  value={requestFilters.status}
                  onChange={(e) => handleRequestStageChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: 'var(--font-size-body-sm)',
                    border: '1px solid var(--neutral-200)',
                    borderRadius: 'var(--radius-lg)',
                  }}
                >
                  <option value="">All Stages</option>
                  <option value="draft">Draft</option>
                  <option value="submitted">Submitted</option>
                  <option value="reviewing">Reviewing</option>
                  <option value="negotiation">Negotiation</option>
                  <option value="contract_signed">Contract Signed</option>
                  <option value="development">Development</option>
                  <option value="deployed">Deployed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            {/* Requests List */}
            <WorkflowRequestsList
              requests={requests}
              onUpdateStage={handleUpdateRequestStage}
              loading={loading}
            />

            {/* Pagination */}
            {requestsTotalPages > 1 && (
              <div className="flex justify-between items-center" style={{ marginTop: 'var(--spacing-lg)' }}>
                <p className="text-body-sm text-neutral-600">
                  Page {requestsPage} of {requestsTotalPages}
                </p>
                <div className="flex gap-sm">
                  <button
                    className="btn-sm btn-secondary"
                    onClick={handleRequestsPrevPage}
                    disabled={requestsPage === 1 || loading}
                    aria-label="Previous page"
                  >
                    Previous
                  </button>
                  <button
                    className="btn-sm btn-secondary"
                    onClick={handleRequestsNextPage}
                    disabled={requestsPage === requestsTotalPages || loading}
                    aria-label="Next page"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
