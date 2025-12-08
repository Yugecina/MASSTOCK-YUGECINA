import { LineChart, Line, ResponsiveContainer } from 'recharts';

/**
 * Data point interface for sparkline
 */
interface SparklineDataPoint {
  value: number;
}

/**
 * Sparkline Props
 */
interface SparklineProps {
  /** Array of data points for the chart */
  data?: SparklineDataPoint[];
  /** Color of the line (default: '#34C759') */
  color?: string;
  /** Height of the chart in pixels (default: 40) */
  height?: number;
}

/**
 * Sparkline Component
 * Small inline chart for displaying trends
 */
export function Sparkline({
  data = [],
  color = '#34C759',
  height = 40
}: SparklineProps) {
  // Generate sample data if none provided
  const chartData = data.length > 0 ? data : generateSampleData();

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

/**
 * Generate sample sparkline data
 */
function generateSampleData(): SparklineDataPoint[] {
  const points = 12;
  const data: SparklineDataPoint[] = [];
  let value = 50;

  for (let i = 0; i < points; i++) {
    value += (Math.random() - 0.5) * 20;
    value = Math.max(20, Math.min(80, value));
    data.push({ value });
  }

  return data;
}
