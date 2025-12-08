import { formatDistanceToNow } from 'date-fns';
import type { FailureData } from '../../types/admin';

interface RecentFailuresTableProps {
  failures: FailureData[];
  loading?: boolean;
}

/**
 * RecentFailuresTable Component
 * Displays recent failed executions
 * PURE CSS ONLY - No Tailwind
 */

export default function RecentFailuresTable({ failures, loading = false }: RecentFailuresTableProps) {
  if (loading) {
    return (
      <div className="card">
        <h3 className="text-h3 mb-4">Recent Failures</h3>
        <div className="flex items-center justify-center py-8">
          <span className="text-neutral-500">Loading...</span>
        </div>
      </div>
    );
  }

  if (!failures || failures.length === 0) {
    return (
      <div className="card">
        <h3 className="text-h3 mb-4">Recent Failures</h3>
        <div className="flex items-center justify-center py-8">
          <span className="text-neutral-500">No recent failures</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-h3 mb-4">Recent Failures</h3>

      <div className="overflow-x-auto">
        <table style={{ width: '100%' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--neutral-200)' }}>
              <th className="text-left py-3 px-4 text-body-sm font-semibold text-neutral-700">
                Workflow
              </th>
              <th className="text-left py-3 px-4 text-body-sm font-semibold text-neutral-700">
                Client
              </th>
              <th className="text-left py-3 px-4 text-body-sm font-semibold text-neutral-700">
                Error
              </th>
              <th className="text-left py-3 px-4 text-body-sm font-semibold text-neutral-700">
                Time
              </th>
            </tr>
          </thead>
          <tbody>
            {failures.map((failure, index) => (
              <tr
                key={failure.id || index}
                style={{
                  borderBottom: index < failures.length - 1 ? '1px solid var(--neutral-200)' : 'none'
                }}
                className="hover:bg-neutral-50 transition"
              >
                <td className="py-3 px-4 text-body-sm text-neutral-900">
                  {failure.workflow_name}
                </td>
                <td className="py-3 px-4 text-body-sm text-neutral-900">
                  {failure.client_name}
                </td>
                <td className="py-3 px-4 text-body-sm text-error">
                  <span className="truncate" style={{ maxWidth: '300px', display: 'inline-block' }}>
                    {failure.error_message}
                  </span>
                </td>
                <td className="py-3 px-4 text-body-sm text-neutral-600">
                  {formatDistanceToNow(new Date(failure.created_at), { addSuffix: true })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
