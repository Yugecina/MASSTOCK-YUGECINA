import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TopClientsTable from '../../../components/admin/TopClientsTable';

describe('TopClientsTable', () => {
  const mockClients = [
    {
      id: '1',
      name: 'Client A',
      executions: 150,
      successRate: 96.0,
      revenue: 8000
    },
    {
      id: '2',
      name: 'Client B',
      executions: 120,
      successRate: 93.5,
      revenue: 6000
    },
    {
      id: '3',
      name: 'Client C',
      executions: 90,
      successRate: 89.0,
      revenue: 4500
    }
  ];

  it('should render table with title', () => {
    render(<TopClientsTable clients={mockClients} />);

    expect(screen.getByText('Top Clients')).toBeInTheDocument();
  });

  it('should render loading state', () => {
    render(<TopClientsTable loading={true} />);

    expect(screen.getByText('Top Clients')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render empty state when no clients', () => {
    render(<TopClientsTable clients={[]} />);

    expect(screen.getByText('Top Clients')).toBeInTheDocument();
    expect(screen.getByText(/No client data available/i)).toBeInTheDocument();
  });

  it('should render table headers', () => {
    render(<TopClientsTable clients={mockClients} />);

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Executions')).toBeInTheDocument();
    expect(screen.getByText('Success Rate')).toBeInTheDocument();
    expect(screen.getByText('Revenue')).toBeInTheDocument();
  });

  it('should render client data', () => {
    render(<TopClientsTable clients={mockClients} />);

    expect(screen.getByText('Client A')).toBeInTheDocument();
    expect(screen.getByText('Client B')).toBeInTheDocument();
    expect(screen.getByText('Client C')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
  });

  it('should display success rate with color coding', () => {
    const { container } = render(<TopClientsTable clients={mockClients} />);

    const successRates = container.querySelectorAll('.text-success');
    expect(successRates.length).toBeGreaterThan(0);
  });

  it('should display warning color for low success rate', () => {
    const lowSuccessClients = [
      {
        id: '1',
        name: 'Low Success Client',
        executions: 50,
        successRate: 75.0,
        revenue: 2000
      }
    ];

    const { container } = render(<TopClientsTable clients={lowSuccessClients} />);

    const warningRates = container.querySelectorAll('.text-warning');
    expect(warningRates.length).toBeGreaterThan(0);
  });

  it('should format revenue with commas', () => {
    render(<TopClientsTable clients={mockClients} />);

    // toLocaleString may use different separators depending on locale (comma or space)
    expect(screen.getByText(/\$8[, ]000/)).toBeInTheDocument();
    expect(screen.getByText(/\$6[, ]000/)).toBeInTheDocument();
  });

  it('should handle client without executions', () => {
    const clientsWithoutExecutions = [
      {
        id: '1',
        name: 'No Executions',
        successRate: 0,
        revenue: 0
      }
    ];

    render(<TopClientsTable clients={clientsWithoutExecutions} />);

    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('should handle client without revenue', () => {
    const clientsWithoutRevenue = [
      {
        id: '1',
        name: 'No Revenue',
        executions: 50,
        successRate: 95.0
      }
    ];

    render(<TopClientsTable clients={clientsWithoutRevenue} />);

    expect(screen.getByText('$0')).toBeInTheDocument();
  });

  it('should handle undefined clients', () => {
    render(<TopClientsTable clients={undefined} />);

    expect(screen.getByText(/No client data available/i)).toBeInTheDocument();
  });

  it('should apply card styling', () => {
    const { container } = render(<TopClientsTable clients={mockClients} />);

    const card = container.querySelector('.card');
    expect(card).toBeInTheDocument();
  });

  it('should render table with overflow-x-auto', () => {
    const { container } = render(<TopClientsTable clients={mockClients} />);

    const overflowDiv = container.querySelector('.overflow-x-auto');
    expect(overflowDiv).toBeInTheDocument();
  });

  it('should apply hover effect to rows', () => {
    const { container } = render(<TopClientsTable clients={mockClients} />);

    const rows = container.querySelectorAll('tbody tr');
    expect(rows[0]).toHaveClass('hover:bg-neutral-50');
  });

  it('should handle missing success rate', () => {
    const clientsWithoutSuccessRate = [
      {
        id: '1',
        name: 'No Success Rate',
        executions: 50,
        revenue: 2000
      }
    ];

    render(<TopClientsTable clients={clientsWithoutSuccessRate} />);

    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});
