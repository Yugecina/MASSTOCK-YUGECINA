/**
 * WorkflowTable Component Tests
 * Tests for workflows table component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WorkflowTable } from '../../../components/admin/WorkflowTable';

describe('WorkflowTable', () => {
  const mockWorkflows = [
    {
      id: 'wf-1',
      name: 'Content Generation Workflow',
      client_id: 'client-1',
      status: 'deployed',
      stats: {
        total_executions: 100,
        success_rate: '95.00',
        revenue: '5000.00',
      },
    },
    {
      id: 'wf-2',
      name: 'Data Processing Workflow',
      client_id: 'client-2',
      status: 'draft',
      stats: {
        total_executions: 0,
        success_rate: '0',
        revenue: '0.00',
      },
    },
    {
      id: 'wf-3',
      name: 'Archived Workflow',
      client_id: 'client-3',
      status: 'archived',
      stats: {
        total_executions: 50,
        success_rate: '80.00',
        revenue: '2000.00',
      },
    },
  ];

  const defaultProps = {
    workflows: mockWorkflows,
    onViewDetails: vi.fn(),
    onArchive: vi.fn(),
  };

  it('should render workflow table with correct headers', () => {
    render(<WorkflowTable {...defaultProps} />);

    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Client')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Executions')).toBeInTheDocument();
    expect(screen.getByText('Success Rate')).toBeInTheDocument();
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('should render workflow list correctly', () => {
    render(<WorkflowTable {...defaultProps} />);

    expect(screen.getByText('Content Generation Workflow')).toBeInTheDocument();
    expect(screen.getByText('Data Processing Workflow')).toBeInTheDocument();
    expect(screen.getByText('Archived Workflow')).toBeInTheDocument();
  });

  it('should display workflow IDs (truncated)', () => {
    render(<WorkflowTable {...defaultProps} />);

    // IDs should be displayed (possibly truncated)
    expect(screen.getByText(/wf-1/)).toBeInTheDocument();
    expect(screen.getByText(/wf-2/)).toBeInTheDocument();
    expect(screen.getByText(/wf-3/)).toBeInTheDocument();
  });

  it('should display status badge for deployed workflows', () => {
    render(<WorkflowTable {...defaultProps} />);

    const deployedBadge = screen.getByText('deployed');
    expect(deployedBadge).toBeInTheDocument();
    expect(deployedBadge).toHaveClass('badge-success');
  });

  it('should display status badge for draft workflows', () => {
    render(<WorkflowTable {...defaultProps} />);

    const draftBadge = screen.getByText('draft');
    expect(draftBadge).toBeInTheDocument();
    expect(draftBadge).toHaveClass('badge-warning');
  });

  it('should display status badge for archived workflows', () => {
    render(<WorkflowTable {...defaultProps} />);

    const archivedBadge = screen.getByText('archived');
    expect(archivedBadge).toBeInTheDocument();
    expect(archivedBadge).toHaveClass('badge-neutral');
  });

  it('should display execution stats', () => {
    render(<WorkflowTable {...defaultProps} />);

    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('95.00%')).toBeInTheDocument();
    expect(screen.getByText('$5,000.00')).toBeInTheDocument();
  });

  it('should display zero stats for workflows with no executions', () => {
    render(<WorkflowTable {...defaultProps} />);

    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('should call onViewDetails when View button clicked', () => {
    render(<WorkflowTable {...defaultProps} />);

    const viewButtons = screen.getAllByText('View');
    fireEvent.click(viewButtons[0]);

    expect(defaultProps.onViewDetails).toHaveBeenCalledWith('wf-1');
  });

  it('should call onArchive when Archive button clicked', () => {
    render(<WorkflowTable {...defaultProps} />);

    const archiveButtons = screen.getAllByText('Archive');
    fireEvent.click(archiveButtons[0]);

    expect(defaultProps.onArchive).toHaveBeenCalledWith('wf-1');
  });

  it('should not show Archive button for already archived workflows', () => {
    render(<WorkflowTable {...defaultProps} />);

    const archiveButtons = screen.getAllByText('Archive');

    // Should have 2 archive buttons (for deployed and draft), not 3
    expect(archiveButtons).toHaveLength(2);
  });

  it('should show empty state when no workflows', () => {
    render(<WorkflowTable workflows={[]} onViewDetails={vi.fn()} onArchive={vi.fn()} />);

    expect(screen.getByText(/No workflows found/i)).toBeInTheDocument();
  });

  it('should show loading state when loading prop is true', () => {
    render(<WorkflowTable {...defaultProps} loading={true} />);

    expect(screen.getByText(/Loading workflows/i)).toBeInTheDocument();
  });

  it('should disable action buttons when loading', () => {
    render(<WorkflowTable {...defaultProps} loading={true} />);

    const buttons = screen.queryAllByRole('button');
    buttons.forEach((button) => {
      expect(button).toBeDisabled();
    });
  });

  it('should render all workflows in the table body', () => {
    const { container } = render(<WorkflowTable {...defaultProps} />);

    const rows = container.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(3);
  });

  it('should format revenue with currency symbol', () => {
    render(<WorkflowTable {...defaultProps} />);

    expect(screen.getByText('$5,000.00')).toBeInTheDocument();
    expect(screen.getByText('$2,000.00')).toBeInTheDocument();
    expect(screen.getByText('$0.00')).toBeInTheDocument();
  });
});
