import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface SuccessChartProps {
  successRate: number;
  failureRate: number;
  loading?: boolean;
}

interface ChartData {
  name: string;
  value: number;
}

/**
 * SuccessChart Component
 * Displays a pie chart showing success vs failure ratio
 * PURE CSS ONLY - No Tailwind
 */

export default function SuccessChart({ successRate, failureRate, loading = false }: SuccessChartProps) {
  if (loading) {
    return (
      <div className="card">
        <h3 className="text-h3 mb-4">Success vs Failure</h3>
        <div className="flex items-center justify-center" style={{ height: '300px' }}>
          <span className="text-neutral-500">Loading...</span>
        </div>
      </div>
    );
  }

  const data: ChartData[] = [
    { name: 'Success', value: successRate || 0 },
    { name: 'Failure', value: failureRate || 0 }
  ];

  const COLORS = ['var(--success)', 'var(--error)'];

  return (
    <div className="card">
      <h3 className="text-h3 mb-4">Success vs Failure</h3>

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(1)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid var(--neutral-200)',
              borderRadius: 'var(--radius-md)',
              fontSize: '14px'
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
