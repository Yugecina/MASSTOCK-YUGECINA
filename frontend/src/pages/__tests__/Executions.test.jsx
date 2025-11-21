import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { Executions } from '../Executions'
import { workflowService } from '../../services/workflows'

// Mock the workflow service
vi.mock('../../services/workflows', () => ({
  workflowService: {
    list: vi.fn(),
    getExecutions: vi.fn(),
    getExecution: vi.fn(),
  }
}))

// Mock the router hooks
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('Executions', () => {
  const mockWorkflows = [
    {
      id: 'workflow-1',
      name: 'Test Workflow 1',
      description: 'First test workflow'
    },
    {
      id: 'workflow-2',
      name: 'Test Workflow 2',
      description: 'Second test workflow'
    }
  ]

  const mockExecutions = [
    {
      id: 'exec-1',
      workflow_id: 'workflow-1',
      workflow_name: 'Test Workflow 1',
      status: 'completed',
      created_at: '2025-01-20T10:00:00Z',
      duration_seconds: 5,
      input_data: { test: 'input' },
      output_data: { result: 'success' }
    },
    {
      id: 'exec-2',
      workflow_id: 'workflow-1',
      workflow_name: 'Test Workflow 1',
      status: 'failed',
      created_at: '2025-01-20T09:00:00Z',
      error_message: 'Test error',
      input_data: { test: 'input2' }
    },
    {
      id: 'exec-3',
      workflow_id: 'workflow-2',
      workflow_name: 'Test Workflow 2',
      status: 'processing',
      created_at: '2025-01-20T08:00:00Z',
      input_data: { test: 'input3' }
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock implementations
    workflowService.list.mockResolvedValue({ workflows: mockWorkflows })
    workflowService.getExecutions.mockImplementation((workflowId) => {
      const execs = mockExecutions.filter(e => e.workflow_id === workflowId)
      return Promise.resolve({ executions: execs })
    })
  })

  function renderComponent() {
    return render(
      <BrowserRouter>
        <Executions />
      </BrowserRouter>
    )
  }

  it('should render the component', async () => {
    renderComponent()

    // Should eventually show the main heading after loading
    await waitFor(() => {
      expect(screen.getByText('Workflow Executions')).toBeInTheDocument()
    })
  })

  it('should display executions after loading', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Workflow Executions')).toBeInTheDocument()
    })

    // Check that executions are displayed
    expect(screen.getByText('Test Workflow 1')).toBeInTheDocument()
    expect(screen.getByText('Test Workflow 2')).toBeInTheDocument()
  })

  it('should display correct status counts', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Total')).toBeInTheDocument()
    })

    // Check stats cards
    const statsSection = screen.getByText('Total').closest('.grid')
    expect(within(statsSection).getByText('3')).toBeInTheDocument() // Total
    expect(within(statsSection).getByText('1')).toBeInTheDocument() // Completed
    expect(within(statsSection).getByText('1')).toBeInTheDocument() // Failed
    expect(within(statsSection).getByText('1')).toBeInTheDocument() // Processing
  })

  it('should filter executions by status', async () => {
    const user = userEvent.setup()
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Workflow Executions')).toBeInTheDocument()
    })

    // Find and click the status filter dropdown
    const statusFilter = screen.getByLabelText('Status')
    await user.selectOptions(statusFilter, 'completed')

    await waitFor(() => {
      // Should only show completed executions (1)
      expect(screen.getByText('Executions (1)')).toBeInTheDocument()
    })
  })

  it('should filter executions by workflow', async () => {
    const user = userEvent.setup()
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Workflow Executions')).toBeInTheDocument()
    })

    // Find and click the workflow filter dropdown
    const workflowFilter = screen.getByLabelText('Workflow')
    await user.selectOptions(workflowFilter, 'workflow-1')

    await waitFor(() => {
      // Should only show workflow-1 executions (2)
      expect(screen.getByText('Executions (2)')).toBeInTheDocument()
    })
  })

  it('should clear filters when Clear Filters button is clicked', async () => {
    const user = userEvent.setup()
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Workflow Executions')).toBeInTheDocument()
    })

    // Apply a filter
    const statusFilter = screen.getByLabelText('Status')
    await user.selectOptions(statusFilter, 'completed')

    await waitFor(() => {
      expect(screen.getByText('Clear Filters')).toBeInTheDocument()
    })

    // Clear filters
    const clearButton = screen.getByText('Clear Filters')
    await user.click(clearButton)

    await waitFor(() => {
      expect(screen.getByText('Executions (3)')).toBeInTheDocument()
    })
  })

  it('should open execution detail modal when execution is clicked', async () => {
    const user = userEvent.setup()

    const mockExecutionDetail = {
      data: {
        ...mockExecutions[0],
        progress: 100,
        started_at: '2025-01-20T10:00:00Z',
        completed_at: '2025-01-20T10:00:05Z'
      }
    }

    workflowService.getExecution.mockResolvedValue(mockExecutionDetail)

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Test Workflow 1')).toBeInTheDocument()
    })

    // Click on the first execution
    const executionItems = screen.getAllByText('Test Workflow 1')
    await user.click(executionItems[0].closest('div.cursor-pointer'))

    await waitFor(() => {
      expect(screen.getByText('Execution Details')).toBeInTheDocument()
    })

    // Check that execution details are displayed
    expect(screen.getByText('completed')).toBeInTheDocument()
    expect(screen.getByText('5 seconds')).toBeInTheDocument()
  })

  it('should close modal when Close button is clicked', async () => {
    const user = userEvent.setup()

    const mockExecutionDetail = {
      data: mockExecutions[0]
    }

    workflowService.getExecution.mockResolvedValue(mockExecutionDetail)

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Test Workflow 1')).toBeInTheDocument()
    })

    // Open modal
    const executionItems = screen.getAllByText('Test Workflow 1')
    await user.click(executionItems[0].closest('div.cursor-pointer'))

    await waitFor(() => {
      expect(screen.getByText('Execution Details')).toBeInTheDocument()
    })

    // Close modal
    const closeButton = screen.getByText('Close')
    await user.click(closeButton)

    await waitFor(() => {
      expect(screen.queryByText('Execution Details')).not.toBeInTheDocument()
    })
  })

  it('should display error message for failed executions', async () => {
    const user = userEvent.setup()

    const mockExecutionDetail = {
      data: mockExecutions[1] // Failed execution
    }

    workflowService.getExecution.mockResolvedValue(mockExecutionDetail)

    renderComponent()

    await waitFor(() => {
      expect(screen.getAllByText('Test Workflow 1').length).toBeGreaterThan(0)
    })

    // Find and click the failed execution
    const failedExecution = screen.getAllByText('Test Workflow 1')[0].closest('div.cursor-pointer')
    await user.click(failedExecution)

    await waitFor(() => {
      expect(screen.getByText('Execution Details')).toBeInTheDocument()
    })

    // Check that error message is displayed
    expect(screen.getByText('Error')).toBeInTheDocument()
    expect(screen.getByText('Test error')).toBeInTheDocument()
  })

  it('should navigate to workflows page when Back button is clicked', async () => {
    const user = userEvent.setup()
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Workflow Executions')).toBeInTheDocument()
    })

    const backButton = screen.getByText('Back to Workflows')
    await user.click(backButton)

    expect(mockNavigate).toHaveBeenCalledWith('/workflows')
  })

  it('should display empty state when no executions match filters', async () => {
    const user = userEvent.setup()
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Workflow Executions')).toBeInTheDocument()
    })

    // Apply filter that returns no results
    const statusFilter = screen.getByLabelText('Status')
    await user.selectOptions(statusFilter, 'pending')

    await waitFor(() => {
      expect(screen.getByText('No executions found')).toBeInTheDocument()
      expect(screen.getByText('Try adjusting your filters')).toBeInTheDocument()
    })
  })

  it('should display empty state when no executions exist', async () => {
    // Mock empty workflows
    workflowService.list.mockResolvedValue({ workflows: [] })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('No executions found')).toBeInTheDocument()
      expect(screen.getByText('Execute a workflow to see results here')).toBeInTheDocument()
    })
  })

  it('should handle API errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    workflowService.list.mockRejectedValue(new Error('API Error'))

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Workflow Executions')).toBeInTheDocument()
    })

    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('should display input and output data in modal', async () => {
    const user = userEvent.setup()

    const mockExecutionDetail = {
      data: {
        ...mockExecutions[0],
        input_data: { prompt: 'test prompt', count: 5 },
        output_data: { result: 'success', images: ['img1.jpg', 'img2.jpg'] }
      }
    }

    workflowService.getExecution.mockResolvedValue(mockExecutionDetail)

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Test Workflow 1')).toBeInTheDocument()
    })

    // Click on execution
    const executionItems = screen.getAllByText('Test Workflow 1')
    await user.click(executionItems[0].closest('div.cursor-pointer'))

    await waitFor(() => {
      expect(screen.getByText('Input Data')).toBeInTheDocument()
      expect(screen.getByText('Output Data')).toBeInTheDocument()
    })
  })

  it('should navigate to workflow detail when View Workflow button is clicked', async () => {
    const user = userEvent.setup()

    const mockExecutionDetail = {
      data: mockExecutions[0]
    }

    workflowService.getExecution.mockResolvedValue(mockExecutionDetail)

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Test Workflow 1')).toBeInTheDocument()
    })

    // Open modal
    const executionItems = screen.getAllByText('Test Workflow 1')
    await user.click(executionItems[0].closest('div.cursor-pointer'))

    await waitFor(() => {
      expect(screen.getByText('Execution Details')).toBeInTheDocument()
    })

    // Click View Workflow button
    const viewWorkflowButton = screen.getByText('View Workflow')
    await user.click(viewWorkflowButton)

    expect(mockNavigate).toHaveBeenCalledWith('/workflows/workflow-1')
  })
})
