import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AnalyticsCard from '../../../components/admin/AnalyticsCard';

describe('AnalyticsCard', () => {
  it('should render metric card with title and value', () => {
    render(
      <AnalyticsCard
        title="Total Users"
        value={45}
        trend="up"
        trendValue={11.6}
        period="vs last month"
      />
    );

    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
  });

  it('should display trend arrow up with percentage', () => {
    render(
      <AnalyticsCard
        title="Revenue"
        value={15000}
        trend="up"
        trendValue={11.6}
      />
    );

    expect(screen.getByText('+11.6%')).toBeInTheDocument();
    expect(screen.getByText('↑')).toBeInTheDocument();
  });

  it('should display trend arrow down with percentage', () => {
    render(
      <AnalyticsCard
        title="Failures"
        value={23}
        trend="down"
        trendValue={5.2}
      />
    );

    expect(screen.getByText('-5.2%')).toBeInTheDocument();
    expect(screen.getByText('↓')).toBeInTheDocument();
  });

  it('should display no change when trend is neutral', () => {
    render(
      <AnalyticsCard
        title="Active Users"
        value={32}
        trend="neutral"
        trendValue={0}
      />
    );

    expect(screen.getByText('0.0%')).toBeInTheDocument();
    expect(screen.getByText('→')).toBeInTheDocument();
  });

  it('should show period label if provided', () => {
    render(
      <AnalyticsCard
        title="Executions"
        value={1234}
        trend="up"
        trendValue={8.2}
        period="vs last month"
      />
    );

    expect(screen.getByText('vs last month')).toBeInTheDocument();
  });

  it('should render loading state', () => {
    render(
      <AnalyticsCard
        title="Total Users"
        loading={true}
      />
    );

    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('--')).toBeInTheDocument();
  });

  it('should handle large numbers', () => {
    render(
      <AnalyticsCard
        title="Revenue"
        value={1500000}
        trend="up"
        trendValue={25.5}
      />
    );

    expect(screen.getByText('1500000')).toBeInTheDocument();
  });

  it('should handle decimal values', () => {
    render(
      <AnalyticsCard
        title="Success Rate"
        value={94.5}
        trend="up"
        trendValue={2.3}
        suffix="%"
      />
    );

    expect(screen.getByText('94.5%')).toBeInTheDocument();
  });

  it('should apply success color for up trend', () => {
    const { container } = render(
      <AnalyticsCard
        title="Revenue"
        value={15000}
        trend="up"
        trendValue={11.6}
      />
    );

    const trendElement = container.querySelector('.text-success');
    expect(trendElement).toBeInTheDocument();
  });

  it('should apply error color for down trend', () => {
    const { container } = render(
      <AnalyticsCard
        title="Failures"
        value={23}
        trend="down"
        trendValue={5.2}
      />
    );

    const trendElement = container.querySelector('.text-error');
    expect(trendElement).toBeInTheDocument();
  });

  it('should apply neutral color for no change', () => {
    const { container } = render(
      <AnalyticsCard
        title="Active Users"
        value={32}
        trend="neutral"
        trendValue={0}
      />
    );

    const trendElement = container.querySelector('.text-neutral-500');
    expect(trendElement).toBeInTheDocument();
  });

  it('should render without trend when not provided', () => {
    render(
      <AnalyticsCard
        title="Total Users"
        value={45}
      />
    );

    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.queryByText('↑')).not.toBeInTheDocument();
    expect(screen.queryByText('↓')).not.toBeInTheDocument();
  });
});
