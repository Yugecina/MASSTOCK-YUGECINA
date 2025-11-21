const Queue = require('bull');
const { redisConfig } = require('../config/redis');

const workflowQueue = new Queue('workflow-execution', {
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

async function addWorkflowJob(data) {
  const job = await workflowQueue.add(data, {
    jobId: data.executionId
  });
  return job;
}

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
    data: job.data,
    returnvalue: job.returnvalue,
    failedReason: job.failedReason
  };
}

module.exports = {
  workflowQueue,
  addWorkflowJob,
  getJobStatus
};
