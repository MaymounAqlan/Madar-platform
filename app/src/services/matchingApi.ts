// Matching API Service
import apiClient from './api';
import type { ApiResponse, MatchResult, JobRecommendation } from '@/types/api.types';

export const matchingApi = {
  async calculateMatch(jobId: string, studentId: string): Promise<MatchResult> {
    const response = await apiClient.get<ApiResponse<MatchResult>>(`/matching/job/${jobId}/student/${studentId}`);
    return response.data.data;
  },

  async getTopJobsForStudent(studentId: string, limit: number = 10): Promise<JobRecommendation[]> {
    const response = await apiClient.get<ApiResponse<JobRecommendation[]>>(`/matching/top-jobs/${studentId}`, {
      params: { limit },
    });
    return response.data.data;
  },

  async getTopCandidatesForJob(jobId: string, limit: number = 10): Promise<any[]> {
    const response = await apiClient.get<ApiResponse<any[]>>(`/matching/top-candidates/${jobId}`, {
      params: { limit },
    });
    return response.data.data;
  },
};
