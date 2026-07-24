// Jobs API Service (public endpoints)
import apiClient from './api';
import type { ApiResponse, Job, PaginatedResponse, StudentJobFeedResponse } from '@/types/api.types';

export interface StudentJobFeedParams {
  jobId?: string;
  search?: string;
  jobTypes?: string;
  experienceLevels?: string;
  locations?: string;
  locationTypes?: string;
  companyIds?: string;
  salaryMin?: number;
  salaryMax?: number;
  minMatchScore?: number;
  sortBy?: 'match' | 'recent' | 'salary';
  page?: number;
  limit?: number;
}

export const jobsApi = {
  async getJobs(params?: {
    search?: string;
    location?: string;
    locationType?: string;
    type?: string;
    experienceLevel?: string;
    skills?: string[];
    salaryMin?: number;
    salaryMax?: number;
    page?: number;
    limit?: number;
    sort?: string;
  }): Promise<PaginatedResponse<Job>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Job>>>('/jobs', { params });
    return response.data.data;
  },

  async getJobById(id: string): Promise<Job> {
    const response = await apiClient.get<ApiResponse<Job>>(`/jobs/${id}`);
    return response.data.data;
  },

  async getStudentJobFeed(params?: StudentJobFeedParams): Promise<StudentJobFeedResponse> {
    const response = await apiClient.get<ApiResponse<StudentJobFeedResponse>>('/jobs/student/feed', { params });
    return response.data.data;
  },

  async applyToJob(jobId: string, data: { coverLetter?: string; screeningAnswers?: Array<{ question: string; answer: string }> }): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>(`/jobs/${jobId}/apply`, data);
    return response.data.data;
  },

  async getSimilarJobs(id: string): Promise<Job[]> {
    const response = await apiClient.get<ApiResponse<Job[]>>(`/jobs/${id}/similar`);
    return response.data.data;
  },
};
