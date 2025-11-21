import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import RecentFailuresTable from '../../../components/admin/RecentFailuresTable';

// Mock date-fns
vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn((date, options) => {
    return '5 minutes ago';
  })
}));

describe('RecentFailuresTable', () => {
  const mockFailures = [
    {
      id: '1',
      workflow_name: 'Workflow A',
      client_name: 'Client A',
      error_message: 'Timeout error',
      created_at: '2025-01-15T10:00:00Z'
    },
    {
      id: '2',
      workflow_name: 'Workflow B',
      client_name: 'Client B',
      error_message: 'Connection refused',
      created_at: '2025-01-15T10:05:00Z'
    },
    {
      id: '3',
      workflow_name: 'Workflow C',
      client_name: 'Client C',
      error_message: 'Invalid credentials',
      created_at: '2025-01-15T10:10:00Z'
    }
  ];

  it('should render table with title', () => {
    render(<RecentFailuresTable failures={mockFailures} />);

    expect(screen.getByText('Recent Failures')).toBeInTheDocument();
  });

  it('should render loading state', () => {
    render(<RecentFailuresTable loading={true} />);

    expect(screen.getByText('Recent Failures')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render empty state when no failures', () => {
    render(<RecentFailuresTable failures={[]} />);

    expect(screen.getByText('Recent Failures')).toBeInTheDocument();
    expect(screen.getByText(/No recent failures/i)).toBeInTheDocument();
  });

  it('should render table headers', () => {
    render(<RecentFailuresTable failures={mockFailures} />);

    expect(screen.getByText('Workflow')).toBeInTheDocument();
    expect(screen.getByText('Client')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Time')).toBeInTheDocument();
  });

  it('should render failure data', () => {
    render(<RecentFailuresTable failures={mockFailures} />);

    expect(screen.getByText('Workflow A')).toBeInTheDocument();
    expect(screen.getByText('Workflow B')).toBeInTheDocument();
    expect(screen.getByText('Workflow C')).toBeInTheDocument();
    expect(screen.getByText('Client A')).toBeInTheDocument();
    expect(screen.getByText('Client B')).toBeInTheDocument();
    expect(screen.getByText('Client C')).toBeInTheDocument();
  });

  it('should display error messages', () => {
    render(<RecentFailuresTable failures={mockFailures} />);

    expect(screen.getByText('Timeout error')).toBeInTheDocument();
    expect(screen.getByText('Connection refused')).toBeInTheDocument();
    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
  });

  it('should display error messages with error color', () => {
    const { container } = render(<RecentFailuresTable failures={mockFailures} />);

    const errorMessages = container.querySelectorAll('.text-error');
    expect(errorMessages.length).toBeGreaterThan(0);
  });

  it('should format time using date-fns', () => {
    render(<RecentFailuresTable failures={mockFailures} />);

    const timeElements = screen.getAllByText('5 minutes ago');
    expect(timeElements.length).toBe(3);
  });

  it('should handle undefined failures', () => {
    render(<RecentFailuresTable failures={undefined} />);

    expect(screen.getByText(/No recent failures/i)).toBeInTheDocument();
  });

  it('should apply card styling', () => {
    const { container } = render(<RecentFailuresTable failures={mockFailures} />);

    const card = container.querySelector('.card');
    expect(card).toBeInTheDocument();
  });

  it('should render table with overflow-x-auto', () => {
    const { container } = render(<RecentFailuresTable failures={mockFailures} />);

    const overflowDiv = container.querySelector('.overflow-x-auto');
    expect(overflowDiv).toBeInTheDocument();
  });

  it('should apply hover effect to rows', () => {
    const { container } = render(<RecentFailuresTable failures={mockFailures} />);

    const rows = container.querySelectorAll('tbody tr');
    expect(rows[0]).toHaveClass('hover:bg-neutral-50');
  });

  it('should truncate long error messages', () => {
    const longErrorFailures = [
      {
        id: '1',
        workflow_name: 'Workflow A',
        client_name: 'Client A',
        error_message: 'This is a very long error message that should be truncated to prevent the table from becoming too wide and breaking the layout',
        created_at: '2025-01-15T10:00:00Z'
      }
    ];

    const { container } = render(<RecentFailuresTable failures={longErrorFailures} />);

    const errorSpan = container.querySelector('.truncate');
    expect(errorSpan).toBeInTheDocument();
  });

  it('should handle failures without id', () => {
    const failuresWithoutId = [
      {
        workflow_name: 'Workflow A',
        client_name: 'Client A',
        error_message: 'Test error',
        created_at: '2025-01-15T10:00:00Z'
      }
    ];

    render(<RecentFailuresTable failures={failuresWithoutId} />);

    expect(screen.getByText('Workflow A')).toBeInTheDocument();
  });
});
