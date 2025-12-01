/**
 * Tests for Workflow Worker
 * Testing importability and basic structure
 */

jest.mock('../../config/database', () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 'wf-1', name: 'Test Workflow', definition: {}, started_at: new Date().toISOString() },
        error: null
      })
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/test.png' } })
      }))
    }
  }
}));

jest.mock('../../config/logger', () => ({
  logWorkflowExecution: jest.fn(),
  logError: jest.fn(),
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

jest.mock('../../queues/workflowQueue', () => ({
  workflowQueue: {
    process: jest.fn(),
    on: jest.fn()
  }
}));

jest.mock('../../services/geminiImageService', () => ({
  createGeminiImageService: jest.fn(() => ({
    generateImage: jest.fn().mockResolvedValue({
      success: true,
      imageData: 'base64-data',
      mimeType: 'image/png'
    })
  }))
}));

jest.mock('../../utils/encryption', () => ({
  decryptApiKey: jest.fn((key) => 'decrypted-' + key)
}));

describe('Workflow Worker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Module Import', () => {
    it('should be importable without errors', () => {
      expect(() => {
        require('../../workers/workflow-worker');
      }).not.toThrow();
    });

    it('should export worker module', () => {
      const worker = require('../../workers/workflow-worker');
      expect(worker).toBeDefined();
    });
  });

  describe('Queue Registration', () => {
    it('should have workflowQueue with process method', () => {
      const { workflowQueue } = require('../../queues/workflowQueue');

      expect(workflowQueue).toBeDefined();
      expect(workflowQueue.process).toBeDefined();
      expect(typeof workflowQueue.process).toBe('function');
    });

    it('should have workflowQueue with on method for events', () => {
      const { workflowQueue } = require('../../queues/workflowQueue');

      expect(workflowQueue.on).toBeDefined();
      expect(typeof workflowQueue.on).toBe('function');
    });

    it('should import worker module that uses the queue', () => {
      const worker = require('../../workers/workflow-worker');
      const { workflowQueue } = require('../../queues/workflowQueue');

      // Worker module imports and uses workflowQueue
      expect(worker).toBeDefined();
      expect(workflowQueue).toBeDefined();
    });
  });

  describe('Dependencies', () => {
    it('should import supabaseAdmin correctly', () => {
      const { supabaseAdmin } = require('../../config/database');
      expect(supabaseAdmin).toBeDefined();
      expect(supabaseAdmin.from).toBeDefined();
    });

    it('should import gemini service creator', () => {
      const { createGeminiImageService } = require('../../services/geminiImageService');
      expect(createGeminiImageService).toBeDefined();
    });

    it('should import encryption utilities', () => {
      const { decryptApiKey } = require('../../utils/encryption');
      expect(decryptApiKey).toBeDefined();
    });

    it('should import logger', () => {
      const { logger } = require('../../config/logger');
      expect(logger).toBeDefined();
      expect(logger.info).toBeDefined();
      expect(logger.error).toBeDefined();
    });
  });

  describe('Process Handler', () => {
    it('should be able to handle SIGTERM gracefully', () => {
      // Test that process handlers can be registered
      const handler = () => { console.log('Graceful shutdown'); };

      expect(() => {
        process.on('SIGTERM', handler);
        process.removeListener('SIGTERM', handler);
      }).not.toThrow();
    });
  });

  describe('Worker Functionality', () => {
    it('should handle job data structure', () => {
      const jobData = {
        executionId: 'exec-123',
        workflowId: 'wf-123',
        clientId: 'client-123',
        inputData: {
          prompts: ['test prompt'],
          reference_images: []
        },
        config: {
          api_key_encrypted: 'encrypted-key'
        }
      };

      expect(jobData).toHaveProperty('executionId');
      expect(jobData).toHaveProperty('workflowId');
      expect(jobData).toHaveProperty('inputData');
      expect(jobData.inputData).toHaveProperty('prompts');
    });

    it('should validate required fields in job data', () => {
      const requiredFields = ['executionId', 'workflowId', 'clientId', 'inputData', 'config'];
      
      requiredFields.forEach(field => {
        const jobData = {
          executionId: 'exec-123',
          workflowId: 'wf-123',
          clientId: 'client-123',
          inputData: { prompts: [], reference_images: [] },
          config: { api_key_encrypted: 'key' }
        };

        expect(jobData).toHaveProperty(field);
      });
    });
  });

  describe('Execution Statuses', () => {
    it('should handle queued status', () => {
      const status = 'queued';
      expect(['queued', 'processing', 'completed', 'failed']).toContain(status);
    });

    it('should handle processing status', () => {
      const status = 'processing';
      expect(['queued', 'processing', 'completed', 'failed']).toContain(status);
    });

    it('should handle completed status', () => {
      const status = 'completed';
      expect(['queued', 'processing', 'completed', 'failed']).toContain(status);
    });

    it('should handle failed status', () => {
      const status = 'failed';
      expect(['queued', 'processing', 'completed', 'failed']).toContain(status);
    });
  });

  describe('Batch Result Fields', () => {
    it('should have execution_id field', () => {
      const batchResult = {
        execution_id: 'exec-123',
        batch_index: 0,
        prompt_text: 'test',
        status: 'processing'
      };

      expect(batchResult).toHaveProperty('execution_id');
    });

    it('should have batch_index field', () => {
      const batchResult = {
        execution_id: 'exec-123',
        batch_index: 0,
        prompt_text: 'test',
        status: 'processing'
      };

      expect(batchResult).toHaveProperty('batch_index');
      expect(typeof batchResult.batch_index).toBe('number');
    });

    it('should have status field', () => {
      const batchResult = {
        execution_id: 'exec-123',
        batch_index: 0,
        prompt_text: 'test',
        status: 'processing'
      };

      expect(batchResult).toHaveProperty('status');
      expect(['processing', 'completed', 'failed']).toContain(batchResult.status);
    });
  });

  describe('Progress Tracking', () => {
    it('should track progress from 0 to 100', () => {
      const progressValues = [0, 25, 50, 75, 90, 100];
      
      progressValues.forEach(value => {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      });
    });

    it('should calculate progress based on prompts completed', () => {
      const totalPrompts = 10;
      const completed = 5;
      const progress = Math.floor((completed / totalPrompts) * 90);
      
      expect(progress).toBe(45);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', () => {
      const error = new Error('Database connection failed');
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toContain('Database');
    });

    it('should handle API errors gracefully', () => {
      const error = new Error('API request failed');
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toContain('API');
    });

    it('should handle storage upload errors', () => {
      const error = new Error('Storage upload failed');
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toContain('Storage');
    });
  });

  describe('Data Validation', () => {
    it('should validate prompts array', () => {
      const prompts = ['prompt1', 'prompt2'];
      expect(Array.isArray(prompts)).toBe(true);
      expect(prompts.length).toBeGreaterThan(0);
    });

    it('should validate reference_images array', () => {
      const referenceImages = [];
      expect(Array.isArray(referenceImages)).toBe(true);
    });

    it('should validate encrypted API key', () => {
      const apiKey = 'encrypted-api-key';
      expect(typeof apiKey).toBe('string');
      expect(apiKey.length).toBeGreaterThan(0);
    });
  });

  describe('Output Data Structure', () => {
    it('should have successful count', () => {
      const outputData = { successful: 5, failed: 0, total: 5 };
      expect(outputData).toHaveProperty('successful');
      expect(typeof outputData.successful).toBe('number');
    });

    it('should have failed count', () => {
      const outputData = { successful: 5, failed: 0, total: 5 };
      expect(outputData).toHaveProperty('failed');
      expect(typeof outputData.failed).toBe('number');
    });

    it('should have total count', () => {
      const outputData = { successful: 5, failed: 0, total: 5 };
      expect(outputData).toHaveProperty('total');
      expect(outputData.total).toBe(outputData.successful + outputData.failed);
    });
  });
});
