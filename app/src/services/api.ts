// ============================================
// MADAR Platform - API Client
// Axios instance with auth, error handling, interceptors
// ============================================

import axios from 'axios';
import type { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';

// Base URL configuration
// In production, Nginx proxies /api/ to the backend
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Token storage keys
const ACCESS_TOKEN_KEY = 'madar_access_token';
const REFRESH_TOKEN_KEY = 'madar_refresh_token';

// Shared refresh promise so concurrent 401 responses trigger a single refresh
let refreshPromise: Promise<string> | null = null;

async function performTokenRefresh(): Promise<string> {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) {
    throw new Error('No refresh token');
  }

  const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
    refreshToken,
  });

  const tokens = response.data?.data?.tokens;
  if (!tokens?.accessToken) {
    throw new Error('Invalid refresh response');
  }

  setTokens(tokens.accessToken, tokens.refreshToken);
  return tokens.accessToken;
}

function normalizeErrorResponse(error: AxiosError) {
  if (error.response?.data && typeof error.response.data === 'object') {
    const data = error.response.data as any;
    let message = data.message;
    if (Array.isArray(message)) {
      message = message.join(', ');
    }
    error.response.data = {
      ...data,
      code: data.code || 'UNKNOWN_ERROR',
      message: typeof message === 'string' ? message : 'An error occurred',
    };
  }
}

function redirectToLogin() {
  // Delay slightly so parallel failing requests can settle before navigation
  setTimeout(() => {
    if (!window.location.hash.includes('/login')) {
      window.location.href = '/#/login';
    }
  }, 0);
}

// Custom API Error (kept for consumers that may import it)
export class ApiError extends Error {
  statusCode: number;
  code: string;
  details?: Record<string, string[]>;
  requestId?: string;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    details?: Record<string, string[]>,
    requestId?: string
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }
}

// Create axios instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 30000, // 30 second timeout
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors & token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    const universityStatusCodes = new Set([
      'UNIVERSITY_PENDING_APPROVAL',
      'UNIVERSITY_INACTIVE',
      'UNIVERSITY_SUSPENDED',
      'USER_INACTIVE',
      'USER_SUSPENDED',
    ]);
    const responseCode = (error.response?.data as { code?: string } | undefined)?.code;
    if (error.response?.status === 403 && responseCode && universityStatusCodes.has(responseCode)) {
      if (!window.location.hash.includes('/university/pending-approval')) {
        window.location.href = '/#/university/pending-approval';
      }
      normalizeErrorResponse(error);
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized - serialized token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // The refresh endpoint itself failed; do not loop
      if (originalRequest.url?.includes('/auth/refresh')) {
        clearAuth();
        redirectToLogin();
        normalizeErrorResponse(error);
        return Promise.reject(error);
      }

      if (!refreshPromise) {
        refreshPromise = performTokenRefresh().finally(() => {
          refreshPromise = null;
        });
      }

      try {
        const token = await refreshPromise;
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        clearAuth();
        redirectToLogin();
        normalizeErrorResponse(error);
        return Promise.reject(error);
      }
    }

    normalizeErrorResponse(error);
    return Promise.reject(error);
  }
);

// Token management helpers
export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function clearAuth(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem(ACCESS_TOKEN_KEY);
}

// Export the configured axios instance
export default apiClient;
