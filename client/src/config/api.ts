// API Configuration
// Centralized configuration for all API endpoints

import axios from 'axios';

const normalizeBaseUrl = (rawUrl: string) => {
  const trimmed = rawUrl.replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed.slice(0, -4) : trimmed;
};

const rawApiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const rawWsBaseUrl = import.meta.env.VITE_WS_URL || 'http://localhost:8000';

export const API_BASE_URL = normalizeBaseUrl(rawApiBaseUrl);
export const WS_BASE_URL = normalizeBaseUrl(rawWsBaseUrl);

// Helper to construct API URLs
export const apiUrl = (path: string) => `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

// Common API endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH_GOOGLE: apiUrl('/api/auth/google'),
  AUTH_CLERK: apiUrl('/api/auth/clerk'),
  AUTH_CALLBACK: apiUrl('/api/auth/google/callback'),
  AUTH_ME: apiUrl('/api/auth/me'),
  AUTH_LOGOUT: apiUrl('/api/auth/logout'),

  // Knowledge Bases
  KB_LIST: apiUrl('/api/kb'),
  KB_CREATE: apiUrl('/api/kb'),
  KB_DETAIL: (id: string) => apiUrl(`/api/kb/${id}`),
  KB_DELETE: (id: string) => apiUrl(`/api/kb/${id}`),
  KB_UPLOAD: apiUrl('/api/kb/upload'),
  KB_DOC_DELETE: (docId: string) => apiUrl(`/api/kb/doc/${docId}`),

  // Chat
  CHAT_CREATE: apiUrl('/api/chat'),
  CHAT_LIST: apiUrl('/api/chat'),
  CHAT_DETAIL: (id: string) => apiUrl(`/api/chat/${id}`),
  CHAT_MESSAGE: apiUrl('/api/chat/message'),
  CHAT_FEEDBACK: apiUrl('/api/chat/feedback'),
  CHAT_REGENERATE: (messageId: string) => apiUrl(`/api/chat/regenerate/${messageId}`),
  CHAT_EXPORT: apiUrl('/api/chat/export'),

  // Tickets
  TICKETS_LIST: apiUrl('/api/tickets'),
  TICKET_CREATE: apiUrl('/api/tickets'),
  TICKET_DETAIL: (id: string) => apiUrl(`/api/tickets/${id}`),
  TICKET_UPDATE: (id: string) => apiUrl(`/api/tickets/${id}`),
  TICKET_NOTE: (id: string) => apiUrl(`/api/tickets/${id}/notes`),

  // Admin
  ADMIN_STATS: apiUrl('/api/admin/stats'),
  ADMIN_USERS: apiUrl('/api/admin/users'),
  ADMIN_CHATS: apiUrl('/api/admin/chats'),
  ADMIN_ANALYTICS: apiUrl('/api/admin/analytics'),

  // Search
  SEARCH: apiUrl('/api/search'),

  // Voice
  VOICE_TRANSCRIBE: apiUrl('/api/voice/transcribe'),
  VOICE_SYNTHESIZE: apiUrl('/api/voice/synthesize'),

  // Preferences
  PREFERENCES: apiUrl('/api/auth/preferences'),

  // AB Testing
  AB_TESTS: apiUrl('/api/ab-tests'),

  // Plugins
  PLUGINS: apiUrl('/api/plugins'),

  // Webhooks
  WEBHOOKS: apiUrl('/api/webhooks'),
};

// Create axios instance with default config
const axiosInstance = axios.create({
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 401s
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token on unauthorized
      localStorage.removeItem('auth_token');
      // Optional: Redirect to login
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Axios default config
export const axiosConfig = {
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
};

// Export the configured axios instance
export default axiosInstance;
