/**
 * Workflow Job Queue
 * Bull queue for asynchronous workflow execution
 */

const Bull = require('bull');
const { redisConfig } = require('../config/redis');
const { logger } = require('../config/logger');

// Create Bull queue
const workflowQueue = new Bull('workflow-execution', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 500 // Keep last 500 failed jobs
  }
});

// Queue event handlers
workflowQueue.on('completed', (job, result) => {
  logger.info('Job completed', {
    job_id: job.id,
    execution_id: job.data.executionId,
    workflow_id: job.data.workflowId,
    result
  });
});

workflowQueue.on('failed', (job, err) => {
  logger.error('Job failed', {
    job_id: job.id,
    execution_id: job.data.executionId,
    workflow_id: job.data.workflowId,
    error: err.message,
    stack: err.stack
  });
});

workflowQueue.on('stalled', (job) => {
  logger.warn('Job stalled', {
    job_id: job.id,
    execution_id: job.data.executionId
  });
});

workflowQueue.on('error', (error) => {
  logger.error('Queue error', { error: error.message });
});

/**
 * Add workflow execution job to queue
 */
async function addWorkflowJob(data) {
  const job = await workflowQueue.add(data, {
    jobId: data.executionId, // Use execution ID as job ID for idempotency
    timeout: (data.config?.timeout_seconds || 1800) * 1000, // Convert to ms
    attempts: data.config?.retry_count || 3
  });

  logger.info('Job added to queue', {
    job_id: job.id,
    execution_id: data.executionId,
    workflow_id: data.workflowId
  });

  return job;
}

/**
 * Get job status
 */
async function getJobStatus(jobId) {
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
    attempts: job.attemptsMade,
    data: job.data,
    returnvalue: job.returnvalue,
    failedReason: job.failedReason
  };
}

/**
 * Get queue statistics
 */
async function getQueueStats() {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    workflowQueue.getWaitingCount(),
    workflowQueue.getActiveCount(),
    workflowQueue.getCompletedCount(),
    workflowQueue.getFailedCount(),
    workflowQueue.getDelayedCount()
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + completed + failed + delayed
  };
}

/**
 * Clean old jobs
 */
async function cleanQueue(grace = 24 * 3600 * 1000) {
  await workflowQueue.clean(grace, 'completed');
  await workflowQueue.clean(grace, 'failed');
  logger.info('Queue cleaned', { grace_period_ms: grace });
}

/**
 * Graceful shutdown
 */
async function closeQueue() {
  await workflowQueue.close();
  logger.info('Workflow queue closed');
}

module.exports = {
  workflowQueue,
  addWorkflowJob,
  getJobStatus,
  getQueueStats,
  cleanQueue,
  closeQueue
};
