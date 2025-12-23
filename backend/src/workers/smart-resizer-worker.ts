/**
 * Smart Resizer Worker
 *
 * Bull worker that processes Smart Resizer jobs asynchronously.
 * Handles image analysis, format generation, and storage uploads.
 */

import { Job } from 'bull';
import smartResizerQueue from '../queues/smartResizerQueue';
import smartResizerService, { SmartResizerJobData, SmartResizerResult } from '../services/smartResizerService';
import { logger } from '../config/logger';

/**
 * Process Smart Resizer jobs
 * Each job contains master image and list of formats to generate
 */
smartResizerQueue.process(async (job: Job<SmartResizerJobData>): Promise<SmartResizerResult> => {
  const { jobId, clientId, formatsRequested } = job.data;

  if (process.env.NODE_ENV === 'development') {
    console.log('🚀 SmartResizerWorker: Job started', {
      jobId,
      clientId,
      formatCount: formatsRequested.length,
    });
  }

  logger.info('Smart Resizer job started', {
    jobId,
    clientId,
    formatCount: formatsRequested.length,
  });

  try {
    // Process the job using smartResizerService
    const result = await smartResizerService.processJob(job.data);

    // Update job progress to 100%
    await job.progress(100);

    logger.info('Smart Resizer job completed', {
      jobId,
      status: result.status,
      successCount: result.results.filter(r => r.status === 'completed').length,
      failedCount: result.results.filter(r => r.status === 'failed').length,
      processingTimeMs: result.totalProcessingTimeMs,
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ SmartResizerWorker: Job completed', {
        jobId,
        status: result.status,
        successCount: result.results.filter(r => r.status === 'completed').length,
        failedCount: result.results.filter(r => r.status === 'failed').length,
        totalTime: `${result.totalProcessingTimeMs}ms`,
      });
    }

    return result;
  } catch (error: any) {
    logger.error('Smart Resizer job failed', {
      jobId,
      error: error.message,
      stack: error.stack,
    });

    if (process.env.NODE_ENV === 'development') {
      console.error('❌ SmartResizerWorker: Job failed', {
        jobId,
        error: error.message,
      });
    }

    throw error;
  }
});

/**
 * Event listeners
 */
smartResizerQueue.on('completed', (job: Job, result: SmartResizerResult) => {
  logger.info('Smart Resizer queue job completed', {
    jobId: job.id,
    dataJobId: result.jobId,
    status: result.status,
  });

  if (process.env.NODE_ENV === 'development') {
    console.log('🎉 SmartResizerWorker: Queue job completed', {
      queueJobId: job.id,
      jobId: result.jobId,
    });
  }
});

smartResizerQueue.on('failed', (job: Job, err: Error) => {
  logger.error('Smart Resizer queue job failed', {
    jobId: job.id,
    error: err.message,
    attemptsMade: job.attemptsMade,
    attemptsTotal: job.opts.attempts,
  });

  if (process.env.NODE_ENV === 'development') {
    console.error('❌ SmartResizerWorker: Queue job failed', {
      queueJobId: job.id,
      error: err.message,
      attempts: `${job.attemptsMade}/${job.opts.attempts}`,
    });
  }
});

smartResizerQueue.on('stalled', (job: Job) => {
  logger.warn('Smart Resizer queue job stalled', {
    jobId: job.id,
  });

  if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️  SmartResizerWorker: Queue job stalled', {
      queueJobId: job.id,
    });
  }
});

smartResizerQueue.on('progress', (job: Job, progress: number) => {
  logger.debug('Smart Resizer queue job progress', {
    jobId: job.id,
    progress: `${progress}%`,
  });

  if (process.env.NODE_ENV === 'development') {
    console.log('📊 SmartResizerWorker: Progress update', {
      queueJobId: job.id,
      progress: `${progress}%`,
    });
  }
});

logger.info('Smart Resizer worker started');

if (process.env.NODE_ENV === 'development') {
  console.log('🔧 SmartResizerWorker: Worker initialized and listening for jobs');
}

export default smartResizerQueue;
