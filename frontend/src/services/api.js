/**
 * Central API service for CampusCare.
 *
 * The backend URL comes from VITE_API_URL (read at build time by Vite).
 * Only variables beginning with VITE_ are available in browser code.
 * In local development the fallback is http://localhost:8080.
 * In production there is deliberately no localhost fallback.
 */
const configuredUrl = (import.meta.env.VITE_API_URL || '').trim();

export const API_BASE_URL = (
  configuredUrl || (import.meta.env.DEV ? 'http://localhost:8080' : '')
).replace(/\/+$/, '');

const TOKEN_KEY = 'campuscare_token';

export const tokenStore = {
  get() {
    return sessionStorage.getItem(TOKEN_KEY);
  },
  set(token) {
    sessionStorage.setItem(TOKEN_KEY, token);
  },
  clear() {
    sessionStorage.removeItem(TOKEN_KEY);
  },
};

export class ApiError extends Error {
  constructor(message, status = 0, fieldErrors = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

function url(path) {
  return `${API_BASE_URL}${path}`;
}

function unavailableMessage() {
  if (!API_BASE_URL) {
    return 'CAMPUSCARE API is unavailable. Configure VITE_API_URL in the frontend hosting environment.';
  }
  return `CAMPUSCARE API is unavailable. Start the Java backend or check VITE_API_URL (${API_BASE_URL}).`;
}

async function readError(response) {
  let data = null;
  try {
    data = await response.json();
  } catch {
    // Non-JSON error response.
  }
  const message =
    data?.message ||
    (response.status === 403
      ? 'You do not have permission to perform this action.'
      : 'The request could not be completed. Please try again.');
  return new ApiError(message, response.status, data?.fieldErrors || null);
}

async function request(path, { method = 'GET', body, authenticated = true } = {}) {
  const headers = { Accept: 'application/json' };
  const token = tokenStore.get();

  if (authenticated && token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  let response;
  try {
    response = await fetch(url(path), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(unavailableMessage(), 0);
  }

  if (response.status === 401 && authenticated) {
    tokenStore.clear();
    window.dispatchEvent(new Event('campuscare:unauthorized'));
  }

  if (!response.ok) {
    throw await readError(response);
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return response.text();
  }
  return response.json();
}

function queryString(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, value);
    }
  });
  const text = search.toString();
  return text ? `?${text}` : '';
}

export const api = {
  health: () => request('/api/health', { authenticated: false }),

  auth: {
    register: (payload) => request('/api/auth/register', { method: 'POST', body: payload, authenticated: false }),
    login: (payload) => request('/api/auth/login', { method: 'POST', body: payload, authenticated: false }),
    me: () => request('/api/auth/me'),
  },

  categories: {
    list: () => request('/api/categories'),
  },

  tickets: {
    create: (payload) => request('/api/tickets', { method: 'POST', body: payload }),
    myTickets: (params = {}) => request(`/api/tickets/my-tickets${queryString(params)}`),
    stats: () => request('/api/tickets/stats'),
    get: (id) => request(`/api/tickets/${id}`),
    history: (id) => request(`/api/tickets/${id}/history`),
    comments: (id) => request(`/api/tickets/${id}/comments`),
  },

  admin: {
    dashboard: () => request('/api/admin/dashboard'),
    tickets: (params = {}) => request(`/api/admin/tickets${queryString(params)}`),
    ticket: (id) => request(`/api/admin/tickets/${id}`),
    updateStatus: (id, payload) => request(`/api/admin/tickets/${id}/status`, { method: 'PUT', body: payload }),
    assign: (id, payload) => request(`/api/admin/tickets/${id}/assign`, { method: 'PUT', body: payload }),
    addComment: (id, payload) => request(`/api/admin/tickets/${id}/comments`, { method: 'POST', body: payload }),
    admins: () => request('/api/admin/admins'),
    categories: () => request('/api/admin/categories'),
    exportTickets: (params = {}) => downloadCsv(`/api/admin/tickets/export${queryString(params)}`, 'campuscare-tickets.csv'),
  },

  mainAdmin: {
    dashboard: () => request('/api/main-admin/dashboard'),
    users: (params = {}) => request(`/api/main-admin/users${queryString(params)}`),
    createAdmin: (payload) => request('/api/main-admin/admins', { method: 'POST', body: payload }),
    updateUserStatus: (id, active) =>
      request(`/api/main-admin/users/${id}/status`, { method: 'PUT', body: { active } }),
    reports: (params = {}) => request(`/api/main-admin/reports${queryString(params)}`),
    exportReport: (params = {}) =>
      downloadCsv(`/api/main-admin/reports/export${queryString(params)}`, 'campuscare-report.csv'),
    categories: () => request('/api/main-admin/categories'),
    createCategory: (payload) => request('/api/main-admin/categories', { method: 'POST', body: payload }),
    updateCategory: (id, payload) =>
      request(`/api/main-admin/categories/${id}`, { method: 'PUT', body: payload }),
  },

  ai: {
    suggest: (payload) => request('/api/ai/suggest', { method: 'POST', body: payload }),
  },
};

/** Downloads a protected CSV endpoint using the JWT header, then saves it as a file. */
export async function downloadCsv(path, fallbackFilename) {
  const token = tokenStore.get();
  let response;
  try {
    response = await fetch(url(path), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch {
    throw new ApiError(unavailableMessage(), 0);
  }

  if (response.status === 401) {
    tokenStore.clear();
    window.dispatchEvent(new Event('campuscare:unauthorized'));
  }
  if (!response.ok) {
    throw await readError(response);
  }

  const disposition = response.headers.get('content-disposition') || '';
  const match = disposition.match(/filename="?([^";]+)"?/i);
  const filename = match?.[1] || fallbackFilename;
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}
