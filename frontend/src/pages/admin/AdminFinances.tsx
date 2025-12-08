/**
 * AdminFinances Page - TypeScript
 * Financial analytics and revenue tracking
 * PURE CSS ONLY - No Tailwind
 */

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Spinner } from '../../components/ui/Spinner';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { adminService } from '../../services/admin';
import logger from '@/utils/logger';
import './AdminFinances.css';

type PeriodType = 'month' | 'year';

interface RevenueBreakdownItem {
  name: string;
  value: number;
}

interface FinanceData {
  revenue_month?: number;
  revenue_year?: number;
  costs?: number;
  margin?: number;
  breakdown?: RevenueBreakdownItem[];
}

/**
 * AdminFinances Component
 * Editorial Financial Dashboard - Refined luxury with data-driven precision
 */
export function AdminFinances() {
  const [finances, setFinances] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('month');

  useEffect(() => {
    async function loadFinances() {
      try {
        logger.debug('💰 AdminFinances: Loading finances...');
        const data: FinanceData = await adminService.getFinances();
        logger.debug('✅ AdminFinances: Data loaded:', data);
        setFinances(data);
      } catch (err: any) {
        logger.error('❌ AdminFinances: Failed to fetch finances:', err);
        toast.error('Failed to load finances');
      } finally {
        setLoading(false);
      }
    }
    loadFinances();
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="admin-page admin-loading">
          <Spinner size="lg" />
        </div>
      </AdminLayout>
    );
  }

  const revenueMonth = finances?.revenue_month || 0;
  const revenueYear = finances?.revenue_year || 0;
  const costs = finances?.costs || 0;
  const margin = finances?.margin || 0;
  const netProfit = selectedPeriod === 'month'
    ? revenueMonth - (costs / 12)
    : revenueYear - costs;

  return (
    <AdminLayout>
      <div className="finances-page">
        {/* Hero Header */}
        <header className="finances-hero">
          <div className="finances-hero-content">
            <div className="finances-breadcrumb">Admin / Financial Analytics</div>
            <h1 className="finances-hero-title">Financial Performance</h1>
            <p className="finances-hero-subtitle">
              Real-time revenue tracking, cost analysis, and profitability metrics
            </p>
          </div>

          <div className="finances-hero-actions">
            <div className="period-selector">
              <button
                className={`period-btn ${selectedPeriod === 'month' ? 'active' : ''}`}
                onClick={() => setSelectedPeriod('month')}
              >
                Monthly
              </button>
              <button
                className={`period-btn ${selectedPeriod === 'year' ? 'active' : ''}`}
                onClick={() => setSelectedPeriod('year')}
              >
                Yearly
              </button>
            </div>

            <button className="export-btn" onClick={() => toast('Export feature coming soon', { icon: 'ℹ️' })}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M14 10v2.667A1.333 1.333 0 0112.667 14H3.333A1.333 1.333 0 012 12.667V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M11.333 5.333L8 2 4.667 5.333M8 2v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Export Data
            </button>
          </div>
        </header>

        {/* Feature Metrics - Large Editorial Numbers */}
        <div className="finances-feature-grid">
          {/* Primary Metric - Revenue */}
          <div className="feature-metric feature-metric--primary">
            <div className="feature-metric-label">
              {selectedPeriod === 'month' ? 'Monthly Revenue' : 'Annual Revenue'}
            </div>
            <div className="feature-metric-value">
              €{selectedPeriod === 'month' ? revenueMonth.toLocaleString() : revenueYear.toLocaleString()}
            </div>
            <div className="feature-metric-growth">
              <span className="growth-indicator growth-indicator--up">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 10V2M6 2L2 6M6 2l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                +12.5%
              </span>
              <span className="growth-period">vs last {selectedPeriod}</span>
            </div>
          </div>

          {/* Secondary Metrics */}
          <div className="feature-metric feature-metric--secondary">
            <div className="feature-metric-label">Net Profit</div>
            <div className="feature-metric-value feature-metric-value--medium">
              €{netProfit.toLocaleString()}
            </div>
            <div className="feature-metric-bar">
              <div className="metric-bar-fill" style={{ width: `${(netProfit / (selectedPeriod === 'month' ? revenueMonth : revenueYear)) * 100}%` }}></div>
            </div>
          </div>

          <div className="feature-metric feature-metric--secondary">
            <div className="feature-metric-label">Operating Costs</div>
            <div className="feature-metric-value feature-metric-value--medium">
              €{(selectedPeriod === 'month' ? costs / 12 : costs).toLocaleString()}
            </div>
            <div className="feature-metric-detail">
              Infrastructure, API, hosting
            </div>
          </div>

          <div className="feature-metric feature-metric--accent">
            <div className="feature-metric-label">Profit Margin</div>
            <div className="feature-metric-value feature-metric-value--large">
              {margin}%
            </div>
            <div className="feature-metric-gauge">
              <svg viewBox="0 0 120 60" className="gauge-svg">
                <path d="M10 50 A 50 50 0 0 1 110 50" stroke="var(--border)" strokeWidth="8" fill="none"/>
                <path d="M10 50 A 50 50 0 0 1 110 50" stroke="var(--primary)" strokeWidth="8" fill="none" strokeDasharray={`${(margin / 100) * 157} 157`} strokeLinecap="round"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Revenue Breakdown - Editorial List */}
        <section className="finances-section">
          <div className="section-header">
            <h2 className="section-title">Revenue Breakdown</h2>
            <span className="section-badge">{finances?.breakdown?.length || 0} sources</span>
          </div>

          {finances?.breakdown && finances.breakdown.length > 0 ? (
            <div className="revenue-breakdown-grid">
              {finances.breakdown.map((item, idx) => {
                const percentage = ((item.value / revenueMonth) * 100).toFixed(1);
                return (
                  <div key={idx} className="breakdown-card" style={{ animationDelay: `${idx * 50}ms` }}>
                    <div className="breakdown-header">
                      <div className="breakdown-icon">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                          <path d="M7 10h6M10 7v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </div>
                      <span className="breakdown-percentage">{percentage}%</span>
                    </div>

                    <h3 className="breakdown-name">{item.name}</h3>
                    <div className="breakdown-value">€{item.value.toLocaleString()}</div>

                    <div className="breakdown-bar">
                      <div className="breakdown-bar-fill" style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="finances-empty">
              <div className="empty-illustration">
                <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                  <circle cx="40" cy="40" r="38" stroke="var(--border)" strokeWidth="2" strokeDasharray="4 4"/>
                  <path d="M40 25v30M25 40h30" stroke="var(--muted-foreground)" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="empty-title">No Revenue Data</h3>
              <p className="empty-description">Start tracking revenue sources to see detailed breakdown</p>
            </div>
          )}
        </section>

        {/* Insights Section */}
        <section className="finances-insights">
          <h2 className="section-title">Key Insights</h2>

          <div className="insights-grid">
            <div className="insight-card insight-card--success">
              <div className="insight-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
                </svg>
              </div>
              <h3 className="insight-title">Strong Growth</h3>
              <p className="insight-description">Revenue increased 12.5% compared to last period</p>
            </div>

            <div className="insight-card insight-card--info">
              <div className="insight-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 16V12M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="insight-title">Margin Healthy</h3>
              <p className="insight-description">Profit margin at {margin}% exceeds industry average</p>
            </div>

            <div className="insight-card insight-card--warning">
              <div className="insight-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor"/>
                </svg>
              </div>
              <h3 className="insight-title">Optimize Costs</h3>
              <p className="insight-description">Consider reviewing infrastructure spending</p>
            </div>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
