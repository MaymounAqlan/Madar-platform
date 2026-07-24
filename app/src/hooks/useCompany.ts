// ============================================
// Company Portal Hooks - React Query + API
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyApi } from '@/services';

const COMPANY_KEY = 'company';

export function useCompanyDashboard() {
  return useQuery({
    queryKey: [COMPANY_KEY, 'dashboard'],
    queryFn: () => companyApi.getDashboard(),
    staleTime: 2 * 60 * 1000,
  });
}

export function useCompanyProfile() {
  return useQuery({
    queryKey: [COMPANY_KEY, 'profile'],
    queryFn: () => companyApi.getProfile(),
    staleTime: 2 * 60 * 1000,
  });
}

export function useUpdateCompanyProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => companyApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COMPANY_KEY, 'profile'] });
      queryClient.invalidateQueries({ queryKey: [COMPANY_KEY, 'dashboard'] });
    },
  });
}

export function useCompanyJobs(params?: { status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: [COMPANY_KEY, 'jobs', params],
    queryFn: () => companyApi.getJobs(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => companyApi.createJob(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COMPANY_KEY, 'jobs'] });
      queryClient.invalidateQueries({ queryKey: [COMPANY_KEY, 'dashboard'] });
    },
  });
}

export function useGenerateSampleJobs() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => companyApi.generateSampleJobs(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COMPANY_KEY, 'jobs'] });
      queryClient.invalidateQueries({ queryKey: [COMPANY_KEY, 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: [COMPANY_KEY, 'analytics'] });
    },
  });
}

export function useUploadCompanyImage() {
  return useMutation({
    mutationFn: (file: File) => companyApi.uploadImage(file),
  });
}

export function useUpdateJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => companyApi.updateJob(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COMPANY_KEY, 'jobs'] });
    },
  });
}

export function useDeleteJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => companyApi.deleteJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COMPANY_KEY, 'jobs'] });
      queryClient.invalidateQueries({ queryKey: [COMPANY_KEY, 'dashboard'] });
    },
  });
}

export function useCandidates(params?: { jobId?: string; search?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: [COMPANY_KEY, 'candidates', params],
    queryFn: () => companyApi.getCandidates(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useCompanyApplications(params?: { jobId?: string; status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: [COMPANY_KEY, 'applications', params],
    queryFn: () => companyApi.getApplications(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: string; note?: string }) =>
      companyApi.updateApplicationStatus(id, status, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COMPANY_KEY, 'applications'] });
      queryClient.invalidateQueries({ queryKey: [COMPANY_KEY, 'candidates'] });
      queryClient.invalidateQueries({ queryKey: [COMPANY_KEY, 'dashboard'] });
    },
  });
}

export function useCompanyAnalytics(period?: string) {
  return useQuery({
    queryKey: [COMPANY_KEY, 'analytics', period],
    queryFn: () => companyApi.getAnalytics(period),
    staleTime: 5 * 60 * 1000,
  });
}
