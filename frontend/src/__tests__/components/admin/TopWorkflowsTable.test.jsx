import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TopWorkflowsTable from '../../../components/admin/TopWorkflowsTable';

describe('TopWorkflowsTable', () => {
  const mockWorkflows = [
    {
      id: '1',
      name: 'Workflow A',
      executions: 100,
      successRate: 95.5,
      avgDuration: 120,
      revenue: 5000
    },
    {
      id: '2',
      name: 'Workflow B',
      executions: 80,
      successRate: 92.0,
      avgDuration: 90,
      revenue: 4000
    },
    {
      id: '3',
      name: 'Workflow C',
      executions: 60,
      successRate: 88.5,
      avgDuration: 150,
      revenue: 3000
    }
  ];

  it('should render table with title', () => {
    render(<TopWorkflowsTable workflows={mockWorkflows} />);

    expect(screen.getByText('Top Workflows')).toBeInTheDocument();
  });

  it('should render loading state', () => {
    render(<TopWorkflowsTable loading={true} />);

    expect(screen.getByText('Top Workflows')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render empty state when no workflows', () => {
    render(<TopWorkflowsTable workflows={[]} />);

    expect(screen.getByText('Top Workflows')).toBeInTheDocument();
    expect(screen.getByText(/No workflow data available/i)).toBeInTheDocument();
  });

  it('should render table headers', () => {
    render(<TopWorkflowsTable workflows={mockWorkflows} />);

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Executions')).toBeInTheDocument();
    expect(screen.getByText('Success Rate')).toBeInTheDocument();
    expect(screen.getByText('Avg Duration')).toBeInTheDocument();
    expect(screen.getByText('Revenue')).toBeInTheDocument();
  });

  it('should render workflow data', () => {
    render(<TopWorkflowsTable workflows={mockWorkflows} />);

    expect(screen.getByText('Workflow A')).toBeInTheDocument();
    expect(screen.getByText('Workflow B')).toBeInTheDocument();
    expect(screen.getByText('Workflow C')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('80')).toBeInTheDocument();
  });

  it('should display success rate with color coding', () => {
    const { container } = render(<TopWorkflowsTable workflows={mockWorkflows} />);

    const successRates = container.querySelectorAll('.text-success');
    expect(successRates.length).toBeGreaterThan(0);
  });

  it('should display warning color for low success rate', () => {
    const lowSuccessWorkflows = [
      {
        id: '1',
        name: 'Low Success',
        executions: 50,
        successRate: 75.0,
        avgDuration: 100,
        revenue: 2000
      }
    ];

    const { container } = render(<TopWorkflowsTable workflows={lowSuccessWorkflows} />);

    const warningRates = container.querySelectorAll('.text-warning');
    expect(warningRates.length).toBeGreaterThan(0);
  });

  it('should format revenue with commas', () => {
    render(<TopWorkflowsTable workflows={mockWorkflows} />);

    // toLocaleString may use different separators depending on locale (comma or space)
    expect(screen.getByText(/\$5[, ]000/)).toBeInTheDocument();
    expect(screen.getByText(/\$4[, ]000/)).toBeInTheDocument();
  });

  it('should display duration in seconds', () => {
    render(<TopWorkflowsTable workflows={mockWorkflows} />);

    expect(screen.getByText('120s')).toBeInTheDocument();
    expect(screen.getByText('90s')).toBeInTheDocument();
  });

  it('should handle workflow without duration', () => {
    const workflowsWithoutDuration = [
      {
        id: '1',
        name: 'No Duration',
        executions: 50,
        successRate: 95.0,
        revenue: 2000
      }
    ];

    render(<TopWorkflowsTable workflows={workflowsWithoutDuration} />);

    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('should handle undefined workflows', () => {
    render(<TopWorkflowsTable workflows={undefined} />);

    expect(screen.getByText(/No workflow data available/i)).toBeInTheDocument();
  });

  it('should apply card styling', () => {
    const { container } = render(<TopWorkflowsTable workflows={mockWorkflows} />);

    const card = container.querySelector('.card');
    expect(card).toBeInTheDocument();
  });

  it('should render table with overflow-x-auto', () => {
    const { container } = render(<TopWorkflowsTable workflows={mockWorkflows} />);

    const overflowDiv = container.querySelector('.overflow-x-auto');
    expect(overflowDiv).toBeInTheDocument();
  });

  it('should apply hover effect to rows', () => {
    const { container } = render(<TopWorkflowsTable workflows={mockWorkflows} />);

    const rows = container.querySelectorAll('tbody tr');
    expect(rows[0]).toHaveClass('hover:bg-neutral-50');
  });
});
