import { getApiBaseUrl } from '../services/api';

/**
 * Universal Axios-compatible fetch wrapper for PostgreSQL REST communication
 */
async function clientFetch(endpoint, method, body, headers = {}) {
  const baseUrl = getApiBaseUrl();
  // Handle endpoint path prefixes cleanly
  let cleanedPath = endpoint;
  if (cleanedPath.startsWith('/api/v1')) {
    cleanedPath = cleanedPath.replace('/api/v1', '');
  }
  const url = endpoint.startsWith('http') 
    ? endpoint 
    : `${baseUrl}${cleanedPath.startsWith('/') ? cleanedPath : '/' + cleanedPath}`;

  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };

  const token = localStorage.getItem('bmc_clerk_token') || localStorage.getItem('token');
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers: defaultHeaders,
  };

  if (body) {
    config.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  const res = await fetch(url, config);
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.message || errorJson?.error || `HTTP ${res.status}`);
  }
  const data = await res.json().catch(() => ({}));
  return { data };
}

const apiClient = {
  get: (endpoint, headers) => clientFetch(endpoint, 'GET', null, headers),
  post: (endpoint, body, headers) => clientFetch(endpoint, 'POST', body, headers),
  put: (endpoint, body, headers) => clientFetch(endpoint, 'PUT', body, headers),
  delete: (endpoint, headers) => clientFetch(endpoint, 'DELETE', null, headers),
};

export default apiClient;
