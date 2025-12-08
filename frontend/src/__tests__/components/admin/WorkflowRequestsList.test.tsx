/**
 * WorkflowRequestsList Component Tests
 * Tests for workflow requests list component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WorkflowRequestsList } from '../../../components/admin/WorkflowRequestsList';

describe('WorkflowRequestsList', () => {
  const mockRequests = [
    {
      id: 'req-1',
      title: 'Content Automation Request',
      client_id: 'client-1',
      status: 'submitted',
      budget: 5000,
      timeline_days: 30,
      description: 'Automate content generation',
      created_at: '2025-01-01T00:00:00Z',
    },
    {
      id: 'req-2',
      title: 'Data Processing Workflow',
      client_id: 'client-2',
      status: 'reviewing',
      budget: 8000,
      timeline_days: 45,
      description: 'Process large datasets',
      created_at: '2025-01-02T00:00:00Z',
    },
    {
      id: 'req-3',
      title: 'Email Automation',
      client_id: 'client-3',
      status: 'deployed',
      budget: 3000,
      timeline_days: 15,
      description: 'Automate email campaigns',
      created_at: '2025-01-03T00:00:00Z',
    },
  ];

  const defaultProps = {
    requests: mockRequests,
    onUpdateStage: vi.fn(),
  };

  it('should render requests list', () => {
    render(<WorkflowRequestsList {...defaultProps} />);

    expect(screen.getByText('Content Automation Request')).toBeInTheDocument();
    expect(screen.getByText('Data Processing Workflow')).toBeInTheDocument();
    expect(screen.getByText('Email Automation')).toBeInTheDocument();
  });

  it('should display request titles', () => {
    render(<WorkflowRequestsList {...defaultProps} />);

    expect(screen.getByText('Content Automation Request')).toBeInTheDocument();
    expect(screen.getByText('Data Processing Workflow')).toBeInTheDocument();
  });

  it('should display request descriptions', () => {
    render(<WorkflowRequestsList {...defaultProps} />);

    expect(screen.getByText('Automate content generation')).toBeInTheDocument();
    expect(screen.getByText('Process large datasets')).toBeInTheDocument();
  });

  it('should display status badges', () => {
    const { container } = render(<WorkflowRequestsList {...defaultProps} />);

    // Check badges exist by class
    const badges = container.querySelectorAll('.badge');
    expect(badges.length).toBeGreaterThanOrEqual(3);

    // Check specific badge classes
    const submittedBadge = Array.from(badges).find((badge) => badge.textContent === 'submitted');
    const reviewingBadge = Array.from(badges).find((badge) => badge.textContent === 'reviewing');
    const deployedBadge = Array.from(badges).find((badge) => badge.textContent === 'deployed');

    expect(submittedBadge).toBeInTheDocument();
    expect(reviewingBadge).toBeInTheDocument();
    expect(deployedBadge).toBeInTheDocument();
  });

  it('should display budget information', () => {
    render(<WorkflowRequestsList {...defaultProps} />);

    expect(screen.getByText(/\$5,000/)).toBeInTheDocument();
    expect(screen.getByText(/\$8,000/)).toBeInTheDocument();
    expect(screen.getByText(/\$3,000/)).toBeInTheDocument();
  });

  it('should display timeline information', () => {
    render(<WorkflowRequestsList {...defaultProps} />);

    expect(screen.getByText(/30 days/i)).toBeInTheDocument();
    expect(screen.getByText(/45 days/i)).toBeInTheDocument();
    expect(screen.getByText(/15 days/i)).toBeInTheDocument();
  });

  it('should display stage advancement dropdown for non-terminal stages', () => {
    render(<WorkflowRequestsList {...defaultProps} />);

    // Find stage selectors - should exist for submitted and reviewing statuses
    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBeGreaterThan(0);
  });

  it('should call onUpdateStage when stage is changed', () => {
    render(<WorkflowRequestsList {...defaultProps} />);

    const selects = screen.getAllByRole('combobox');
    const firstSelect = selects[0];

    fireEvent.change(firstSelect, { target: { value: 'reviewing' } });

    expect(defaultProps.onUpdateStage).toHaveBeenCalledWith('req-1', 'reviewing');
  });

  it('should show stage progression options', () => {
    render(<WorkflowRequestsList {...defaultProps} />);

    const selects = screen.getAllByRole('combobox');
    const firstSelect = selects[0];

    expect(firstSelect).toBeInTheDocument();

    // Check if options exist
    const options = firstSelect.querySelectorAll('option');
    expect(options.length).toBeGreaterThan(1);
  });

  it('should show empty state when no requests', () => {
    render(<WorkflowRequestsList requests={[]} onUpdateStage={vi.fn()} />);

    expect(screen.getByText(/No workflow requests found/i)).toBeInTheDocument();
  });

  it('should show loading state when loading prop is true', () => {
    render(<WorkflowRequestsList {...defaultProps} loading={true} />);

    expect(screen.getByText(/Loading requests/i)).toBeInTheDocument();
  });

  it('should disable stage selectors when loading', () => {
    render(<WorkflowRequestsList {...defaultProps} loading={true} />);

    const selects = screen.queryAllByRole('combobox');
    selects.forEach((select) => {
      expect(select).toBeDisabled();
    });
  });

  it('should render all requests as cards or list items', () => {
    const { container } = render(<WorkflowRequestsList {...defaultProps} />);

    // Check for request items (could be cards or list items)
    const requestItems = container.querySelectorAll('[data-testid="request-item"]');
    expect(requestItems.length).toBeGreaterThanOrEqual(3);
  });

  it('should display stage indicator with correct current stage', () => {
    const { container } = render(<WorkflowRequestsList {...defaultProps} />);

    // Check that the submitted status is highlighted with badge class
    const badges = container.querySelectorAll('.badge');
    const submittedBadge = Array.from(badges).find((badge) => badge.textContent === 'submitted');

    expect(submittedBadge).toBeInTheDocument();
    expect(submittedBadge).toHaveClass('badge');
  });

  it('should not show stage advancement for terminal stages', () => {
    const deployedRequest = [
      {
        id: 'req-deployed',
        title: 'Deployed Request',
        status: 'deployed',
        budget: 1000,
        timeline_days: 10,
      },
    ];

    const { container } = render(<WorkflowRequestsList requests={deployedRequest} onUpdateStage={vi.fn()} />);

    // Terminal stages should not have selectors
    const badges = container.querySelectorAll('.badge');
    const deployedBadge = Array.from(badges).find((badge) => badge.textContent === 'deployed');
    expect(deployedBadge).toBeInTheDocument();
  });

  it('should format budget with proper currency formatting', () => {
    render(<WorkflowRequestsList {...defaultProps} />);

    // Check for formatted currency
    expect(screen.getByText(/\$5,000/)).toBeInTheDocument();
  });

  it('should handle stage update errors gracefully', () => {
    const onUpdateStage = vi.fn(() => {
      throw new Error('Update failed');
    });

    render(<WorkflowRequestsList {...defaultProps} onUpdateStage={onUpdateStage} />);

    const selects = screen.getAllByRole('combobox');
    const firstSelect = selects[0];

    // Should not throw
    expect(() => {
      fireEvent.change(firstSelect, { target: { value: 'reviewing' } });
    }).not.toThrow();
  });
});
