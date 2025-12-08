/**
 * Centralized logging utility for workflow debugging
 * Provides detailed console logs for real-time debugging
 */

import chalk from 'chalk';
import { logger } from '../config/logger';

/**
 * Workflow start data
 */
interface WorkflowStartData {
  workflowId?: string;
  clientId?: string;
  numberOfPrompts?: number;
  hasApiKey?: boolean;
  hasReferenceImages?: boolean;
  referenceImageCount?: number;
}

/**
 * Prompt processing metadata
 */
interface PromptMetadata {
  batchId?: string;
}

/**
 * API call metadata
 */
interface ApiCallMetadata {
  model?: string;
  apiKey?: string;
  attempt?: number;
  maxAttempts?: number;
  url?: string;
  timeout?: number;
}

/**
 * API response metadata
 */
interface ApiResponseMetadata {
  status?: number;
  processingTime?: number;
  hasCandidates?: boolean;
  candidatesCount?: number;
  imageDataSize?: number;
  mimeType?: string;
}

/**
 * Storage upload metadata
 */
interface StorageUploadMetadata {
  contentType?: string;
}

/**
 * Storage success metadata
 */
interface StorageSuccessMetadata {
  uploadTime?: number;
}

/**
 * Decryption metadata
 */
interface DecryptionMetadata {
  keyLength?: number;
  error?: string;
}

/**
 * Workflow statistics
 */
interface WorkflowStats {
  totalPrompts?: number;
  successful?: number;
  failed?: number;
  totalTime?: number;
  avgTimePerPrompt?: number;
  totalCost?: number;
}

/**
 * Generic data object
 */
interface GenericData {
  [key: string]: any;
}

/**
 * Format timestamp
 */
const getTimestamp = (): string => {
  return new Date().toISOString();
};

/**
 * Log workflow start
 */
export const logWorkflowStart = (executionId: string, workflowType: string, data: WorkflowStartData = {}): void => {
  logger.debug('\n' + chalk.cyan('🚀 ========================================'));
  logger.debug(chalk.cyan('🚀 WORKFLOW STARTED: ') + chalk.bold(workflowType.toUpperCase()));
  logger.debug(chalk.cyan('🚀 ========================================'));
  logger.debug(chalk.gray(`   Timestamp: ${getTimestamp()}`));
  logger.debug(chalk.gray(`   Execution ID: ${executionId}`));
  if (data.workflowId) logger.debug(chalk.gray(`   Workflow ID: ${data.workflowId}`));
  if (data.clientId) logger.debug(chalk.gray(`   Client ID: ${data.clientId}`));
  if (data.numberOfPrompts) logger.debug(chalk.gray(`   Number of prompts: ${data.numberOfPrompts}`));
  if (data.hasApiKey !== undefined) logger.debug(chalk.gray(`   Has API key: ${data.hasApiKey ? '✓' : '✗'}`));
  if (data.hasReferenceImages !== undefined) logger.debug(chalk.gray(`   Has reference images: ${data.hasReferenceImages ? '✓' : '✗'}`));
  if (data.referenceImageCount) logger.debug(chalk.gray(`   Reference images count: ${data.referenceImageCount}`));
  logger.debug('');
};

/**
 * Log prompt processing start
 */
export const logPromptProcessing = (promptIndex: number, total: number, prompt: string, metadata: PromptMetadata = {}): void => {
  logger.debug(chalk.yellow(`📝 Processing prompt ${promptIndex}/${total}`));
  logger.debug(chalk.gray(`   Prompt: "${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}"`));
  logger.debug(chalk.gray(`   Length: ${prompt.length} chars`));
  if (metadata.batchId) logger.debug(chalk.gray(`   Batch ID: ${metadata.batchId}`));
  logger.debug('');
};

/**
 * Log API call details
 */
export const logApiCall = (service: string, payload: GenericData, metadata: ApiCallMetadata = {}): void => {
  logger.debug(chalk.blue(`🌐 Calling ${service} API...`));
  if (metadata.model) logger.debug(chalk.gray(`   Model: ${metadata.model}`));
  if (metadata.apiKey) {
    const maskedKey = metadata.apiKey.substring(0, 6) + '...' + metadata.apiKey.substring(metadata.apiKey.length - 6);
    logger.debug(chalk.gray(`   API Key: ${maskedKey} (length: ${metadata.apiKey.length})`));
  }
  if (metadata.attempt) logger.debug(chalk.gray(`   Attempt: ${metadata.attempt}/${metadata.maxAttempts || 3}`));
  if (metadata.url) logger.debug(chalk.gray(`   Endpoint: ${metadata.url}`));
  if (metadata.timeout) logger.debug(chalk.gray(`   Timeout: ${metadata.timeout}ms`));

  // Log payload structure (not full content for brevity)
  logger.debug(chalk.gray(`   Payload keys: ${Object.keys(payload).join(', ')}`));
  if (payload.contents) {
    logger.debug(chalk.gray(`   Contents parts: ${payload.contents[0]?.parts?.length || 0}`));
  }
  logger.debug('');
};

