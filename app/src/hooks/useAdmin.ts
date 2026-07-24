// ============================================
// Admin Portal Hooks - React Query + API
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/services';
import type { AdminUniversity, DirectoryUniversityInput } from '@/types/admin-university.types';

const ADMIN_KEY = 'admin';

export function useAdminUniversities(params?: { status?: string; search?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: [ADMIN_KEY, 'universities', params],
    queryFn: () => adminApi.getUniversities(params),
    staleTime: 30 * 1000,
  });
}

export function useReviewUniversity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ university, action, reason }: { university: AdminUniversity; action: 'approve' | 'reject' | 'suspend' | 'reactivate'; reason?: string }) => {
      if (action === 'approve') return adminApi.approveUniversity(university._id);
      if (action === 'reject') return adminApi.rejectUniversity(university._id, reason || '');
      if (action === 'suspend') return adminApi.suspendUniversity(university._id, reason || '');
      return adminApi.reactivateUniversity(university._id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ADMIN_KEY, 'universities'] }),
  });
}

export function useSaveDirectoryUniversity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ universityId, data }: { universityId?: string; data: DirectoryUniversityInput }) => universityId ? adminApi.updateDirectoryUniversity(universityId, data) : adminApi.createDirectoryUniversity(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ADMIN_KEY, 'universities'] }),
  });
}

export function useSoftDeleteDirectoryUniversity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (universityId: string) => adminApi.softDeleteDirectoryUniversity(universityId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ADMIN_KEY, 'universities'] }),
  });
}

export function useDashboardMetrics() {
  return useQuery({
    queryKey: [ADMIN_KEY, 'dashboard-metrics'],
    queryFn: () => adminApi.getDashboardMetrics(),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

export function useSystemHealth() {
  return useQuery({
    queryKey: [ADMIN_KEY, 'health'],
    queryFn: () => adminApi.getSystemHealth(),
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });
}

export function usePlatformMetrics() {
  return useQuery({
    queryKey: [ADMIN_KEY, 'metrics'],
    queryFn: () => adminApi.getPlatformMetrics(),
    staleTime: 2 * 60 * 1000,
    refetchInterval: 60 * 1000,
  });
}

export function usePerformanceKPIs() {
  return useQuery({
    queryKey: [ADMIN_KEY, 'performance'],
    queryFn: () => adminApi.getPerformanceKPIs(),
    staleTime: 2 * 60 * 1000,
  });
}

export function useAdminUsers(params?: { role?: string; status?: string; search?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: [ADMIN_KEY, 'users', params],
    queryFn: () => adminApi.getUsers(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: string }) =>
      adminApi.updateUserStatus(userId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_KEY, 'users'] });
      queryClient.invalidateQueries({ queryKey: [ADMIN_KEY, 'metrics'] });
      queryClient.invalidateQueries({ queryKey: [ADMIN_KEY, 'dashboard-metrics'] });
    },
  });
}

export function useCreateAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => adminApi.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_KEY, 'users'] });
      queryClient.invalidateQueries({ queryKey: [ADMIN_KEY, 'metrics'] });
      queryClient.invalidateQueries({ queryKey: [ADMIN_KEY, 'dashboard-metrics'] });
    },
  });
}

export function useUpdateAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: any }) =>
      adminApi.updateUser(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_KEY, 'users'] });
    },
  });
}

export function useDeleteAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => adminApi.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_KEY, 'users'] });
      queryClient.invalidateQueries({ queryKey: [ADMIN_KEY, 'metrics'] });
      queryClient.invalidateQueries({ queryKey: [ADMIN_KEY, 'dashboard-metrics'] });
    },
  });
}

export function useInvalidateUserSessions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => adminApi.invalidateUserSessions(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_KEY, 'users'] });
    },
  });
}

export function useResendVerification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => adminApi.resendVerification(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_KEY, 'users'] });
    },
  });
}

export function useSendResetPassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => adminApi.sendResetPassword(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_KEY, 'users'] });
    },
  });
}

export function useAdminUserView(userId?: string) {
  return useQuery({
    queryKey: [ADMIN_KEY, 'users', userId, 'admin-view'],
    queryFn: () => adminApi.getAdminUserView(userId!),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useAdminAccounts(params?: { status?: string; search?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: [ADMIN_KEY, 'admin-accounts', params],
    queryFn: () => adminApi.getAdminAccounts(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateAdminAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => adminApi.createAdminAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_KEY, 'admin-accounts'] });
      queryClient.invalidateQueries({ queryKey: [ADMIN_KEY, 'dashboard-metrics'] });
    },
  });
}

export function useUpdateAdminAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: any }) =>
      adminApi.updateAdminAccount(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_KEY, 'admin-accounts'] });
    },
  });
}

export function useDisableAdminAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => adminApi.disableAdminAccount(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_KEY, 'admin-accounts'] });
      queryClient.invalidateQueries({ queryKey: [ADMIN_KEY, 'dashboard-metrics'] });
    },
  });
}

