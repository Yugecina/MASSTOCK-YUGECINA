/**
 * TopWorkflowsTable Component
 * Displays top workflows by executions
 * PURE CSS ONLY - No Tailwind
 */

export default function TopWorkflowsTable({ workflows, loading = false }) {
  if (loading) {
    return (
      <div className="card">
        <h3 className="text-h3 mb-4">Top Workflows</h3>
        <div className="flex items-center justify-center py-8">
          <span className="text-neutral-500">Loading...</span>
        </div>
      </div>
    );
  }

  if (!workflows || workflows.length === 0) {
    return (
      <div className="card">
        <h3 className="text-h3 mb-4">Top Workflows</h3>
        <div className="flex items-center justify-center py-8">
          <span className="text-neutral-500">No workflow data available</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-h3 mb-4">Top Workflows</h3>

      <div className="overflow-x-auto">
        <table style={{ width: '100%' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--neutral-200)' }}>
              <th className="text-left py-3 px-4 text-body-sm font-semibold text-neutral-700">
                Name
              </th>
              <th className="text-left py-3 px-4 text-body-sm font-semibold text-neutral-700">
                Executions
              </th>
              <th className="text-left py-3 px-4 text-body-sm font-semibold text-neutral-700">
                Success Rate
              </th>
              <th className="text-left py-3 px-4 text-body-sm font-semibold text-neutral-700">
                Avg Duration
              </th>
              <th className="text-left py-3 px-4 text-body-sm font-semibold text-neutral-700">
                Revenue
              </th>
            </tr>
          </thead>
          <tbody>
            {workflows.map((workflow, index) => (
              <tr
                key={workflow.id || index}
                style={{
                  borderBottom: index < workflows.length - 1 ? '1px solid var(--neutral-200)' : 'none'
                }}
                className="hover:bg-neutral-50 transition"
              >
                <td className="py-3 px-4 text-body-sm text-neutral-900">
                  {workflow.name}
                </td>
                <td className="py-3 px-4 text-body-sm text-neutral-900">
                  {workflow.executions}
                </td>
                <td className="py-3 px-4 text-body-sm">
                  <span className={workflow.successRate >= 90 ? 'text-success' : 'text-warning'}>
                    {workflow.successRate}%
                  </span>
                </td>
                <td className="py-3 px-4 text-body-sm text-neutral-900">
                  {workflow.avgDuration ? `${workflow.avgDuration}s` : 'N/A'}
                </td>
                <td className="py-3 px-4 text-body-sm text-neutral-900">
                  ${workflow.revenue ? workflow.revenue.toLocaleString() : '0'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
