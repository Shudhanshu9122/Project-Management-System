import * as SecureStore from 'expo-secure-store';

// EXPO_PUBLIC_* values are inlined by Metro at bundle time.
// Android emulator: http://10.0.2.2:4000/api. Physical device: your LAN IP.
const BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:4000/api').replace(/\/$/, '');

const TOKEN_KEY = 'northstar.token';

// SecureStore is backed by the Android Keystore / iOS Keychain. AsyncStorage is
// deliberately not used here: it is world readable on a rooted device.
let cachedToken = null;

export async function getToken() {
  if (cachedToken === null) {
    cachedToken = (await SecureStore.getItemAsync(TOKEN_KEY)) || '';
  }
  return cachedToken || null;
}

export async function setToken(token) {
  cachedToken = token;
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken() {
  cachedToken = null;
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

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
      if (detail.field && !accumulator[detail.field]) accumulator[detail.field] = detail.message;
      return accumulator;
    }, {});
  }

  get isOffline() {
    return this.code === 'NETWORK_ERROR';
  }
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

export async function request(path, { method = 'GET', body, signal } = {}) {
  const headers = {};
  const token = await getToken();

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
    // Reachability is reported as a normal error so every screen can render an
    // offline state rather than crashing on an unhandled rejection.
    throw new ApiError(0, 'NETWORK_ERROR', 'Cannot reach the server. Check your connection.');
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
      await clearToken();
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