export function useReactivateAdminAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => adminApi.reactivateAdminAccount(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_KEY, 'admin-accounts'] });
      queryClient.invalidateQueries({ queryKey: [ADMIN_KEY, 'dashboard-metrics'] });
    },
  });
}

export function useAdminRoles() {
  return useQuery({
    queryKey: [ADMIN_KEY, 'roles'],
    queryFn: () => adminApi.getRoles(),
  });
}

export function useAdminPermissions() {
  return useQuery({
    queryKey: [ADMIN_KEY, 'permissions'],
    queryFn: () => adminApi.getPermissions(),
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => adminApi.createRole(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ADMIN_KEY, 'roles'] }),
  });
}

export function useCreatePermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => adminApi.createPermission(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ADMIN_KEY, 'permissions'] }),
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, data }: { roleId: string; data: any }) => adminApi.updateRole(roleId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ADMIN_KEY, 'roles'] }),
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (roleId: string) => adminApi.deleteRole(roleId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ADMIN_KEY, 'roles'] }),
  });
}

export function useUpdatePermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ permId, data }: { permId: string; data: any }) => adminApi.updatePermission(permId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ADMIN_KEY, 'permissions'] }),
  });
}

export function useDeletePermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (permId: string) => adminApi.deletePermission(permId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ADMIN_KEY, 'permissions'] }),
  });
}

export function useAssignRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) => adminApi.assignRole(userId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_KEY, 'users'] });
      queryClient.invalidateQueries({ queryKey: [ADMIN_KEY, 'admin-accounts'] });
    },
  });
}

export function useActivityLog(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: [ADMIN_KEY, 'activity', params],
    queryFn: () => adminApi.getActivityLog(params),
    staleTime: 60 * 1000,
    refetchInterval: 30 * 1000,
  });
}

export function useAuditLogs(params?: { page?: number; limit?: number; action?: string; severity?: string }) {
  return useQuery({
    queryKey: [ADMIN_KEY, 'audit-logs', params],
    queryFn: () => adminApi.getAuditLogs(params),
    staleTime: 60 * 1000,
  });
}

export function useAiOperations(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: [ADMIN_KEY, 'ai-operations', params],
    queryFn: () => adminApi.getAiOperations(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useAiMetrics() {
  return useQuery({
    queryKey: [ADMIN_KEY, 'ai-metrics'],
    queryFn: () => adminApi.getAiMetrics(),
    staleTime: 2 * 60 * 1000,
  });
}

export function useAiModels() {
  return useQuery({
    queryKey: [ADMIN_KEY, 'ai-models'],
    queryFn: () => adminApi.getAiModels(),
    staleTime: 10 * 1000, // lower staleTime so updates are visible
  });
}

export function useTrainAiModel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.trainAiModel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_KEY, 'ai-models'] });
    },
  });
}

export function useReloadAiModel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.reloadAiModel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_KEY, 'ai-models'] });
    },
  });
}

export function useReindexAiModel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.reindexAiModel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_KEY, 'ai-models'] });
    },
  });
}

export function useRecalculateAiModel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.recalculateAiModel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_KEY, 'ai-models'] });
    },
  });
}

export function useRefreshTaxonomyAiModel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.refreshTaxonomyAiModel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_KEY, 'ai-models'] });
    },
  });
}

export function useUpdateModelSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, settings }: { id: string; settings: any }) => adminApi.updateModelSettings(id, settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_KEY, 'ai-models'] });
    },
  });
}

export function useModelStatus(id?: string, enabled: boolean = false) {
  return useQuery({
    queryKey: [ADMIN_KEY, 'ai-models', id, 'status'],
    queryFn: () => adminApi.getModelStatus(id!),
    enabled: !!id && enabled,
    refetchInterval: (query: any) => {
      const status = query?.state?.data?.lastOperationStatus;
      if (status === 'queued' || status === 'running') {
        return 2000; // Poll every 2s
      }
      return false; // Stop polling
    },
  });
}

export function useEmailMonitoring(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: [ADMIN_KEY, 'email-monitoring', params],
    queryFn: () => adminApi.getEmailMonitoring(params),
    staleTime: 60 * 1000,
  });
}

export function useTestSmtpConnection() {
  return useMutation({
    mutationFn: (data?: any) => adminApi.testSmtpConnection(data),
  });
}

// ==========================================
// Email Templates
// ==========================================

export function useEmailTemplates() {
  return useQuery({
    queryKey: [ADMIN_KEY, 'email-templates'],
    queryFn: () => adminApi.getEmailTemplates(),
    staleTime: 2 * 60 * 1000,
  });
}

export function useEmailTemplate(key?: string) {
  return useQuery({
    queryKey: [ADMIN_KEY, 'email-templates', key],
    queryFn: () => adminApi.getEmailTemplate(key!),
    enabled: !!key,
    staleTime: 60 * 1000,
  });
}

