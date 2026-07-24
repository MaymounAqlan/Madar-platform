// ============================================
// Auth Hook - React Query + API Integration
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { authApi } from '@/services';
import { getAccessToken } from '@/services/api';
import { getTokenRole } from '@/utils/jwt';
import type { GoogleRegistrationRequest, LoginRequest, RegisterRequest } from '@/types/api.types';

const AUTH_KEY = 'auth';

const UNIVERSITY_PORTAL_ROLES = [
  'university',
  'coordinator',
  'university_viewer',
  'data_officer',
  'quality_officer',
  'academic_development_officer',
] as const;

export function useAuth() {
  const queryClient = useQueryClient();

  // Get current user
  const { data: user, isLoading, error } = useQuery({
    queryKey: [AUTH_KEY, 'me'],
    queryFn: () => authApi.getCurrentUser(),
    enabled: !!getAccessToken(),
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (result) => {
      queryClient.setQueryData([AUTH_KEY, 'me'], result.user);
      queryClient.invalidateQueries({ queryKey: [AUTH_KEY] });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: (result) => {
      queryClient.setQueryData([AUTH_KEY, 'me'], result.user);
      queryClient.invalidateQueries({ queryKey: [AUTH_KEY] });
    },
  });

  const completeGoogleRegistrationMutation = useMutation({
    mutationFn: (data: GoogleRegistrationRequest) => authApi.completeGoogleRegistration(data),
    onSuccess: (result) => {
      queryClient.setQueryData([AUTH_KEY, 'me'], result.user);
      queryClient.invalidateQueries({ queryKey: [AUTH_KEY] });
    },
  });

  // Forgot password mutation
  const forgotPasswordMutation = useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
  });

  // Update current user profile
  const updateCurrentUserMutation = useMutation({
    mutationFn: (data: Partial<Parameters<typeof authApi.updateCurrentUser>[0]>) =>
      authApi.updateCurrentUser(data),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData([AUTH_KEY, 'me'], updatedUser);
      queryClient.invalidateQueries({ queryKey: [AUTH_KEY, 'me'] });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      queryClient.clear();
      window.location.href = '/#/login';
    },
  });

  const hasToken = !!getAccessToken();
  const role = user?.role;
  const isUniversity = role === 'university';
  const isCoordinator = role === 'coordinator';
  const isUniversityPortalUser = UNIVERSITY_PORTAL_ROLES.includes(role as typeof UNIVERSITY_PORTAL_ROLES[number]);

  // If the access token's role no longer matches the server's view of the user
  // (e.g. after a role was changed or an old token is still stored), force a
  // clean re-login so that subsequent API calls use a token with the correct role.
  useEffect(() => {
    if (!isLoading && !logoutMutation.isPending && user?.role && hasToken) {
      const tokenRole = getTokenRole(getAccessToken());
      if (tokenRole && tokenRole !== user.role) {
        logoutMutation.mutate();
      }
    }
  }, [isLoading, logoutMutation.isPending, user?.role, hasToken]);

  return {
    user,
    isLoading,
    isAuthenticated: hasToken && !!user,
    hasToken,
    isAdmin: role === 'admin' || role === 'super_admin',
    isStudent: role === 'student',
    isCompany: role === 'company',
    isUniversity,
    isCoordinator,
    isUniversityPortalUser,
    error,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    completeGoogleRegistration: completeGoogleRegistrationMutation.mutateAsync,
    forgotPassword: forgotPasswordMutation.mutateAsync,
    updateCurrentUser: updateCurrentUserMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isCompletingGoogleRegistration: completeGoogleRegistrationMutation.isPending,
    isForgotPasswordLoading: forgotPasswordMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    isUpdatingCurrentUser: updateCurrentUserMutation.isPending,
  };
}

export function useUpdateCurrentUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Parameters<typeof authApi.updateCurrentUser>[0]>) =>
      authApi.updateCurrentUser(data),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData([AUTH_KEY, 'me'], updatedUser);
      queryClient.invalidateQueries({ queryKey: [AUTH_KEY, 'me'] });
    },
  });
}
