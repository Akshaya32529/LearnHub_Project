import api from './api';

/**
 * Fetch health status from backend API
 * Calls GET /api/health
 */
export const checkHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};
