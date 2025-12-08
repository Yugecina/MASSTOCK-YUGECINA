import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ClientLayout } from '../components/layout/ClientLayout'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'
import { Sparkline } from '../components/dashboard/Sparkline'
import { workflowService } from '../services/workflows'
import logger from '@/utils/logger'
import { Workflow, Execution } from '../types'

interface WorkflowConfig {
  fields?: Array<{
    name: string
    label?: string
    type?: string
    placeholder?: string
    required?: boolean
  }>
}

interface WorkflowWithSchema extends Workflow {
  schema?: WorkflowConfig
  execution_count?: number
}

/**
 * WorkflowDetail Page
 * Detailed view of a single workflow with stats and execution history
 */
export function WorkflowDetail(): JSX.Element {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [workflow, setWorkflow] = useState<WorkflowWithSchema | null>(null)
  const [executions, setExecutions] = useState<Execution[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    async function loadData(): Promise<void> {
      try {
        const [workflowData, executionsData] = await Promise.all([
          workflowService.get(id!),
          workflowService.getExecutions(id!).catch(() => ({ executions: [] }))
        ])
        setWorkflow(workflowData.workflow)
        setExecutions(executionsData.executions || [])
      } catch (err) {
        logger.error('Failed to fetch workflow:', err)
        navigate('/workflows')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id, navigate])

  if (loading) {
    return (
      <ClientLayout>
        <div className="flex justify-center items-center min-h-screen">
          <Spinner size="lg" />
        </div>
      </ClientLayout>
    )
  }

  if (!workflow) {
    return (
      <ClientLayout>
        <div className="text-center py-12">
          <h2 className="text-h2 font-bold mb-2">Workflow not found</h2>
          <p className="text-neutral-600 mb-6">The workflow you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/workflows')}>Back to Workflows</Button>
        </div>
      </ClientLayout>
    )
  }

  const recentExecutions = executions.slice(0, 5)

  return (
    <ClientLayout>
      <div className="space-y-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/workflows')}
          className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" strokeWidth={2} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to Workflows
        </button>

        {/* Header with Action */}
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-start gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-purple-500 w-20 h-20 rounded-xl flex items-center justify-center text-4xl flex-shrink-0 shadow-lg">
              📊
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-h1 font-bold">{workflow.name}</h1>
                <Badge variant="success">Active</Badge>
              </div>
              <p className="text-neutral-600 text-body mb-4">
                {workflow.description || 'No description available'}
              </p>
              <div className="flex items-center gap-6 text-sm text-neutral-500">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" strokeWidth={2} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                  {workflow.execution_count || 0} total executions
                </span>
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" strokeWidth={2} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Created {new Date(workflow.created_at || Date.now()).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate(`/workflows/${id}/execute`)}
          >
            Execute Workflow
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50">
            <div className="text-label text-neutral-600 mb-2">Total Executions</div>
            <div className="text-3xl font-bold text-neutral-900 mb-3">
              {workflow.execution_count || 0}
            </div>
            <div className="h-10">
              <Sparkline color="#007AFF" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
            <div className="text-label text-neutral-600 mb-2">Success Rate</div>
            <div className="text-3xl font-bold text-success-main mb-3">98.5%</div>
            <div className="h-10">
              <Sparkline color="#34C759" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-pink-50">
            <div className="text-label text-neutral-600 mb-2">Avg Duration</div>
            <div className="text-3xl font-bold text-neutral-900 mb-3">2.3s</div>
            <div className="h-10">
              <Sparkline color="#A855F7" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-amber-50">
            <div className="text-label text-neutral-600 mb-2">Last 7 Days</div>
            <div className="text-3xl font-bold text-neutral-900 mb-3">
              {executions.length}
            </div>
            <div className="h-10">
              <Sparkline color="#FF9500" />
            </div>
          </Card>
        </div>

        {/* Workflow Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration */}
          <div className="lg:col-span-2">
            <Card>
              <h2 className="text-h2 font-bold mb-6">Workflow Configuration</h2>
              <div className="space-y-4">
                {workflow.schema?.fields && workflow.schema.fields.length > 0 ? (
                  workflow.schema.fields.map((field, index) => (
                    <div key={index} className="border-b border-neutral-200 pb-4 last:border-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-neutral-900">{field.label || field.name}</div>
                          <div className="text-sm text-neutral-600 mt-1">
                            Type: {field.type || 'text'}
                          </div>
                          {field.placeholder && (
                            <div className="text-sm text-neutral-500 mt-1">
                              Placeholder: {field.placeholder}
                            </div>
                          )}
                        </div>
                        {field.required && (
                          <Badge variant="warning">Required</Badge>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-neutral-600">No configuration fields defined</p>
                )}
              </div>
            </Card>
          </div>

          {/* Info Panel */}
          <div>
            <Card>
              <h3 className="text-h3 font-bold mb-4">Information</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-label text-neutral-600 mb-1">Category</div>
                  <div className="text-body">Automation</div>
                </div>
                <div>
                  <div className="text-label text-neutral-600 mb-1">Version</div>
                  <div className="text-body">1.0.0</div>
                </div>
                <div>
                  <div className="text-label text-neutral-600 mb-1">Last Updated</div>
                  <div className="text-body">
                    {new Date(workflow.updated_at || workflow.created_at || Date.now()).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="text-label text-neutral-600 mb-1">Tags</div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="success">Production</Badge>
                    <Badge variant="warning">Popular</Badge>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Recent Executions */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-h2 font-bold">Recent Executions</h2>
            <button className="text-primary-main hover:text-primary-dark font-medium text-sm">
              View all →
            </button>
          </div>
          {recentExecutions.length > 0 ? (
            <div className="space-y-3">
              {recentExecutions.map((execution) => (
                <div
                  key={execution.id}
                  className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full ${execution.status === 'completed' ? 'bg-success-main' :
                        execution.status === 'failed' ? 'bg-error-main' :
                          'bg-warning-main'
                      }`} />
                    <div>
                      <div className="font-medium text-neutral-900">
                        Execution #{execution.id}
                      </div>
                      <div className="text-sm text-neutral-600">
                        {new Date(execution.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant={
                      execution.status === 'completed' ? 'success' :
                        execution.status === 'failed' ? 'error' : 'warning'
                    }>
                      {execution.status}
                    </Badge>
                    <div className="text-sm text-neutral-600">
                      {(execution as any).duration || '2.3s'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-neutral-600">
              <div className="text-4xl mb-2">📋</div>
              No executions yet
            </div>
          )}
        </Card>
      </div>
    </ClientLayout>
  )
}
