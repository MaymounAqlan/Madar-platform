// Company API Service
import apiClient from './api';
import type { ApiResponse, Job, Candidate, Application, PaginatedResponse } from '@/types/api.types';

type CompanyListEnvelope<T> = {
  data?: T[];
  items?: T[];
  candidates?: T[];
  applications?: T[];
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
};

type CompanyMetric = Record<string, unknown>;

export type CompanyProfilePayload = Record<string, unknown> & {
  _id?: string;
  id?: string;
  profile?: {
    name?: string;
    legalName?: string;
    description?: string;
    industry?: string;
    subIndustries?: string[];
    website?: string;
    logoUrl?: string;
    coverImageUrl?: string;
    companySize?: string;
  };
  headquarters?: {
    city?: string;
    country?: string;
    address?: string;
    coordinates?: {
      lat?: number;
      lng?: number;
    };
  };
  contactInfo?: {
    email?: string;
    phone?: string;
    hrEmail?: string;
    linkedIn?: string;
    twitter?: string;
    github?: string;
    portfolio?: string;
    facebook?: string;
    instagram?: string;
    youtube?: string;
    behance?: string;
    dribbble?: string;
    stackOverflow?: string;
    researchGate?: string;
    orcid?: string;
  };
  culture?: {
    values?: string[];
    benefits?: string[];
    workEnvironment?: string;
    diversityStatement?: string;
  };
};

type CompanyDashboardPayload = Record<string, unknown> & {
  data?: CompanyDashboardPayload;
  metrics?: CompanyMetric[];
  jobs?: CompanyMetric[];
  candidates?: CompanyMetric[];
  upcomingInterviews?: CompanyMetric[];
  funnel?: CompanyMetric[];
  newApplicants?: number;
  welcomeTitle?: string;
  welcomeTitleAr?: string;
  welcomeSubtitle?: string;
  welcomeSubtitleAr?: string;
};

type CompanyAnalyticsPayload = Record<string, unknown> & {
  data?: CompanyAnalyticsPayload;
  metrics?: CompanyMetric;
  monthlyApplications?: CompanyMetric[];
  trends?: CompanyMetric[];
  topSkills?: CompanyMetric[];
  candidateSources?: CompanyMetric[];
  timeToFill?: CompanyMetric[];
  funnel?: CompanyMetric[];
  qualityDistribution?: CompanyMetric[];
};

const toPaginatedResponse = <T>(result: CompanyListEnvelope<T>, key?: 'candidates' | 'applications'): PaginatedResponse<T> => {
  const items = result.data || result.items || (key ? result[key] : undefined) || [];
  const page = result.page || 1;
  const totalPages = result.totalPages || 1;

  return {
    data: items,
    items,
    pagination: {
      page,
      limit: result.limit || 20,
      total: result.total || 0,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

export const companyApi = {
  async getProfile(): Promise<CompanyProfilePayload> {
    const response = await apiClient.get<ApiResponse<CompanyProfilePayload>>('/companies/profile');
    return response.data.data;
  },

  async updateProfile(data: Record<string, unknown>): Promise<CompanyProfilePayload> {
    const response = await apiClient.put<ApiResponse<CompanyProfilePayload>>('/companies/profile', data);
    return response.data.data;
  },

  async getDashboard(): Promise<CompanyDashboardPayload> {
    const response = await apiClient.get<ApiResponse<CompanyDashboardPayload>>('/companies/dashboard');
    return response.data.data;
  },

  async getJobs(params?: { status?: string; page?: number; limit?: number }): Promise<PaginatedResponse<Job>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Job> | Job[]>>('/companies/jobs', { params });
    const result = response.data.data;
    return Array.isArray(result) ? toPaginatedResponse<Job>({ data: result, total: result.length }) : result;
  },

  async createJob(data: Partial<Job>): Promise<Job> {
    const response = await apiClient.post<ApiResponse<Job>>('/companies/jobs', data);
    return response.data.data;
  },

  async generateSampleJobs(): Promise<{ created: number; jobs: Job[] }> {
    const response = await apiClient.post<ApiResponse<{ created: number; jobs: Job[] }>>('/companies/sample-jobs');
    return response.data.data;
  },

  async uploadImage(file: File): Promise<{ url: string; filename: string; size: number; mimetype: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<ApiResponse<{ url: string; filename: string; size: number; mimetype: string }>>(
      '/companies/upload-image',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return response.data.data;
  },

  async updateJob(id: string, data: Partial<Job>): Promise<Job> {
    const response = await apiClient.put<ApiResponse<Job>>(`/companies/jobs/${id}`, data);
    return response.data.data;
  },

  async deleteJob(id: string): Promise<void> {
    await apiClient.delete(`/companies/jobs/${id}`);
  },

  async getCandidates(params?: { jobId?: string; search?: string; page?: number; limit?: number }): Promise<PaginatedResponse<Candidate>> {
    const response = await apiClient.get<ApiResponse<CompanyListEnvelope<Candidate>>>('/companies/candidates', { params });
    return toPaginatedResponse(response.data.data, 'candidates');
  },

  async getApplications(params?: { jobId?: string; status?: string; page?: number; limit?: number }): Promise<PaginatedResponse<Application>> {
    const response = await apiClient.get<ApiResponse<CompanyListEnvelope<Application>>>('/companies/applications', { params });
    return toPaginatedResponse(response.data.data, 'applications');
  },

  async updateApplicationStatus(id: string, status: string, note?: string): Promise<void> {
    await apiClient.put(`/companies/applications/${id}`, { status, note });
  },

  async getAnalytics(period?: string): Promise<CompanyAnalyticsPayload> {
    const response = await apiClient.get<ApiResponse<CompanyAnalyticsPayload>>('/companies/analytics', { params: { period } });
    return response.data.data;
  },

  async forceMatchCheck(jobId: string, studentId: string): Promise<void> {
    await apiClient.post(`/matching/job/${jobId}/student/${studentId}/calculate`);
  },
};