/**
 * Log API response
 */
export const logApiResponse = (service: string, response: GenericData, metadata: ApiResponseMetadata = {}): void => {
  logger.debug(chalk.green(`✅ ${service} API Response:`));
  if (metadata.status) logger.debug(chalk.gray(`   Status: ${metadata.status}`));
  if (metadata.processingTime) logger.debug(chalk.gray(`   Processing time: ${metadata.processingTime}ms`));
  if (metadata.hasCandidates !== undefined) logger.debug(chalk.gray(`   Has candidates: ${metadata.hasCandidates}`));
  if (metadata.candidatesCount) logger.debug(chalk.gray(`   Candidates count: ${metadata.candidatesCount}`));
  if (metadata.imageDataSize) logger.debug(chalk.gray(`   Image data size: ${formatBytes(metadata.imageDataSize)}`));
  if (metadata.mimeType) logger.debug(chalk.gray(`   MIME type: ${metadata.mimeType}`));

  // Log response structure
  if (response && typeof response === 'object') {
    logger.debug(chalk.gray(`   Response keys: ${Object.keys(response).join(', ')}`));
  }
  logger.debug('');
};

/**
 * Log storage upload
 */
export const logStorageUpload = (bucket: string, path: string, size: number, metadata: StorageUploadMetadata = {}): void => {
  logger.debug(chalk.blue(`💾 Uploading to Storage...`));
  logger.debug(chalk.gray(`   Bucket: ${bucket}`));
  logger.debug(chalk.gray(`   Path: ${path}`));
  logger.debug(chalk.gray(`   Size: ${formatBytes(size)}`));
  if (metadata.contentType) logger.debug(chalk.gray(`   Content-Type: ${metadata.contentType}`));
  logger.debug('');
};

/**
 * Log storage upload success
 */
export const logStorageSuccess = (publicUrl: string, metadata: StorageSuccessMetadata = {}): void => {
  logger.debug(chalk.green(`✅ Upload successful`));
  if (publicUrl) logger.debug(chalk.gray(`   Public URL: ${publicUrl}`));
  if (metadata.uploadTime) logger.debug(chalk.gray(`   Upload time: ${metadata.uploadTime}ms`));
  logger.debug('');
};

/**
 * Log database operation
 */
export const logDatabaseOperation = (operation: string, table: string, data: GenericData = {}): void => {
  logger.debug(chalk.blue(`💽 Database: ${operation} on ${table}`));
  logger.debug(chalk.gray(`   Data keys: ${Object.keys(data).join(', ')}`));
  logger.debug('');
};

/**
 * Log decryption operation
 */
export const logDecryption = (success: boolean, metadata: DecryptionMetadata = {}): void => {
  if (success) {
    logger.debug(chalk.green(`🔓 API Key decrypted successfully`));
    if (metadata.keyLength) logger.debug(chalk.gray(`   Decrypted key length: ${metadata.keyLength}`));
  } else {
    logger.debug(chalk.red(`🔒 API Key decryption failed`));
    if (metadata.error) logger.debug(chalk.red(`   Error: ${metadata.error}`));
  }
  logger.debug('');
};

/**
 * Log retry attempt
 */
export const logRetry = (attempt: number, maxAttempts: number, backoffMs: number, error: Error): void => {
  logger.debug(chalk.yellow(`⏳ Retry attempt ${attempt}/${maxAttempts}`));
  logger.debug(chalk.gray(`   Backoff delay: ${backoffMs}ms`));
  logger.debug(chalk.gray(`   Previous error: ${error.message}`));
  logger.debug('');
};

/**
 * Log success for a stage
 */
export const logSuccess = (stage: string, data: GenericData = {}): void => {
  logger.debug(chalk.green(`✅ ${stage} completed successfully`));
  Object.keys(data).forEach(key => {
    logger.debug(chalk.gray(`   ${key}: ${data[key]}`));
  });
  logger.debug('');
};

/**
 * Log error with full context
 */