export function useUpdateEmailTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, data }: { key: string; data: any }) => adminApi.updateEmailTemplate(key, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_KEY, 'email-templates'] });
    },
  });
}

export function useRollbackEmailTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, version }: { key: string; version: number }) => adminApi.rollbackEmailTemplate(key, version),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_KEY, 'email-templates'] });
    },
  });
}

export function useCreateEmailTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => adminApi.createEmailTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_KEY, 'email-templates'] });
    },
  });
}

export function useSendTestEmail() {
  return useMutation({
    mutationFn: ({ key, email }: { key: string; email: string }) => adminApi.sendTestEmail(key, email),
  });
}

// ==========================================
// Notification Policies
// ==========================================

export function useNotificationPolicies() {
  return useQuery({
    queryKey: [ADMIN_KEY, 'notification-policies'],
    queryFn: () => adminApi.getNotificationPolicies(),
    staleTime: 2 * 60 * 1000,
  });
}

export function useUpdateNotificationPolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ category, data }: { category: string; data: any }) => adminApi.updateNotificationPolicy(category, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_KEY, 'notification-policies'] });
    },
  });
}

// ==========================================
// Notification Delivery Logs
// ==========================================

export function useNotificationDeliveryLogs(params?: any) {
  return useQuery({
    queryKey: [ADMIN_KEY, 'notification-delivery-logs', params],
    queryFn: () => adminApi.getNotificationDeliveryLogs(params),
    staleTime: 60 * 1000,
  });
}

// ==========================================
// AI Configs
// ==========================================

export function useAiConfigs() {
  return useQuery({
    queryKey: [ADMIN_KEY, 'ai-configs'],
    queryFn: () => adminApi.getAiConfigs(),
    staleTime: 2 * 60 * 1000,
    retry: false,
  });
}

export function useActiveAiConfig() {
  return useQuery({
    queryKey: [ADMIN_KEY, 'ai-configs', 'active'],
    queryFn: () => adminApi.getActiveAiConfig(),
    staleTime: 2 * 60 * 1000,
    retry: false,
  });
}

export function useCreateAiConfigDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => adminApi.createAiConfigDraft(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_KEY, 'ai-configs'] });
    },
  });
}

export function useUpdateAiConfigDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminApi.updateAiConfigDraft(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_KEY, 'ai-configs'] });
    },
  });
}

export function useSubmitAiConfigForApproval() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.submitAiConfigForApproval(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_KEY, 'ai-configs'] });
    },
  });
}

export function useApproveAiConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.approveAiConfig(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_KEY, 'ai-configs'] });
    },
  });
}

export function usePublishAiConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.publishAiConfig(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_KEY, 'ai-configs'] });
    },
  });
}

export function useRollbackAiConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (version: number) => adminApi.rollbackAiConfig(version),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_KEY, 'ai-configs'] });
    },
  });
}

export function useTriggerReindex() {
  return useMutation({
    mutationFn: () => adminApi.triggerReindex(),
  });
}

export function useTriggerRecalculation() {
  return useMutation({
    mutationFn: () => adminApi.triggerRecalculation(),
  });
}

// ==========================================
// Existing hooks continued
// ==========================================

export function useBackups(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: [ADMIN_KEY, 'backups', params],
    queryFn: () => adminApi.listBackups(params),
    staleTime: 60 * 1000,
  });
}

export function useCreateBackup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => adminApi.createBackup(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ADMIN_KEY, 'backups'] }),
  });
}

export function useVerifyBackup() {
  return useMutation({
    mutationFn: (backupId: string) => adminApi.verifyBackup(backupId),
  });
}

export function useRestoreBackup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (backupId: string) => adminApi.restoreBackup(backupId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ADMIN_KEY, 'backups'] }),
  });
}

export function useSecurityAlerts(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: [ADMIN_KEY, 'security-alerts', params],
    queryFn: () => adminApi.getSecurityAlerts(params),
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });
}

export function useSecurityStatus() {
  return useQuery({
    queryKey: [ADMIN_KEY, 'security-status'],
    queryFn: () => adminApi.getSecurityStatus(),
    staleTime: 60 * 1000,
  });
}

export function usePlatformSettings() {
  return useQuery({
    queryKey: [ADMIN_KEY, 'settings'],
    queryFn: () => adminApi.getPlatformSettings(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdatePlatformSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settings: any) => adminApi.updatePlatformSettings(settings),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ADMIN_KEY, 'settings'] }),
  });
}

export function useCompanies(params?: { status?: string; search?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: [ADMIN_KEY, 'companies', params],
    queryFn: () => adminApi.getCompanies(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useCrossPlatformAnalytics() {
  return useQuery({
    queryKey: [ADMIN_KEY, 'cross-platform-analytics'],
    queryFn: () => adminApi.getCrossPlatformAnalytics(),
    staleTime: 5 * 60 * 1000,
  });
}
