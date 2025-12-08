/**
 * RevenueChart Component
 * Displays a bar chart showing revenue by day
 * PURE CSS ONLY - No Tailwind
 */

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { RevenueChartData } from '../../types/admin';

interface RevenueChartProps {
  data: RevenueChartData[];
  loading?: boolean;
}

export default function RevenueChart({ data, loading = false }: RevenueChartProps) {
  if (loading) {
    return (
      <div className="card">
        <h3 className="text-h3 mb-4">Revenue Trend</h3>
        <div className="flex items-center justify-center" style={{ height: '300px' }}>
          <span className="text-neutral-500">Loading...</span>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="card">
        <h3 className="text-h3 mb-4">Revenue Trend</h3>
        <div className="flex items-center justify-center" style={{ height: '300px' }}>
          <span className="text-neutral-500">No data available</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-h3 mb-4">Revenue Trend</h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--neutral-200)" />
          <XAxis
            dataKey="date"
            stroke="var(--neutral-600)"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="var(--neutral-600)"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid var(--neutral-200)',
              borderRadius: 'var(--radius-md)',
              fontSize: '14px'
            }}
            formatter={(value) => [`$${value}`, 'Revenue']}
          />
          <Bar
            dataKey="revenue"
            fill="var(--primary)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
