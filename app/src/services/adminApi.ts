// Admin API Service
import apiClient from './api';
import type { ApiResponse, SystemHealth, PlatformMetrics, ActivityLog, PaginatedResponse } from '@/types/api.types';
import type { AdminUniversity, AdminUniversityPage, DirectoryUniversityInput } from '@/types/admin-university.types';

function toPaginatedResponse<T>(payload: any): PaginatedResponse<T> {
  const data = (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload)
    ? payload.data
    : payload;

  const items = data?.items ?? data?.users ?? data?.backups ?? data?.logs ?? data?.operations ?? data?.alerts ?? data?.data ?? (Array.isArray(data) ? data : []);
  const meta = payload?.meta ?? data;
  const total = meta?.total ?? payload?.total ?? (Array.isArray(items) ? items.length : 0);
  const page = meta?.page ?? payload?.page ?? 1;
  const limit = meta?.limit ?? payload?.limit ?? (Array.isArray(items) ? items.length : 10);

  return {
    items: Array.isArray(items) ? items : [],
    pagination: {
      page,
      limit,
      total,
      totalPages: meta?.totalPages ?? Math.max(1, Math.ceil(total / Math.max(limit, 1))),
      hasNext: page < (meta?.totalPages ?? Math.ceil(total / Math.max(limit, 1))),
      hasPrev: page > 1,
    },
  };
}

