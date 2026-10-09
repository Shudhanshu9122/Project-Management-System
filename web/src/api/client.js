const BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');




const TOKEN_KEY = 'proshu.token';



const SESSION_CODES = new Set(['TOKEN_EXPIRED', 'INVALID_TOKEN', 'TOKEN_REVOKED']);

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details || [];
  }

  
  fieldErrors() {
    return this.details.reduce((accumulator, detail) => {
      if (detail.field && !accumulator[detail.field]) {
        accumulator[detail.field] = detail.message;
      }
      return accumulator;
    }, {});
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

let unauthorizedHandler = null;


export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

export function buildQuery(params) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    
    
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }

  const query = search.toString();
  return query ? `?${query}` : '';
}

async function request(path, { method = 'GET', body, signal } = {}) {
  const headers = {};
  const token = getToken();

  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    
    if (error.name === 'AbortError') throw error;
    throw new ApiError(0, 'NETWORK_ERROR', 'Cannot reach the server. Check your connection and try again.');
  }

  if (response.status === 204) return null;

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const apiError = payload && payload.error ? payload.error : {};
    const error = new ApiError(
      response.status,
      apiError.code || 'UNKNOWN_ERROR',
      apiError.message || 'The request could not be completed.',
      apiError.details
    );

    if (response.status === 401 && SESSION_CODES.has(error.code)) {
      clearToken();
      if (unauthorizedHandler) unauthorizedHandler(error.code);
    }

    throw error;
  }

  return payload;
}

export const api = {
  get: (path, options) => request(path, options),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
};
