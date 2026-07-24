import apiClient from './api';
import type { ApiResponse, NotificationItem, PaginatedResponse } from '@/types/api.types';

export const notificationApi = {
  async getMyNotifications(params?: { page?: number; limit?: number; type?: string; read?: boolean }): Promise<PaginatedResponse<NotificationItem>> {
    const response = await apiClient.get<ApiResponse<NotificationItem[] | { data: NotificationItem[]; total: number; page: number; limit: number }>>('/notifications/mine', { params });
    const envelope: any = response.data.data;
    const items: NotificationItem[] = Array.isArray(envelope) ? envelope : Array.isArray(envelope?.data) ? envelope.data : [];
    const page = Number(envelope?.page || 1);
    const limit = Number(envelope?.limit || items.length || 20);
    const total = Number(envelope?.total ?? items.length);
    const totalPages = Math.max(1, Math.ceil(total / Math.max(1, limit)));
    return {
      data: items,
      items,
      pagination: {
        page, limit, total, totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  },

  async markRead(notificationId: string): Promise<NotificationItem> {
    const response = await apiClient.patch<ApiResponse<NotificationItem>>(`/notifications/${notificationId}/read`);
    return response.data.data;
  },

  async markAllRead(): Promise<{ matchedCount: number }> {
    const response = await apiClient.post<ApiResponse<{ matchedCount: number }>>('/notifications/mark-all-read');
    return response.data.data;
  },

  async create(data: Partial<NotificationItem>): Promise<NotificationItem> {
    const response = await apiClient.post<ApiResponse<NotificationItem>>('/notifications', data);
    return response.data.data;
  },
};
