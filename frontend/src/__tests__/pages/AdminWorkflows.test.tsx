/**
 * AdminWorkflows Page Tests
 * Tests for admin workflows management page
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminWorkflows } from '../../pages/AdminWorkflows';
import { adminResourceService } from '../../services/adminResourceService';

vi.mock('../../services/adminResourceService');

describe('AdminWorkflows', () => {
  const mockWorkflows = {
    success: true,
    data: {
      workflows: [
        {
          id: 'wf-1',
          name: 'Test Workflow',
          status: 'deployed',
          client_id: 'client-1',
          stats: {
            total_executions: 100,
            success_rate: '95.00',
            revenue: '5000.00',
          },
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    },
  };

  const mockRequests = {
    success: true,
    data: {
      requests: [
        {
          id: 'req-1',
          title: 'New Request',
          status: 'submitted',
          budget: 5000,
          timeline_days: 30,
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    adminResourceService.getWorkflows.mockResolvedValue(mockWorkflows);
    adminResourceService.getWorkflowRequests.mockResolvedValue(mockRequests);
    adminResourceService.deleteWorkflow.mockResolvedValue({ success: true });
    adminResourceService.updateWorkflowRequestStage.mockResolvedValue({ success: true });
  });

  it('should render page with two tabs', async () => {
    render(<AdminWorkflows />);

    await waitFor(() => {
      expect(screen.getByText('Workflows')).toBeInTheDocument();
      expect(screen.getByText('Requests')).toBeInTheDocument();
    });
  });

  it('should render Workflows tab as default active tab', async () => {
    render(<AdminWorkflows />);

    await waitFor(() => {
      expect(screen.getByText('Test Workflow')).toBeInTheDocument();
    });
  });

  it('should load workflows on mount', async () => {
    render(<AdminWorkflows />);

    await waitFor(() => {
      expect(adminResourceService.getWorkflows).toHaveBeenCalledWith(1, {});
    });
  });

  it('should switch to Requests tab when clicked', async () => {
    render(<AdminWorkflows />);

    const requestsTab = screen.getByText('Requests');
    fireEvent.click(requestsTab);

    await waitFor(() => {
      expect(adminResourceService.getWorkflowRequests).toHaveBeenCalled();
      expect(screen.getByText('New Request')).toBeInTheDocument();
    });
  });

  it('should display search input for workflows', async () => {
    render(<AdminWorkflows />);

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/search workflows/i);
      expect(searchInput).toBeInTheDocument();
    });
  });

  it('should display status filter dropdown for workflows', async () => {
    render(<AdminWorkflows />);

    await waitFor(() => {
      const statusFilter = screen.getByLabelText(/status/i);
      expect(statusFilter).toBeInTheDocument();
    });
  });

  it('should filter workflows by status', async () => {
    render(<AdminWorkflows />);

    await waitFor(() => {
      const statusFilter = screen.getByLabelText(/status/i);
      fireEvent.change(statusFilter, { target: { value: 'deployed' } });
    });

    await waitFor(() => {
      expect(adminResourceService.getWorkflows).toHaveBeenCalledWith(1, {
        status: 'deployed',
      });
    });
  });

  it('should filter requests by stage', async () => {
    render(<AdminWorkflows />);

    // Switch to Requests tab
    const requestsTab = screen.getByText('Requests');
    fireEvent.click(requestsTab);

    await waitFor(() => {
      const stageFilter = screen.getByLabelText(/stage/i);
      fireEvent.change(stageFilter, { target: { value: 'submitted' } });
    });

    await waitFor(() => {
      expect(adminResourceService.getWorkflowRequests).toHaveBeenCalledWith(1, {
        status: 'submitted',
      });
    });
  });

  it('should display pagination controls', async () => {
    const multiPageWorkflows = {
      ...mockWorkflows,
      data: { ...mockWorkflows.data, total: 20, totalPages: 2 },
    };
    adminResourceService.getWorkflows.mockResolvedValue(multiPageWorkflows);

    render(<AdminWorkflows />);

    await waitFor(() => {
      expect(screen.getByText(/page 1 of 2/i)).toBeInTheDocument();
    });
  });

  it('should navigate to next page', async () => {
    const multiPageWorkflows = {
      ...mockWorkflows,
      data: { ...mockWorkflows.data, total: 20, totalPages: 2 },
    };
    adminResourceService.getWorkflows.mockResolvedValue(multiPageWorkflows);

    render(<AdminWorkflows />);

    await waitFor(() => {
      const nextButton = screen.getByLabelText(/next page/i);
      fireEvent.click(nextButton);
    });

    await waitFor(() => {
      expect(adminResourceService.getWorkflows).toHaveBeenCalledWith(2, {});
    });
  });

  it('should navigate to previous page', async () => {
    const multiPageWorkflows = {
      ...mockWorkflows,
      data: { ...mockWorkflows.data, total: 20, totalPages: 2, page: 2 },
    };
    adminResourceService.getWorkflows.mockResolvedValue(multiPageWorkflows);

    render(<AdminWorkflows />);

    await waitFor(() => {
      const prevButton = screen.getByLabelText(/previous page/i);
      expect(prevButton).not.toBeDisabled();
    });
  });

  it('should handle workflow archive action', async () => {
    render(<AdminWorkflows />);

    await waitFor(() => {
      const archiveButton = screen.getByText('Archive');
      fireEvent.click(archiveButton);
    });

    await waitFor(() => {
      expect(adminResourceService.deleteWorkflow).toHaveBeenCalledWith('wf-1');
    });
  });

  it('should reload workflows after archiving', async () => {
    render(<AdminWorkflows />);

    const initialCallCount = adminResourceService.getWorkflows.mock.calls.length;

    await waitFor(() => {
      const archiveButton = screen.getByText('Archive');
      fireEvent.click(archiveButton);
    });

    await waitFor(() => {
      expect(adminResourceService.getWorkflows.mock.calls.length).toBeGreaterThan(
        initialCallCount
      );
    });
  });

  it('should show loading state while fetching workflows', () => {
    render(<AdminWorkflows />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should show error message on fetch failure', async () => {
    adminResourceService.getWorkflows.mockRejectedValue(new Error('Network error'));

    render(<AdminWorkflows />);

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });

  it('should handle empty workflows list', async () => {
    adminResourceService.getWorkflows.mockResolvedValue({
      success: true,
      data: { workflows: [], total: 0, page: 1, limit: 10, totalPages: 0 },
    });

    render(<AdminWorkflows />);

    await waitFor(() => {
      expect(screen.getByText(/no workflows found/i)).toBeInTheDocument();
    });
  });

  it('should handle empty requests list', async () => {
    adminResourceService.getWorkflowRequests.mockResolvedValue({
      success: true,
      data: { requests: [], total: 0, page: 1, limit: 10, totalPages: 0 },
    });

    render(<AdminWorkflows />);

    const requestsTab = screen.getByText('Requests');
    fireEvent.click(requestsTab);

    await waitFor(() => {
      expect(screen.getByText(/no workflow requests found/i)).toBeInTheDocument();
    });
  });

  it('should combine multiple filters', async () => {
    render(<AdminWorkflows />);

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/search workflows/i);
      fireEvent.change(searchInput, { target: { value: 'test' } });
    });

    await waitFor(() => {
      const statusFilter = screen.getByLabelText(/status/i);
      fireEvent.change(statusFilter, { target: { value: 'deployed' } });
    });

    // Give time for debounce
    await new Promise((resolve) => setTimeout(resolve, 400));

    await waitFor(() => {
      expect(adminResourceService.getWorkflows).toHaveBeenCalledWith(1, {
        search: 'test',
        status: 'deployed',
      });
    });
  });
});
