/**
 * TopClientsTable Component
 * Displays top clients by revenue
 * PURE CSS ONLY - No Tailwind
 */

export default function TopClientsTable({ clients, loading = false }) {
  if (loading) {
    return (
      <div className="card">
        <h3 className="text-h3 mb-4">Top Clients</h3>
        <div className="flex items-center justify-center py-8">
          <span className="text-neutral-500">Loading...</span>
        </div>
      </div>
    );
  }

  if (!clients || clients.length === 0) {
    return (
      <div className="card">
        <h3 className="text-h3 mb-4">Top Clients</h3>
        <div className="flex items-center justify-center py-8">
          <span className="text-neutral-500">No client data available</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-h3 mb-4">Top Clients</h3>

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
                Revenue
              </th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client, index) => (
              <tr
                key={client.id || index}
                style={{
                  borderBottom: index < clients.length - 1 ? '1px solid var(--neutral-200)' : 'none'
                }}
                className="hover:bg-neutral-50 transition"
              >
                <td className="py-3 px-4 text-body-sm text-neutral-900">
                  {client.name}
                </td>
                <td className="py-3 px-4 text-body-sm text-neutral-900">
                  {client.executions || 0}
                </td>
                <td className="py-3 px-4 text-body-sm">
                  <span className={client.successRate >= 90 ? 'text-success' : 'text-warning'}>
                    {client.successRate || 0}%
                  </span>
                </td>
                <td className="py-3 px-4 text-body-sm text-neutral-900">
                  ${client.revenue ? client.revenue.toLocaleString() : '0'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
