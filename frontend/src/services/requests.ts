import api from './api';

interface CreateWorkflowRequestData {
  name: string;
  description: string;
  requirements?: string;
}

export const requestService = {
  create: (data: CreateWorkflowRequestData): Promise<any> =>
    api.post('/v1/workflow-requests', data),

  list: (): Promise<any> =>
    api.get('/v1/workflow-requests'),

  get: (id: string): Promise<any> =>
    api.get(`/v1/workflow-requests/${id}`),
};
