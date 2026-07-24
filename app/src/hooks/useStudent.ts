// ============================================
// Student Portal Hooks - React Query + API
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentApi, jobsApi, matchingApi, notificationApi } from '@/services';

const STUDENT_KEY = 'student';
const JOBS_KEY = 'jobs';
const MATCHING_KEY = 'matching';

export function useStudentProfile() {
  return useQuery({
    queryKey: [STUDENT_KEY, 'profile'],
    queryFn: () => studentApi.getProfile(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => studentApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [STUDENT_KEY, 'profile'] });
    },
  });
}

export function useUploadCV() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => studentApi.uploadCV(file),
    onSuccess: async (profile) => {
      queryClient.setQueryData([STUDENT_KEY, 'profile'], profile);
      await queryClient.invalidateQueries({ queryKey: [STUDENT_KEY, 'profile'] });
      await queryClient.refetchQueries({ queryKey: [STUDENT_KEY, 'profile'], type: 'active' });
    },
  });
}

export function useUploadStudentAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => studentApi.uploadAvatar(file),
    onSuccess: (profile) => {
      queryClient.setQueryData([STUDENT_KEY, 'profile'], profile);
      queryClient.invalidateQueries({ queryKey: [STUDENT_KEY, 'profile'] });
    },
  });
}

export function useUploadStudentCoverImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => studentApi.uploadCoverImage(file),
    onSuccess: (profile) => {
      queryClient.setQueryData([STUDENT_KEY, 'profile'], profile);
      queryClient.invalidateQueries({ queryKey: [STUDENT_KEY, 'profile'] });
    },
  });
}

export function useRecommendedJobs(params?: { jobId?: string; page?: number; limit?: number; search?: string; type?: string; location?: string; minScore?: number; sortBy?: string }) {
  return useQuery({
    queryKey: [STUDENT_KEY, 'recommended-jobs', params],
    queryFn: () => studentApi.getRecommendedJobs(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useSkillGaps(params?: { page?: number; limit?: number; priority?: string; search?: string }) {
  return useQuery({
    queryKey: [STUDENT_KEY, 'skill-gaps', params],
    queryFn: () => studentApi.getSkillGaps(params),
    staleTime: 10 * 60 * 1000,
  });
}

export function useStudentApplications(params?: { page?: number; limit?: number; status?: string; search?: string }) {
  return useQuery({
    queryKey: [STUDENT_KEY, 'applications', params],
    queryFn: () => studentApi.getApplications(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useStudentInsights() {
  return useQuery({
    queryKey: [STUDENT_KEY, 'insights'],
    queryFn: () => studentApi.getInsights(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useJobs(searchParams?: Parameters<typeof jobsApi.getStudentJobFeed>[0]) {
  return useQuery({
    queryKey: [JOBS_KEY, 'list', searchParams],
    queryFn: () => jobsApi.getStudentJobFeed(searchParams),
    staleTime: 2 * 60 * 1000,
  });
}

export function useJob(id: string) {
  return useQuery({
    queryKey: [JOBS_KEY, 'detail', id],
    queryFn: () => jobsApi.getJobById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useApplyToJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, data }: { jobId: string; data: any }) =>
      jobsApi.applyToJob(jobId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [STUDENT_KEY, 'applications'] });
      queryClient.invalidateQueries({ queryKey: [STUDENT_KEY, 'recommended-jobs'] });
      queryClient.invalidateQueries({ queryKey: [STUDENT_KEY, 'insights'] });
      queryClient.invalidateQueries({ queryKey: [JOBS_KEY] });
    },
  });
}

export function useMatchResult(jobId: string, studentId: string) {
  return useQuery({
    queryKey: [MATCHING_KEY, 'result', jobId, studentId],
    queryFn: () => matchingApi.calculateMatch(jobId, studentId),
    enabled: !!jobId && !!studentId,
  });
}

export function useNotifications(params?: { page?: number; limit?: number; type?: string; read?: boolean }) {
  return useQuery({
    queryKey: [STUDENT_KEY, 'notifications', params],
    queryFn: () => notificationApi.getMyNotifications(params),
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useRefreshRecommendations() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => studentApi.refreshRecommendations(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [STUDENT_KEY, 'recommended-jobs'] });
      queryClient.invalidateQueries({ queryKey: [STUDENT_KEY, 'skill-gaps'] });
      queryClient.invalidateQueries({ queryKey: [STUDENT_KEY, 'insights'] });
      queryClient.invalidateQueries({ queryKey: [STUDENT_KEY, 'profile'] });
    },
  });
}
