/**
 * AdminAnalytics Page
 * Analytics dashboard for admin with KPIs, charts, and tables
 * PURE CSS ONLY - No Tailwind
 */

import { useState, useEffect } from 'react';
import { analyticsService } from '../services/analyticsService';
import AnalyticsCard from '../components/admin/AnalyticsCard';
import TrendChart from '../components/admin/TrendChart';
import SuccessChart from '../components/admin/SuccessChart';
import RevenueChart from '../components/admin/RevenueChart';
import TopWorkflowsTable from '../components/admin/TopWorkflowsTable';
import TopClientsTable from '../components/admin/TopClientsTable';
import RecentFailuresTable from '../components/admin/RecentFailuresTable';

export default function AdminAnalytics() {
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('executions');

  // Overview data
  const [overview, setOverview] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [workflowPerformance, setWorkflowPerformance] = useState([]);
  const [revenueBreakdown, setRevenueBreakdown] = useState([]);
  const [failures, setFailures] = useState([]);

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all analytics data in parallel
      const [overviewData, trendData, performanceData, failuresData] = await Promise.all([
        analyticsService.getOverview(),
        analyticsService.getExecutionsTrend(period),
        analyticsService.getWorkflowPerformance(period),
        analyticsService.getFailures(period, 100)
      ]);

      setOverview(overviewData);
      setTrendData(trendData);
      setWorkflowPerformance(performanceData);
      setFailures(failuresData);
    } catch (err) {
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (e) => {
    setPeriod(e.target.value);
  };

  const formatCurrency = (value) => {
    return `$${value.toLocaleString()}`;
  };

  if (loading && !overview) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="text-neutral-600">Loading...</span>
      </div>
    );
  }

  if (error && !overview) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-error mb-4">{error}</p>
          <button className="btn btn-primary" onClick={loadAnalytics}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-h1 font-bold text-neutral-900">Analytics</h1>

        {/* Period Selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="period" className="text-body-sm text-neutral-700">
            Period:
          </label>
          <select
            id="period"
            value={period}
            onChange={handlePeriodChange}
            className="px-4 py-2 border border-neutral-200 rounded-lg text-body-sm"
            style={{ width: '120px' }}
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <AnalyticsCard
          title="Total Users"
          value={overview?.totalUsers || 0}
          loading={loading}
        />
        <AnalyticsCard
          title="Active Users"
          value={overview?.activeUsers || 0}
          loading={loading}
        />
        <AnalyticsCard
          title="Total Executions"
          value={overview?.totalExecutions || 0}
          trend={overview?.executionsTrend > 0 ? 'up' : overview?.executionsTrend < 0 ? 'down' : 'neutral'}
          trendValue={overview?.executionsTrend || 0}
          period="vs last month"
          loading={loading}
        />
        <AnalyticsCard
          title="Success Rate"
          value={overview?.successRate || 0}
          suffix="%"
          loading={loading}
        />
        <AnalyticsCard
          title="Failure Rate"
          value={overview?.failureRate || 0}
          suffix="%"
          loading={loading}
        />
        <AnalyticsCard
          title="Revenue This Month"
          value={overview?.revenueThisMonth ? formatCurrency(overview.revenueThisMonth) : '$0'}
          trend={overview?.successTrend > 0 ? 'up' : overview?.successTrend < 0 ? 'down' : 'neutral'}
          trendValue={overview?.successTrend || 0}
          period="vs last month"
          loading={loading}
        />
      </div>

      {/* Charts Section */}
      <div className="mb-8">
        {/* Chart Tabs */}
        <div className="flex gap-2 mb-4" style={{ borderBottom: '2px solid var(--neutral-200)' }}>
          <button
            onClick={() => setActiveTab('executions')}
            className={`px-4 py-2 text-body-sm font-medium transition ${
              activeTab === 'executions'
                ? 'text-primary border-b-2 border-primary'
                : 'text-neutral-600 hover:text-primary'
            }`}
            style={{ borderBottom: activeTab === 'executions' ? '2px solid var(--primary)' : 'none', marginBottom: '-2px' }}
          >
            Executions
          </button>
          <button
            onClick={() => setActiveTab('success')}
            className={`px-4 py-2 text-body-sm font-medium transition ${
              activeTab === 'success'
                ? 'text-primary border-b-2 border-primary'
                : 'text-neutral-600 hover:text-primary'
            }`}
            style={{ borderBottom: activeTab === 'success' ? '2px solid var(--primary)' : 'none', marginBottom: '-2px' }}
          >
            Success/Failure
          </button>
          <button
            onClick={() => setActiveTab('revenue')}
            className={`px-4 py-2 text-body-sm font-medium transition ${
              activeTab === 'revenue'
                ? 'text-primary border-b-2 border-primary'
                : 'text-neutral-600 hover:text-primary'
            }`}
            style={{ borderBottom: activeTab === 'revenue' ? '2px solid var(--primary)' : 'none', marginBottom: '-2px' }}
          >
            Revenue
          </button>
        </div>

        {/* Chart Content */}
        {activeTab === 'executions' && (
          <TrendChart
            data={trendData}
            title="Executions Trend"
            period={`Last ${period === '7d' ? '7' : period === '30d' ? '30' : '90'} days`}
            loading={loading}
          />
        )}

        {activeTab === 'success' && (
          <SuccessChart
            successRate={overview?.successRate || 0}
            failureRate={overview?.failureRate || 0}
            loading={loading}
          />
        )}

        {activeTab === 'revenue' && (
          <RevenueChart
            data={trendData}
            loading={loading}
          />
        )}
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <TopWorkflowsTable
          workflows={workflowPerformance}
          loading={loading}
        />
        <TopClientsTable
          clients={[]}
          loading={loading}
        />
      </div>

      {/* Failures Table */}
      <RecentFailuresTable
        failures={failures}
        loading={loading}
      />
    </div>
  );
}
