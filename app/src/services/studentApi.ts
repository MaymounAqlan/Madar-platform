// Student API Service
import apiClient from './api';
import type { ApiResponse, StudentProfile, JobRecommendation, SkillGapAnalysis, PaginatedResponse, StudentApplicationItem, StudentInsightsResponse } from '@/types/api.types';

export const studentApi = {
  async getProfile(): Promise<StudentProfile> {
    const response = await apiClient.get<ApiResponse<StudentProfile>>('/students/profile');
    return response.data.data;
  },

  async updateProfile(data: Partial<StudentProfile>): Promise<StudentProfile> {
    const response = await apiClient.put<ApiResponse<StudentProfile>>('/students/profile', data);
    return response.data.data;
  },

  async uploadAvatar(file: File): Promise<StudentProfile> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<ApiResponse<StudentProfile>>(
      '/students/avatar',
      formData
    );
    return response.data.data;
  },

  async uploadCoverImage(file: File): Promise<StudentProfile> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<ApiResponse<StudentProfile>>(
      '/students/cover-image',
      formData
    );
    return response.data.data;
  },

  async uploadCV(file: File): Promise<StudentProfile> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<ApiResponse<{ taskId: string; status: string }>>(
      '/students/cv-upload/async',
      formData
    );
    const taskId = response.data.data.taskId;
    // The first CV analysis can include lazy model loading and queue retries.
    const deadline = Date.now() + 5 * 60_000;
    while (Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 1_500));
      const taskResponse = await apiClient.get<ApiResponse<{
        status: 'queued' | 'processing' | 'retrying' | 'completed' | 'failed';
        failedReason?: string;
        result?: { cvUrl: string; parsedData: any };
      }>>(`/matching/tasks/${encodeURIComponent(taskId)}`);
      const task = taskResponse.data.data;
      if (task.status === 'completed' && task.result) return this.getProfile();
      if (task.status === 'failed') throw new Error(task.failedReason || 'CV analysis failed');
    }
    throw new Error('CV analysis is still processing. Refresh the profile shortly to see the result.');
  },

  async getRecommendedJobs(params?: { jobId?: string; page?: number; limit?: number; search?: string; type?: string; location?: string; minScore?: number; sortBy?: string }): Promise<PaginatedResponse<JobRecommendation>> {
    const response = await apiClient.get<ApiResponse<JobRecommendation[]>>(
      '/students/recommended-jobs',
      { params }
    );
    const items = Array.isArray(response.data.data) ? response.data.data : [];
    const meta = response.data.meta || {};
    const page = Number(meta.page) || 1;
    const limit = Number(meta.limit) || items.length || 1;
    const total = Number(meta.total) || items.length;
    const totalPages = Number(meta.totalPages) || Math.max(1, Math.ceil(total / limit));
    return {
      data: items,
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  },

  async getSkillGaps(params?: { page?: number; limit?: number; priority?: string; search?: string }): Promise<any> {
    const response = await apiClient.get<ApiResponse<SkillGapAnalysis>>('/students/skill-gaps', { params });
    return response.data.data;
  },

  async getApplications(params?: { page?: number; limit?: number; status?: string; search?: string }): Promise<PaginatedResponse<StudentApplicationItem>> {
    const response = await apiClient.get<ApiResponse<StudentApplicationItem[]>>('/students/applications', { params });
    const items = Array.isArray(response.data.data) ? response.data.data : [];
    const meta = response.data.meta || {};
    return {
      data: items,
      items,
      pagination: {
        page: Number(meta.page) || 1,
        limit: Number(meta.limit) || items.length || 1,
        total: Number(meta.total) || items.length,
        totalPages: Number(meta.totalPages) || 1,
        hasNext: (Number(meta.page) || 1) < (Number(meta.totalPages) || 1),
        hasPrev: (Number(meta.page) || 1) > 1,
      },
    };
  },

  async getInsights(): Promise<StudentInsightsResponse> {
    const response = await apiClient.get<ApiResponse<StudentInsightsResponse>>('/students/insights');
    return response.data.data;
  },

  async getRecommendationDashboard(): Promise<StudentInsightsResponse> {
    const response = await apiClient.get<ApiResponse<StudentInsightsResponse>>('/students/recommendation-dashboard');
    return response.data.data;
  },

  async getLearningPaths(): Promise<{
    learningPaths: StudentInsightsResponse['careerPaths'];
    resources: StudentInsightsResponse['learningResources'];
    skillsToImprove: StudentInsightsResponse['skillGaps'];
  }> {
    const response = await apiClient.get<ApiResponse<{
      learningPaths: StudentInsightsResponse['careerPaths'];
      resources: StudentInsightsResponse['learningResources'];
      skillsToImprove: StudentInsightsResponse['skillGaps'];
    }>>('/students/learning-paths');
    return response.data.data;
  },

  async getCareerDomains(): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>('/students/career-domains');
    return response.data.data;
  },

  async getMarketIntelligence(): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>('/students/market-intelligence');
    return response.data.data;
  },

  async getFutureSkills(): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>('/students/future-skills');
    return response.data.data;
  },

  async refreshRecommendations(): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>('/students/recommendations/refresh');
    return response.data.data;
  },

  async getNotifications(params?: { page?: number; limit?: number; type?: string; read?: boolean }): Promise<PaginatedResponse<any>> {
    const response = await apiClient.get<ApiResponse<any[]>>('/students/notifications', { params });
    const payload = response.data as any;
    return {
      data: response.data.data,
      items: response.data.data,
      pagination: {
        page: payload.page || 1,
        limit: payload.limit || response.data.data.length || 0,
        total: payload.total || response.data.data.length || 0,
        totalPages: payload.totalPages || Math.max(1, Math.ceil((payload.total || response.data.data.length || 0) / (payload.limit || response.data.data.length || 1))),
        hasNext: (payload.page || 1) < (payload.totalPages || 1),
        hasPrev: (payload.page || 1) > 1,
      },
    };
  },

  async markNotificationRead(notificationId: string): Promise<any> {
    const response = await apiClient.patch<ApiResponse<any>>(`/notifications/${notificationId}/read`);
    return response.data.data;
  },
};
