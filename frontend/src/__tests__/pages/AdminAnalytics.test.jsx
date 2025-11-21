import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminAnalytics from '../../../src/pages/AdminAnalytics.jsx';
import { analyticsService } from '../../../services/analyticsService';

vi.mock('../../../services/analyticsService');

const renderWithRouter = (component) => {
  return render(<MemoryRouter>{component}</MemoryRouter>);
};

describe('AdminAnalytics', () => {
  const mockOverview = {
    totalUsers: 45,
    activeUsers: 32,
    totalExecutions: 1234,
    successRate: 94.5,
    failureRate: 5.5,
    revenueThisMonth: 15000,
    revenueLastMonth: 13500,
    successTrend: 11.6,
    executionsTrend: 8.2
  };

  const mockTrendData = [
    { date: '2025-01-10', count: 45 },
    { date: '2025-01-11', count: 52 },
    { date: '2025-01-12', count: 48 }
  ];

  const mockWorkflowPerformance = [
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
    }
  ];

  const mockFailures = [
    {
      id: '1',
      workflow_name: 'Workflow A',
      client_name: 'Client A',
      error_message: 'Timeout error',
      created_at: '2025-01-15T10:00:00Z'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    analyticsService.getOverview.mockResolvedValue(mockOverview);
    analyticsService.getExecutionsTrend.mockResolvedValue(mockTrendData);
    analyticsService.getWorkflowPerformance.mockResolvedValue(mockWorkflowPerformance);
    analyticsService.getFailures.mockResolvedValue(mockFailures);
  });

  it('should render analytics page header', async () => {
    renderWithRouter(<AdminAnalytics />);

    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });

  it('should render period selector', async () => {
    renderWithRouter(<AdminAnalytics />);

    const selector = screen.getByRole('combobox');
    expect(selector).toBeInTheDocument();
  });

  it('should load and display KPI metrics', async () => {
    renderWithRouter(<AdminAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('45')).toBeInTheDocument();
    });

    expect(screen.getByText('Active Users')).toBeInTheDocument();
    expect(screen.getByText('32')).toBeInTheDocument();

    expect(screen.getByText('Total Executions')).toBeInTheDocument();
    expect(screen.getByText('1234')).toBeInTheDocument();

    expect(screen.getByText('Success Rate')).toBeInTheDocument();
    expect(screen.getByText('94.5%')).toBeInTheDocument();

    expect(screen.getByText('Failure Rate')).toBeInTheDocument();
    expect(screen.getByText('5.5%')).toBeInTheDocument();

    expect(screen.getByText('Revenue This Month')).toBeInTheDocument();
    // Use regex to handle different locale separators (comma or space)
    expect(screen.getByText(/\$15[, ]000/)).toBeInTheDocument();
  });

  it('should display trends with arrows', async () => {
    renderWithRouter(<AdminAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('+11.6%')).toBeInTheDocument();
    });
  });

  it('should show loading state initially', () => {
    renderWithRouter(<AdminAnalytics />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should handle error state', async () => {
    analyticsService.getOverview.mockRejectedValue(new Error('Failed to load'));

    renderWithRouter(<AdminAnalytics />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load analytics/i)).toBeInTheDocument();
    });
  });

  it('should change period when selector changes', async () => {
    renderWithRouter(<AdminAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('Total Users')).toBeInTheDocument();
    });

    const selector = screen.getByRole('combobox');
    fireEvent.change(selector, { target: { value: '90d' } });

    await waitFor(() => {
      expect(analyticsService.getExecutionsTrend).toHaveBeenCalledWith('90d');
      expect(analyticsService.getWorkflowPerformance).toHaveBeenCalledWith('90d');
      expect(analyticsService.getFailures).toHaveBeenCalledWith('90d', 100);
    });
  });

  it('should render executions trend chart', async () => {
    renderWithRouter(<AdminAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('Executions Trend')).toBeInTheDocument();
    });
  });

  it('should render workflow performance table', async () => {
    renderWithRouter(<AdminAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('Top Workflows')).toBeInTheDocument();
      expect(screen.getByText('Workflow A')).toBeInTheDocument();
      expect(screen.getByText('Workflow B')).toBeInTheDocument();
    });
  });

  it('should render failures table', async () => {
    renderWithRouter(<AdminAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('Recent Failures')).toBeInTheDocument();
      expect(screen.getByText('Client A')).toBeInTheDocument();
      expect(screen.getByText('Timeout error')).toBeInTheDocument();
    });
  });

  it('should fetch data on mount', async () => {
    renderWithRouter(<AdminAnalytics />);

    await waitFor(() => {
      expect(analyticsService.getOverview).toHaveBeenCalledTimes(1);
      expect(analyticsService.getExecutionsTrend).toHaveBeenCalledTimes(1);
      expect(analyticsService.getWorkflowPerformance).toHaveBeenCalledTimes(1);
      expect(analyticsService.getFailures).toHaveBeenCalledTimes(1);
    });
  });

  it('should display empty state when no failures', async () => {
    analyticsService.getFailures.mockResolvedValue([]);

    renderWithRouter(<AdminAnalytics />);

    await waitFor(() => {
      expect(screen.getByText(/No recent failures/i)).toBeInTheDocument();
    });
  });

  it('should display empty state when no workflows', async () => {
    analyticsService.getWorkflowPerformance.mockResolvedValue([]);

    renderWithRouter(<AdminAnalytics />);

    await waitFor(() => {
      expect(screen.getByText(/No workflow data/i)).toBeInTheDocument();
    });
  });

  it('should format large revenue numbers', async () => {
    const largeOverview = {
      ...mockOverview,
      revenueThisMonth: 1500000
    };
    analyticsService.getOverview.mockResolvedValue(largeOverview);

    renderWithRouter(<AdminAnalytics />);

    await waitFor(() => {
      // Use regex to handle different locale separators (comma or space)
      expect(screen.getByText(/\$1[, ]500[, ]000/)).toBeInTheDocument();
    });
  });

  it('should render chart tabs', async () => {
    renderWithRouter(<AdminAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('Executions')).toBeInTheDocument();
      expect(screen.getByText('Success/Failure')).toBeInTheDocument();
      expect(screen.getByText('Revenue')).toBeInTheDocument();
    });
  });

  it('should switch between chart views', async () => {
    renderWithRouter(<AdminAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('Executions')).toBeInTheDocument();
    });

    const successTab = screen.getByText('Success/Failure');
    fireEvent.click(successTab);

    expect(screen.getByText('Success vs Failure')).toBeInTheDocument();
  });

  it('should call API with correct default period', async () => {
    renderWithRouter(<AdminAnalytics />);

    await waitFor(() => {
      expect(analyticsService.getExecutionsTrend).toHaveBeenCalledWith('30d');
      expect(analyticsService.getWorkflowPerformance).toHaveBeenCalledWith('30d');
      expect(analyticsService.getFailures).toHaveBeenCalledWith('30d', 100);
    });
  });

  it('should display 6 KPI cards', async () => {
    renderWithRouter(<AdminAnalytics />);

    await waitFor(() => {
      const cards = screen.getAllByRole('article');
      expect(cards.length).toBeGreaterThanOrEqual(6);
    });
  });

  it('should handle network error gracefully', async () => {
    analyticsService.getOverview.mockRejectedValue(new Error('Network error'));

    renderWithRouter(<AdminAnalytics />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load analytics/i)).toBeInTheDocument();
    });

    expect(screen.queryByText('Total Users')).not.toBeInTheDocument();
  });
});
