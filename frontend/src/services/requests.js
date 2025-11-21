import api from './api'

export const requestService = {
  create: (data) => api.post('/v1/workflow-requests', data),
  list: () => api.get('/v1/workflow-requests'),
  get: (id) => api.get(`/v1/workflow-requests/${id}`),
}
