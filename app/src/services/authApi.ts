// ============================================
// Auth API Service
// ============================================

import apiClient, { setTokens, clearAuth } from './api';
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  UserData,
  ApiResponse,
  GoogleRegistrationRequest,
} from '@/types/api.types';

type WrappedResponse<T> = ApiResponse<T> | ApiResponse<ApiResponse<T>>;

function unwrapResponse<T>(response: WrappedResponse<T>): T {
  const data = response.data;
  if (data && typeof data === 'object' && 'data' in data) {
    return (data as ApiResponse<T>).data;
  }
  return data as T;
}

export function normalizeUser(user: UserData): UserData {
  const raw = user as UserData & { _id?: string; userType?: UserData['role']; emailVerified?: boolean; profileCompleted?: boolean };
  return {
    ...user,
    id: user.id || raw._id || '',
    role: user.role || raw.userType || 'student',
    isEmailVerified: user.isEmailVerified ?? raw.emailVerified ?? false,
    profileCompleted: user.profileCompleted ?? raw.profileCompleted ?? false,
  };
}

export function getDashboardPath(role?: string): string {
  if (role === 'admin' || role === 'super_admin') return '/admin/dashboard';
  if (role === 'company') return '/company/dashboard';
  if (role === 'university') return '/university/pending-approval';
  if (['coordinator', 'university_viewer', 'data_officer', 'quality_officer', 'academic_development_officer'].includes(role || '')) return '/university/dashboard';
  return '/student/dashboard';
}

export const authApi = {
  /**
   * Login with email and password
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<WrappedResponse<AuthResponse>>('/auth/login', data);
    const result = unwrapResponse<AuthResponse>(response.data);
    setTokens(result.tokens.accessToken, result.tokens.refreshToken);
    console.debug('[auth] login token stored', {
      hasAccessToken: Boolean(result.tokens.accessToken),
      storage: 'localStorage',
      role: result.user?.role || (result.user as any)?.userType,
    });
    return { ...result, user: normalizeUser(result.user) };
  },

  /**
   * Register new user
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<WrappedResponse<AuthResponse>>('/auth/register', data);
    const result = unwrapResponse<AuthResponse>(response.data);
    setTokens(result.tokens.accessToken, result.tokens.refreshToken);
    return { ...result, user: normalizeUser(result.user) };
  },

  async completeGoogleRegistration(data: GoogleRegistrationRequest): Promise<AuthResponse> {
    const response = await apiClient.post<WrappedResponse<AuthResponse>>('/auth/google/register', data);
    const result = unwrapResponse<AuthResponse>(response.data);
    setTokens(result.tokens.accessToken, result.tokens.refreshToken);
    return { ...result, user: normalizeUser(result.user) };
  },

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      clearAuth();
    }
  },

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<UserData> {
    const response = await apiClient.get<WrappedResponse<UserData>>('/auth/me');
    const user = normalizeUser(unwrapResponse<UserData>(response.data));
    console.debug('[auth] /auth/me response', { userId: user.id, role: user.role });
    return user;
  },

  /**
   * Update current user profile
   */
  async updateCurrentUser(data: Partial<UserData>): Promise<UserData> {
    const response = await apiClient.patch<WrappedResponse<UserData>>('/auth/me', data);
    return normalizeUser(unwrapResponse<UserData>(response.data));
  },

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const response = await apiClient.post<WrappedResponse<{
      tokens: { accessToken: string;
      refreshToken: string; };
    }>>('/auth/refresh', { refreshToken });
    const result = unwrapResponse<{ tokens: { accessToken: string; refreshToken: string } }>(response.data).tokens;
    setTokens(result.accessToken, result.refreshToken);
    return result;
  },

  /**
   * Verify email with code
   */
  async verifyEmail(code: string): Promise<void> {
    await apiClient.post('/auth/verify-email', { code });
  },

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<void> {
    await apiClient.post('/auth/forgot-password', { email });
  },

  /**
   * Reset password with token
   */
  async resetPassword(token: string, password: string): Promise<void> {
    console.debug('[auth] reset password request', {
      hasToken: Boolean(token),
      tokenLength: token?.length || 0,
      passwordLength: password?.length || 0,
      body: {
        token,
        newPassword: password,
      },
    });
    await apiClient.post('/auth/reset-password', { token, newPassword: password });
  },
};
