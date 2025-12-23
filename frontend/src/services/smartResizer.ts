/**
 * Smart Resizer API Service
 *
 * API client for Smart Resizer workflow
 */

import api from './api';

export interface CreateJobRequest {
  masterImage: File;
  formats: string[];
  quality?: 'fast' | 'balanced' | 'quality';
}

export interface CreateJobResponse {
  success: boolean;
  data: {
    jobId: string;
    bullJobId: string;
    status: string;
    formatsRequested: string[];
    masterImageUrl: string;
    createdAt: string;
  };
}

export interface JobStatusResponse {
  success: boolean;
  data: {
    job: {
      id: string;
      status: string;
      masterImageUrl: string;
      formatsRequested: string[];
      detectedContent: any;
      createdAt: string;
      completedAt: string | null;
    };
    progress: {
      total: number;
      completed: number;
      failed: number;
      pending: number;
      percent: number;
    };
    results: Array<{
      id: string;
      format_name: string;
      platform: string;
      width: number;
      height: number;
      result_url: string | null;
      status: string;
      error_message: string | null;
      processing_time_ms: number;
    }>;
  };
}

export interface FormatsResponse {
  success: boolean;
  data: {
    formats: Array<{
      key: string;
      width: number;
      height: number;
      ratio: string;
      platform: string;
      description: string;
      usage: string;
    }>;
    packs: {
      meta: string[];
      google: string[];
      dooh: string[];
      full: string[];
    };
    totalCount: number;
  };
}

/**
 * Create new Smart Resizer job
 */
export async function createJob(data: CreateJobRequest): Promise<CreateJobResponse> {
  const formData = new FormData();
  formData.append('masterImage', data.masterImage);
  formData.append('formats', JSON.stringify(data.formats));
  if (data.quality) {
    formData.append('quality', data.quality);
  }

  const response = await api.post<CreateJobResponse>('/smart-resizer/jobs', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}

/**
 * Get job status and results
 */
export async function getJobStatus(jobId: string): Promise<JobStatusResponse> {
  const response = await api.get<JobStatusResponse>(`/smart-resizer/jobs/${jobId}`);
  return response.data;
}

/**
 * List available format presets
 */
export async function getFormats(platform?: string): Promise<FormatsResponse> {
  const params = platform ? { platform } : {};
  const response = await api.get<FormatsResponse>('/smart-resizer/formats', { params });
  return response.data;
}

/**
 * Retry failed formats
 */
export async function retryJob(jobId: string): Promise<any> {
  const response = await api.post(`/smart-resizer/jobs/${jobId}/retry`);
  return response.data;
}
