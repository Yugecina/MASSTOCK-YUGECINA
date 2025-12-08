/**
 * Tests for Workflow Queue
 */

jest.mock('../../config/redis', () => ({
  redisConfig: {
    host: 'localhost',
    port: 6379
  }
}));

jest.mock('bull', () => {
  return jest.fn().mockImplementation(() => ({
    add: jest.fn().mockResolvedValue({ id: 'job-123' }),
    process: jest.fn(),
    on: jest.fn(),
    getJob: jest.fn().mockResolvedValue({
      id: 'job-123',
      data: { workflowId: 'wf-1' },
      progress: jest.fn(),
      remove: jest.fn(),
      getState: jest.fn().mockResolvedValue('completed')
    }),
    getJobs: jest.fn().mockResolvedValue([]),
    pause: jest.fn().mockResolvedValue(true),
    resume: jest.fn().mockResolvedValue(true),
    close: jest.fn().mockResolvedValue(true)
  }));
});

describe('Workflow Queue', () => {
  let workflowQueue, addWorkflowJob, getJobStatus;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    
    import queueModule from '../../queues/workflowQueue';
    workflowQueue = queueModule.workflowQueue;
    addWorkflowJob = queueModule.addWorkflowJob;
    getJobStatus = queueModule.getJobStatus;
  });

  describe('addWorkflowJob', () => {
    it('should add job to queue', async () => {
      const jobData = {
        workflowId: 'wf-1',
        executionId: 'exec-1',
        input: { test: 'data' }
      };

      const job = await addWorkflowJob(jobData);

      expect(workflowQueue.add).toHaveBeenCalledWith(jobData, expect.any(Object));
      expect(job.id).toBe('job-123');
    });
  });

  describe('getJobStatus', () => {
    it('should retrieve job status', async () => {
      const status = await getJobStatus('job-123');

      expect(workflowQueue.getJob).toHaveBeenCalledWith('job-123');
      expect(status).toBeDefined();
    });
  });

  describe('workflowQueue', () => {
    it('should be configured correctly', () => {
      expect(workflowQueue).toBeDefined();
      expect(workflowQueue.add).toBeDefined();
      expect(workflowQueue.process).toBeDefined();
    });
  });
});
