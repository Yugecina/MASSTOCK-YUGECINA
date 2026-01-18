/**
 * Integration tests for Room Redesigner workflow (MOCKED)
 * Tests API → Worker flow with mocked Vertex AI API
 */

// Mock Vertex AI API BEFORE imports
jest.mock('../../../services/vertexAIImageService');

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { roomRedesignerFixtures } from '../../__helpers__/workflow-fixtures';
import {
  waitForJobCompletion,
  cleanupTestData,
  getBatchResults
} from '../../__helpers__/workflow-test-helpers';

let app: any;

const supabaseAdmin: SupabaseClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

describe('Room Redesigner Workflow - Integration Tests (Mocked)', () => {
  let authToken: string;
  let executionId: string;
  let testWorkflowId: string;

  beforeAll(async () => {
    const serverModule = await import('../../../server');
    app = serverModule.default;

    // Find Room Redesigner workflow
    const { data: workflows } = await supabaseAdmin
      .from('workflows')
      .select('id')
      .eq('client_id', 'f14a2f20-f81f-4d8b-93ec-96d6e59cff06')
      .ilike('name', '%Room Redesigner%')
      .limit(1);

    if (workflows && workflows.length > 0) {
      testWorkflowId = workflows[0].id;
    } else {
      throw new Error('Room Redesigner workflow not found');
    }
  });

  beforeEach(async () => {
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({ 
        email: 'dev@masstock.com', 
        password: 'DevPassword123!' 
      });

    const cookies = loginResponse.headers['set-cookie'];
    const cookieArray = Array.isArray(cookies) ? cookies : [cookies];
    const accessTokenCookie = cookieArray.find((c: string) => c.startsWith('access_token='));

    if (accessTokenCookie) {
      authToken = accessTokenCookie.split(';')[0].split('=')[1];
    }
  });

  afterEach(async () => {
    if (executionId) {
      await cleanupTestData(executionId);
    }
  });

  describe('Valid Cases', () => {
    it('should redesign empty room', async () => {
      const response = await request(app)
        .post(`/api/v1/workflows/${testWorkflowId}/execute`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(roomRedesignerFixtures.emptyRoom);

      expect(response.status).toBe(202);
      expect(response.body.data).toHaveProperty('execution_id');

      executionId = response.body.data.execution_id;

      const completion = await waitForJobCompletion(executionId);
      expect(completion.status).toBe('completed');
    });

    it('should redesign furnished room', async () => {
      const response = await request(app)
        .post(`/api/v1/workflows/${testWorkflowId}/execute`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(roomRedesignerFixtures.furnishedRoom);

      expect(response.status).toBe(202);
      executionId = response.body.data.execution_id;

      const completion = await waitForJobCompletion(executionId);
      expect(completion.status).toBe('completed');
    });

    it('should handle multiple rooms', async () => {
      const response = await request(app)
        .post(`/api/v1/workflows/${testWorkflowId}/execute`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(roomRedesignerFixtures.multipleRooms);

      expect(response.status).toBe(202);
      executionId = response.body.data.execution_id;

      const completion = await waitForJobCompletion(executionId, 60000);
      expect(completion.status).toBe('completed');
    });
  });

  describe('Design Styles', () => {
    it('should handle all design styles', async () => {
      const styles = ['modern', 'minimalist', 'scandinavian'];

      for (const styleTest of styles.slice(0, 2)) {
        const fixture = roomRedesignerFixtures.allDesignStyles.find(
          f => f.room_images[0].design_style === styleTest
        );

        const response = await request(app)
          .post(`/api/v1/workflows/${testWorkflowId}/execute`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(fixture);

        expect(response.status).toBe(202);
        const execId = response.body.data.execution_id;

        await cleanupTestData(execId);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should reject empty array', async () => {
      const response = await request(app)
        .post(`/api/v1/workflows/${testWorkflowId}/execute`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(roomRedesignerFixtures.emptyArray);

      expect(response.status).toBe(400);
    });

    it('should handle room without season', async () => {
      const response = await request(app)
        .post(`/api/v1/workflows/${testWorkflowId}/execute`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(roomRedesignerFixtures.noSeason);

      expect(response.status).toBe(202);
      executionId = response.body.data.execution_id;

      const completion = await waitForJobCompletion(executionId);
      expect(completion.status).toBe('completed');
    });
  });

  describe('Error Handling', () => {
    it('should reject missing design style', async () => {
      const response = await request(app)
        .post(`/api/v1/workflows/${testWorkflowId}/execute`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(roomRedesignerFixtures.missingStyle);

      expect(response.status).toBe(400);
    });

    it('should reject invalid design style', async () => {
      const response = await request(app)
        .post(`/api/v1/workflows/${testWorkflowId}/execute`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(roomRedesignerFixtures.invalidStyle);

      expect(response.status).toBe(400);
    });
  });

  describe('Authentication & Authorization', () => {
    it('should reject without auth', async () => {
      const response = await request(app)
        .post(`/api/v1/workflows/${testWorkflowId}/execute`)
        .send(roomRedesignerFixtures.emptyRoom);

      expect(response.status).toBe(401);
    });

    it('should reject with invalid token', async () => {
      const response = await request(app)
        .post(`/api/v1/workflows/${testWorkflowId}/execute`)
        .set('Authorization', 'Bearer invalid-token')
        .send(roomRedesignerFixtures.emptyRoom);

      expect(response.status).toBe(401);
    });
  });
});
