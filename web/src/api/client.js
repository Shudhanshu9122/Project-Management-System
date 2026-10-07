const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/$/, '');

// localStorage is readable by any script on this origin. That is an accepted
// trade-off for this build; README ("Design decisions") covers the httpOnly
// cookie alternative.
const TOKEN_KEY = 'northstar.token';

// Codes the API uses when the session is gone for good. Anything else (for
// example 403 or 500) is a normal error the page should show in place.
const SESSION_CODES = new Set(['TOKEN_EXPIRED', 'INVALID_TOKEN', 'TOKEN_REVOKED']);

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details || [];
  }

  /** Maps backend field errors onto a { field: message } object for forms. */
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

/** Called by AuthContext so a dead session can clear app state and redirect. */
export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

export function buildQuery(params) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    // Empty strings mean "filter not applied", which the API also treats as
    // unset; sending them would only make URLs harder to read.
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
    // An aborted request is a navigation, not a failure to report.
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
