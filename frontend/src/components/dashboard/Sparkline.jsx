import { LineChart, Line, ResponsiveContainer } from 'recharts'

/**
 * Sparkline Component
 * Small inline chart for displaying trends
 *
 * @param {Object} props
 * @param {Array} props.data - Array of data points for the chart
 * @param {string} props.color - Color of the line (default: '#34C759')
 * @param {number} props.height - Height of the chart (default: 40)
 */
export function Sparkline({ data = [], color = '#34C759', height = 40 }) {
  // Generate sample data if none provided
  const chartData = data.length > 0 ? data : generateSampleData()

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
  )
}

/**
 * Generate sample sparkline data
 */
function generateSampleData() {
  const points = 12
  const data = []
  let value = 50

  for (let i = 0; i < points; i++) {
    value += (Math.random() - 0.5) * 20
    value = Math.max(20, Math.min(80, value))
    data.push({ value })
  }

  return data
}
