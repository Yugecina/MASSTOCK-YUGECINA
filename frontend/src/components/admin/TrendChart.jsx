/**
 * TrendChart Component
 * Displays a line chart for executions trend
 * PURE CSS ONLY - No Tailwind
 */

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function TrendChart({ data, title, period, loading = false }) {
  if (loading) {
    return (
      <div className="card">
        <h3 className="text-h3 mb-4">{title}</h3>
        <div className="flex items-center justify-center" style={{ height: '300px' }}>
          <span className="text-neutral-500">Loading...</span>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="card">
        <h3 className="text-h3 mb-4">{title}</h3>
        <div className="flex items-center justify-center" style={{ height: '300px' }}>
          <span className="text-neutral-500">No data available</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="mb-4">
        <h3 className="text-h3">{title}</h3>
        {period && (
          <p className="text-body-sm text-neutral-600 mt-1">{period}</p>
        )}
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--neutral-200)" />
          <XAxis
            dataKey="date"
            stroke="var(--neutral-600)"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="var(--neutral-600)"
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid var(--neutral-200)',
              borderRadius: 'var(--radius-md)',
              fontSize: '14px'
            }}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="var(--primary)"
            strokeWidth={2}
            dot={{ fill: 'var(--primary)', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