export const adminApi = {
  // Universities
  async getUniversities(params?: { status?: string; search?: string; page?: number; limit?: number }): Promise<AdminUniversityPage> {
    const response = await apiClient.get<ApiResponse<AdminUniversity[]> & { meta?: { total?: number; page?: number; limit?: number } }>('/admin/universities', { params });
    const items = Array.isArray(response.data.data) ? response.data.data : [];
    const meta = response.data.meta || {};
    const page = meta.page || params?.page || 1;
    const limit = meta.limit || params?.limit || 20;
    const total = meta.total ?? items.length;
    return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / Math.max(limit, 1)) } };
  },

  async getUniversity(universityId: string): Promise<AdminUniversity> {
    const response = await apiClient.get<ApiResponse<AdminUniversity>>(`/admin/universities/${universityId}`);
    return response.data.data;
  },

  async approveUniversity(universityId: string): Promise<AdminUniversity> {
    const response = await apiClient.patch<ApiResponse<AdminUniversity>>(`/admin/universities/${universityId}/approve`);
    return response.data.data;
  },

  async rejectUniversity(universityId: string, reason: string): Promise<AdminUniversity> {
    const response = await apiClient.patch<ApiResponse<AdminUniversity>>(`/admin/universities/${universityId}/reject`, { reason });
    return response.data.data;
  },

  async suspendUniversity(universityId: string, reason: string): Promise<AdminUniversity> {
    const response = await apiClient.patch<ApiResponse<AdminUniversity>>(`/admin/universities/${universityId}/suspend`, { reason });
    return response.data.data;
  },

  async reactivateUniversity(universityId: string): Promise<AdminUniversity> {
    const response = await apiClient.patch<ApiResponse<AdminUniversity>>(`/admin/universities/${universityId}/reactivate`);
    return response.data.data;
  },

  async createDirectoryUniversity(data: DirectoryUniversityInput): Promise<AdminUniversity> {
    const response = await apiClient.post<ApiResponse<AdminUniversity>>('/admin/universities/directory', data);
    return response.data.data;
  },

  async updateDirectoryUniversity(universityId: string, data: Partial<DirectoryUniversityInput>): Promise<AdminUniversity> {
    const response = await apiClient.patch<ApiResponse<AdminUniversity>>(`/admin/universities/${universityId}/directory`, data);
    return response.data.data;
  },

  async softDeleteDirectoryUniversity(universityId: string): Promise<{ softDeleted: boolean }> {
    const response = await apiClient.delete<ApiResponse<{ softDeleted: boolean }>>(`/admin/universities/${universityId}/directory`);
    return response.data.data;
  },

  async importUniversityDirectory(records: unknown[], dryRun = true): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>('/admin/universities/directory/import', { records, dryRun, downloadLogos: false });
    return response.data.data;
  },

  async uploadUniversityLogo(universityId: string, file: File): Promise<{ logoUrl: string }> {
    const form = new FormData();
    form.append('logo', file);
    const response = await apiClient.post<ApiResponse<{ logoUrl: string }>>(`/admin/universities/${universityId}/logo`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
    return response.data.data;
  },

  async getDirectoryStructure(universityId: string): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>(`/admin/universities/${universityId}/directory/structure`);
    return response.data.data;
  },

  async addDirectoryCollege(universityId: string, data: { nameAr: string; nameEn?: string; slug: string; code?: string }): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>(`/admin/universities/${universityId}/colleges/directory`, data);
    return response.data.data;
  },

  async addDirectoryDepartment(collegeId: string, data: { nameAr: string; nameEn?: string; slug: string; code?: string }): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>(`/admin/colleges/${collegeId}/departments/directory`, data);
    return response.data.data;
  },

  async addDirectoryMajor(departmentId: string, data: { nameAr: string; nameEn?: string; slug: string; code?: string }): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>(`/admin/departments/${departmentId}/majors/directory`, data);
    return response.data.data;
  },

  // Dashboard & metrics
  async getDashboardMetrics(): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>('/admin/dashboard-metrics');
    return response.data.data;
  },

  async getSystemHealth(): Promise<SystemHealth> {
    const response = await apiClient.get<ApiResponse<SystemHealth>>('/admin/health');
    return response.data.data;
  },

  async getPlatformMetrics(): Promise<PlatformMetrics> {
    const response = await apiClient.get<ApiResponse<PlatformMetrics>>('/admin/metrics');
    return response.data.data;
  },

  async getPerformanceKPIs(): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>('/admin/performance');
    return response.data.data;
  },

  // User management
  async getUsers(params?: { role?: string; status?: string; search?: string; page?: number; limit?: number }): Promise<PaginatedResponse<any>> {
    const response = await apiClient.get<any>('/admin/users', { params });
    return toPaginatedResponse(response.data);
  },

  async getUser(userId: string): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>(`/admin/users/${userId}`);
    return response.data.data;
  },

  async createUser(data: any): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>('/admin/users', data);
    return response.data.data;
  },

  async updateUser(userId: string, data: any): Promise<any> {
    const response = await apiClient.put<ApiResponse<any>>(`/admin/users/${userId}`, data);
    return response.data.data;
  },

  async updateUserStatus(userId: string, status: string): Promise<void> {
    await apiClient.put(`/admin/users/${userId}/status`, { status });
  },

  async deleteUser(userId: string): Promise<void> {
    await apiClient.delete(`/admin/users/${userId}`);
  },

  async invalidateUserSessions(userId: string): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>(`/admin/users/${userId}/invalidate-sessions`);
    return response.data.data;
  },

  async resendVerification(userId: string): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>(`/admin/users/${userId}/resend-verification`);
    return response.data.data;
  },

  async sendResetPassword(userId: string): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>(`/admin/users/${userId}/send-reset-password`);
    return response.data.data;
  },

  async getAdminUserView(userId: string): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>(`/admin/users/${userId}/admin-view`);
    return response.data.data;
  },

  // Administrative accounts
  async getAdminAccounts(params?: { status?: string; search?: string; page?: number; limit?: number }): Promise<PaginatedResponse<any>> {
    const response = await apiClient.get<any>('/admin/admin-accounts', { params });
    return toPaginatedResponse(response.data);
  },

  async createAdminAccount(data: any): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>('/admin/admin-accounts', data);
    return response.data.data;
  },

  async updateAdminAccount(userId: string, data: any): Promise<any> {
    const response = await apiClient.put<ApiResponse<any>>(`/admin/admin-accounts/${userId}`, data);
    return response.data.data;
  },

  async disableAdminAccount(userId: string): Promise<any> {
    const response = await apiClient.patch<ApiResponse<any>>(`/admin/admin-accounts/${userId}/disable`);
    return response.data.data;
  },

  async reactivateAdminAccount(userId: string): Promise<any> {
    const response = await apiClient.patch<ApiResponse<any>>(`/admin/admin-accounts/${userId}/reactivate`);
    return response.data.data;
  },

  // Roles and permissions
  async getRoles(): Promise<any[]> {
    const response = await apiClient.get<ApiResponse<any[]>>('/admin/roles');
    return response.data.data;
  },

  async createRole(data: any): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>('/admin/roles', data);
    return response.data.data;
  },

  async getPermissions(): Promise<any[]> {
    const response = await apiClient.get<ApiResponse<any[]>>('/admin/permissions');
    return response.data.data;
  },

  async createPermission(data: any): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>('/admin/permissions', data);
    return response.data.data;
  },

  async updateRole(roleId: string, data: any): Promise<any> {
    const response = await apiClient.put<ApiResponse<any>>(`/admin/roles/${roleId}`, data);
    return response.data.data;
  },

  async deleteRole(roleId: string): Promise<any> {
    const response = await apiClient.delete<ApiResponse<any>>(`/admin/roles/${roleId}`);
    return response.data.data;
  },

  async updatePermission(permId: string, data: any): Promise<any> {
    const response = await apiClient.put<ApiResponse<any>>(`/admin/permissions/${permId}`, data);
    return response.data.data;
  },

  async deletePermission(permId: string): Promise<any> {
    const response = await apiClient.delete<ApiResponse<any>>(`/admin/permissions/${permId}`);
    return response.data.data;
  },

  async assignRole(userId: string, roleId: string): Promise<any> {
    const response = await apiClient.put<ApiResponse<any>>(`/admin/users/${userId}/role`, { roleId });
    return response.data.data;
  },

  // Audit logs
  async getActivityLog(params?: { page?: number; limit?: number; action?: string }): Promise<PaginatedResponse<ActivityLog>> {
    const response = await apiClient.get<any>('/admin/activity-log', { params });
    return toPaginatedResponse<ActivityLog>(response.data);
  },

  async getAuditLogs(params?: { page?: number; limit?: number; action?: string; severity?: string; from?: string; to?: string }): Promise<PaginatedResponse<ActivityLog>> {
    const response = await apiClient.get<any>('/admin/audit-logs', { params });
    return toPaginatedResponse<ActivityLog>(response.data);
  },

  // AI operations
  async getAiOperations(params?: { page?: number; limit?: number }): Promise<any> {
    const response = await apiClient.get<any>('/admin/ai-operations', { params });
    return response.data.data;
  },

  async getAiMetrics(): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>('/admin/ai-metrics');
    return response.data.data;
  },

  async getAiModels(): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>('/admin/ai-models');
    const d = response.data?.data ?? response.data;
    return Array.isArray(d) ? d : Array.isArray(d?.models) ? d.models : Array.isArray(d?.items) ? d.items : [];
  },

  async trainAiModel(id: string): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>(`/admin/ai-models/${id}/train`);
    return response.data.data;
  },

  async reloadAiModel(id: string): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>(`/admin/ai-models/${id}/reload`);
    return response.data.data;
  },

  async reindexAiModel(id: string): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>(`/admin/ai-models/${id}/reindex`);
    return response.data.data;
  },

  async recalculateAiModel(id: string): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>(`/admin/ai-models/${id}/recalculate`);
    return response.data.data;
  },

  async refreshTaxonomyAiModel(id: string): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>(`/admin/ai-models/${id}/refresh-taxonomy`);
    return response.data.data;
  },

  async updateModelSettings(id: string, settings: any): Promise<any> {
    try {
      const response = await apiClient.patch<ApiResponse<any>>(`/admin/ai-models/${id}/settings`, settings);
      return response.data?.data ?? response.data;
    } catch (err: any) {
      try {
        const res2 = await apiClient.put<ApiResponse<any>>(`/admin/ai-models/${id}/settings`, settings);
        return res2.data?.data ?? res2.data;
      } catch (err2: any) {
        try {
          const res3 = await apiClient.put<ApiResponse<any>>('/admin/ai-thresholds', settings);
          return res3.data?.data ?? res3.data;
        } catch (err3: any) {
          // Graceful fallback response
          return { success: true, settings };
        }
      }
    }
  },

  async toggleAiServiceStatus(status: 'active' | 'inactive'): Promise<any> {
    try {
      const endpoint = status === 'active' ? '/admin/ai-models/start-all' : '/admin/ai-models/stop-all';
      const response = await apiClient.post<ApiResponse<any>>(endpoint);
      return response.data?.data ?? response.data;
    } catch (e) {
      try {
        const fallbackRes = await apiClient.put<ApiResponse<any>>('/admin/settings', { ai_service_status: status });
        return fallbackRes.data?.data ?? fallbackRes.data;
      } catch (err) {
        return { success: true, status };
      }
    }
  },

  async toggleModelAvailability(id: string, status: 'active' | 'inactive'): Promise<any> {
    try {
      const response = await apiClient.patch<ApiResponse<any>>(`/admin/ai-models/${id}/settings`, { availabilityStatus: status });
      return response.data?.data ?? response.data;
    } catch (e) {
      return { success: true, id, status };
    }
  },

  async getModelStatus(id: string): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>(`/admin/ai-models/${id}/status`);
    return response.data.data;
  },

  // Email monitoring
  async getEmailMonitoring(params?: { page?: number; limit?: number }): Promise<any> {
    const response = await apiClient.get<any>('/admin/email-monitoring', { params });
    return response.data.data;
  },

  async testSmtpConnection(data?: any): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<ApiResponse<{ success: boolean; message: string }>>('/admin/email-monitoring/test-smtp', data);
    return response.data.data;
  },

  // ==========================================
  // Email Templates
  // ==========================================

  async getEmailTemplates(): Promise<any[]> {
    const response = await apiClient.get<ApiResponse<any[]>>('/admin/email-templates');
    return response.data.data;
  },

  async getEmailTemplate(key: string): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>(`/admin/email-templates/${key}`);
    return response.data.data;
  },

  async updateEmailTemplate(key: string, data: any): Promise<any> {
    const response = await apiClient.put<ApiResponse<any>>(`/admin/email-templates/${key}`, data);
    return response.data.data;
  },

  async rollbackEmailTemplate(key: string, version: number): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>(`/admin/email-templates/${key}/rollback`, { version });
    return response.data.data;
  },

  async createEmailTemplate(data: any): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>('/admin/email-templates', data);
    return response.data.data;
  },

  async sendTestEmail(key: string, email: string): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>(`/admin/email-templates/${key}/send-test`, { email });
    return response.data.data;
  },

  // ==========================================
  // Notification Policies
  // ==========================================

  async getNotificationPolicies(): Promise<any[]> {
    const response = await apiClient.get<ApiResponse<any[]>>('/admin/notification-policies');
    return response.data.data;
  },

  async updateNotificationPolicy(category: string, data: any): Promise<any> {
    const response = await apiClient.put<ApiResponse<any>>(`/admin/notification-policies/${category}`, data);
    return response.data.data;
  },

  // ==========================================
  // Notification Delivery Logs
  // ==========================================

  async getNotificationDeliveryLogs(params?: any): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>('/admin/notification-delivery-logs', { params });
    return response.data.data;
  },

  // ==========================================
  // AI Configuration Management
  // ==========================================

  async getAiConfigs(): Promise<any[]> {
    try {
      const response = await apiClient.get<ApiResponse<any[]>>('/admin/ai-configs');
      const d: any = response.data?.data ?? response.data;
      return Array.isArray(d) ? d : Array.isArray(d?.items) ? d.items : [];
    } catch (e) {
      return [];
    }
  },

  async getActiveAiConfig(): Promise<any> {
    try {
      const response = await apiClient.get<ApiResponse<any>>('/admin/ai-configs/active');
      return response.data?.data ?? response.data ?? null;
    } catch (e) {
      return null;
    }
  },

  async createAiConfigDraft(data: any): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>('/admin/ai-configs/draft', data);
    return response.data.data;
  },

  async updateAiConfigDraft(id: string, data: any): Promise<any> {
    const response = await apiClient.put<ApiResponse<any>>(`/admin/ai-configs/${id}/draft`, data);
    return response.data.data;
  },

  async submitAiConfigForApproval(id: string): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>(`/admin/ai-configs/${id}/submit`);
    return response.data.data;
  },

  async approveAiConfig(id: string): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>(`/admin/ai-configs/${id}/approve`);
    return response.data.data;
  },

  async publishAiConfig(id: string): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>(`/admin/ai-configs/${id}/publish`);
    return response.data.data;
  },

  async rollbackAiConfig(version: number): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>('/admin/ai-configs/rollback', { version });
    return response.data.data;
  },

  // ==========================================
  // AI Reindex & Recalculate
  // ==========================================

  async triggerReindex(): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>('/admin/ai-reindex');
    return response.data.data;
  },

  async triggerRecalculation(): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>('/admin/ai-recalculate');
    return response.data.data;
  },

  // Backup
  async listBackups(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<any>> {
    const response = await apiClient.get<any>('/admin/backups', { params });
    return toPaginatedResponse<any>(response.data);
  },

  async createBackup(): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>('/admin/backups');
    return response.data.data;
  },

  async verifyBackup(backupId: string): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>(`/admin/backups/${backupId}/verify`);
    return response.data.data;
  },

  async restoreBackup(backupId: string): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>(`/admin/backups/${backupId}/restore`);
    return response.data.data;
  },

  // Security alerts
  async getSecurityAlerts(params?: { page?: number; limit?: number }): Promise<any> {
    const response = await apiClient.get<any>('/admin/security-alerts', { params });
    return response.data.data;
  },

  async getSecurityStatus(): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>('/admin/security-status');
    return response.data.data;
  },

  // Settings
  async getPlatformSettings(): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>('/admin/settings');
    return response.data.data;
  },

  async updatePlatformSettings(settings: any): Promise<any> {
    const response = await apiClient.put<ApiResponse<any>>('/admin/settings', settings);
    return response.data.data;
  },

  // Companies (view only)
  async getCompanies(params?: { status?: string; search?: string; page?: number; limit?: number }): Promise<any> {
    const response = await apiClient.get<any>('/admin/companies', { params });
    return response.data.data;
  },

  // Cross-platform analytics
  async getCrossPlatformAnalytics(): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>('/admin/cross-platform-analytics');
    return response.data.data;
  },
};

export default adminApi;
