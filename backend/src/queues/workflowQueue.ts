import Queue, { Job, JobOptions } from 'bull';
import { redisConfig } from '../config/redis';

interface WorkflowJobData {
  executionId: string;
  workflowId: string;
  clientId: string;
  userId: string;
  inputData: {
    prompts: string[];
    reference_images?: Array<{ data: string; mimeType: string }>;
  };
  config: {
    workflow_type?: string;
    api_key_encrypted?: string;
    model?: string;
    aspect_ratio?: string;
    resolution?: string;
    [key: string]: any;
  };
}

interface JobStatus {
  id: string | number | undefined;
  state: string;
  progress: number | object;
  data: WorkflowJobData;
  returnvalue: any;
  failedReason: string | undefined;
}

const workflowQueue = new Queue<WorkflowJobData>('workflow-execution', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: 100,
    removeOnFail: 500,
    timeout: 1800000 // 30 minutes
  }
});

async function addWorkflowJob(data: WorkflowJobData): Promise<Job<WorkflowJobData>> {
  const job = await workflowQueue.add(data, {
    jobId: data.executionId
  } as JobOptions);
  return job;
}

async function getJobStatus(jobId: string): Promise<JobStatus | null> {
  const job = await workflowQueue.getJob(jobId);
  if (!job) {
    return null;
  }

  const state = await job.getState();
  const progress = job.progress();

  return {
    id: job.id,
    state,
    progress,
    data: job.data,
    returnvalue: job.returnvalue,
    failedReason: job.failedReason
  };
}

export {
  workflowQueue,
  addWorkflowJob,
  getJobStatus,
  WorkflowJobData,
  JobStatus
};