export const logError = (stage: string, error: Error, context: GenericData = {}): void => {
  logger.debug('\n' + chalk.red('❌ ========================================'));
  logger.debug(chalk.red('❌ ERROR IN WORKFLOW'));
  logger.debug(chalk.red('❌ ========================================'));
  logger.debug(chalk.gray(`   Timestamp: ${getTimestamp()}`));
  logger.debug(chalk.red(`   Stage: ${stage}`));
  logger.debug(chalk.red(`   Error Message: ${error.message}`));

  // Log error details
  if ((error as any).code) logger.debug(chalk.red(`   Error Code: ${(error as any).code}`));
  if ((error as any).statusCode) logger.debug(chalk.red(`   HTTP Status: ${(error as any).statusCode}`));
  if ((error as any).status) logger.debug(chalk.red(`   Status: ${(error as any).status}`));

  // Log context
  if (Object.keys(context).length > 0) {
    logger.debug(chalk.yellow('\n   Context:'));
    Object.keys(context).forEach(key => {
      const value = context[key];
      if (key === 'apiKey' && value) {
        const maskedKey = value.substring(0, 6) + '...' + value.substring(value.length - 6);
        logger.debug(chalk.gray(`   - ${key}: ${maskedKey}`));
      } else if (key === 'prompt' && value && value.length > 100) {
        logger.debug(chalk.gray(`   - ${key}: "${value.substring(0, 100)}..."`));
      } else {
        logger.debug(chalk.gray(`   - ${key}: ${JSON.stringify(value)}`));
      }
    });
  }

  // Log stack trace
  if (error.stack) {
    logger.debug(chalk.yellow('\n   Stack Trace:'));
    logger.debug(chalk.gray(error.stack));
  }

  // Log API response if available
  if ((error as any).response) {
    logger.debug(chalk.yellow('\n   API Response:'));
    logger.debug(chalk.gray(JSON.stringify((error as any).response, null, 2)));
  }

  // Log additional error data
  if ((error as any).data) {
    logger.debug(chalk.yellow('\n   Error Data:'));
    logger.debug(chalk.gray(JSON.stringify((error as any).data, null, 2)));
  }

  logger.debug(chalk.red('\n========================================\n'));
};

/**
 * Log workflow completion
 */
export const logWorkflowComplete = (executionId: string, stats: WorkflowStats = {}): void => {
  logger.debug('\n' + chalk.green('✅ ========================================'));
  logger.debug(chalk.green('✅ WORKFLOW COMPLETED'));
  logger.debug(chalk.green('✅ ========================================'));
  logger.debug(chalk.gray(`   Timestamp: ${getTimestamp()}`));
  logger.debug(chalk.gray(`   Execution ID: ${executionId}`));

  if (stats.totalPrompts) logger.debug(chalk.gray(`   Total prompts: ${stats.totalPrompts}`));
  if (stats.successful !== undefined) logger.debug(chalk.green(`   Successful: ${stats.successful}`));
  if (stats.failed !== undefined) logger.debug(stats.failed > 0 ? chalk.red(`   Failed: ${stats.failed}`) : chalk.gray(`   Failed: ${stats.failed}`));
  if (stats.totalTime) logger.debug(chalk.gray(`   Total time: ${(stats.totalTime / 1000).toFixed(2)}s`));
  if (stats.avgTimePerPrompt) logger.debug(chalk.gray(`   Average time per prompt: ${(stats.avgTimePerPrompt / 1000).toFixed(2)}s`));
  if (stats.totalCost) logger.debug(chalk.gray(`   Total cost: $${stats.totalCost.toFixed(4)}`));

  logger.debug(chalk.green('========================================\n'));
};

/**
 * Log workflow failure
 */
export const logWorkflowFailed = (executionId: string, error: Error, stats: WorkflowStats = {}): void => {
  logger.debug('\n' + chalk.red('❌ ========================================'));
  logger.debug(chalk.red('❌ WORKFLOW FAILED'));
  logger.debug(chalk.red('❌ ========================================'));
  logger.debug(chalk.gray(`   Timestamp: ${getTimestamp()}`));
  logger.debug(chalk.gray(`   Execution ID: ${executionId}`));
  logger.debug(chalk.red(`   Error: ${error.message}`));

  if (stats.totalPrompts) logger.debug(chalk.gray(`   Total prompts: ${stats.totalPrompts}`));
  if (stats.successful !== undefined) logger.debug(chalk.green(`   Successful: ${stats.successful}`));
  if (stats.failed !== undefined) logger.debug(chalk.red(`   Failed: ${stats.failed}`));
  if (stats.totalTime) logger.debug(chalk.gray(`   Total time: ${(stats.totalTime / 1000).toFixed(2)}s`));

  logger.debug(chalk.red('========================================\n'));
};

/**
 * Format bytes to human-readable string
 */
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export {
  WorkflowStartData,
  PromptMetadata,
  ApiCallMetadata,
  ApiResponseMetadata,
  StorageUploadMetadata,
  StorageSuccessMetadata,
  DecryptionMetadata,
  WorkflowStats,
  GenericData
};
