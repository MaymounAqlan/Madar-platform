// ============================================
// University Portal Hooks - React Query + API
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { universityApi } from '@/services';
import { getAccessToken } from '@/services/api';
import type {
  CreateCollegeRequest,
  CreateDepartmentRequest,
  UniversityStudentQuery,
  UpdateCollegeRequest,
  UpdateDepartmentRequest,
  UpdateUniversityProfileRequest,
  UniversityStaffQuery,
  InviteUniversityStaffRequest,
  UpdateUniversityStaffRequest,
  UpdateStaffProfileRequest,
} from '@/types/university.types';

const UNIVERSITY_KEY = 'university';
const AUTH_KEY = 'auth';

export function useUniversityStatus(enabled = false) {
  return useQuery({
    queryKey: [UNIVERSITY_KEY, 'status'],
    queryFn: () => universityApi.getStatus(),
    enabled: enabled && !!getAccessToken(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

export function useInstitutionalAccess(enabled = false) {
  return useQuery({
    queryKey: [UNIVERSITY_KEY, 'my-access'],
    queryFn: () => universityApi.getMyAccess(),
    enabled: enabled && !!getAccessToken(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

export function useMyStaffProfile(enabled = false) {
  return useQuery({
    queryKey: [UNIVERSITY_KEY, 'staff', 'me', 'profile'],
    queryFn: () => universityApi.getMyStaffProfile(),
    enabled: enabled && !!getAccessToken(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

export function useUpdateMyStaffProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateStaffProfileRequest) => universityApi.updateMyStaffProfile(data),
    retry: false,
    onSuccess: (profile) => {
      queryClient.setQueryData([UNIVERSITY_KEY, 'staff', 'me', 'profile'], profile);
      queryClient.invalidateQueries({ queryKey: [AUTH_KEY, 'me'] });
    },
  });
}

export function useUniversityProfile(enabled = false) {
  return useQuery({
    queryKey: [UNIVERSITY_KEY, 'profile'],
    queryFn: () => universityApi.getProfile(),
    enabled: enabled && !!getAccessToken(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

export function useUpdateUniversityProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateUniversityProfileRequest) => universityApi.updateProfile(data),
    retry: false,
    onSuccess: (profile) => {
      queryClient.setQueryData([UNIVERSITY_KEY, 'profile'], profile);
      queryClient.invalidateQueries({ queryKey: [UNIVERSITY_KEY, 'dashboard'] });
    },
  });
}

export function useUniversityDashboard(enabled = false) {
  return useQuery({
    queryKey: [UNIVERSITY_KEY, 'dashboard'],
    queryFn: () => universityApi.getDashboard(),
    enabled: enabled && !!getAccessToken(),
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

export function useUniversityStructure(enabled = false) {
  return useQuery({
    queryKey: [UNIVERSITY_KEY, 'structure'],
    queryFn: () => universityApi.getStructure(),
    enabled: enabled && !!getAccessToken(),
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

export function useUpdateStructure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => universityApi.updateStructure(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [UNIVERSITY_KEY, 'structure'] });
    },
  });
}

export function useCreateCollege() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCollegeRequest) => universityApi.createCollege(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [UNIVERSITY_KEY, 'structure'] });
      queryClient.invalidateQueries({ queryKey: [UNIVERSITY_KEY, 'dashboard'] });
    },
  });
}

export function useUpdateCollege() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ collegeId, data }: { collegeId: string; data: UpdateCollegeRequest }) => universityApi.updateCollege(collegeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [UNIVERSITY_KEY, 'structure'] });
      queryClient.invalidateQueries({ queryKey: [UNIVERSITY_KEY, 'dashboard'] });
    },
  });
}

export function useRestoreCollege() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (collegeId: string) => universityApi.restoreCollege(collegeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [UNIVERSITY_KEY, 'structure'] });
      queryClient.invalidateQueries({ queryKey: [UNIVERSITY_KEY, 'dashboard'] });
    },
  });
}

export function useArchiveCollege() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (collegeId: string) => universityApi.archiveCollege(collegeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [UNIVERSITY_KEY, 'structure'] });
      queryClient.invalidateQueries({ queryKey: [UNIVERSITY_KEY, 'dashboard'] });
    },
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ collegeId, data }: { collegeId: string; data: CreateDepartmentRequest }) => universityApi.createDepartment(collegeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [UNIVERSITY_KEY, 'structure'] });
      queryClient.invalidateQueries({ queryKey: [UNIVERSITY_KEY, 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: [UNIVERSITY_KEY, 'students'] });
    },
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ departmentId, data }: { departmentId: string; data: UpdateDepartmentRequest }) => universityApi.updateDepartment(departmentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [UNIVERSITY_KEY, 'structure'] });
      queryClient.invalidateQueries({ queryKey: [UNIVERSITY_KEY, 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: [UNIVERSITY_KEY, 'students'] });
    },
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (departmentId: string) => universityApi.deleteDepartment(departmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [UNIVERSITY_KEY, 'structure'] });
      queryClient.invalidateQueries({ queryKey: [UNIVERSITY_KEY, 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: [UNIVERSITY_KEY, 'students'] });
    },
  });
}

export function useRestoreDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (departmentId: string) => universityApi.restoreDepartment(departmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [UNIVERSITY_KEY, 'structure'] });
      queryClient.invalidateQueries({ queryKey: [UNIVERSITY_KEY, 'dashboard'] });
    },
  });
}

export function useUniversityStudents(params?: UniversityStudentQuery, enabled = false) {
  return useQuery({
    queryKey: [UNIVERSITY_KEY, 'students', params],
    queryFn: () => universityApi.getStudents(params),
    enabled: enabled && !!getAccessToken(),
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

export function useUniversityStudentStatistics(enabled = false) {
  return useQuery({
    queryKey: [UNIVERSITY_KEY, 'students', 'statistics'],
    queryFn: () => universityApi.getStudentStatistics(),
    enabled: enabled && !!getAccessToken(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

export function useReviewStudentAffiliation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ studentId, action, reason }: { studentId: string; action: 'verify' | 'reject' | 'suspend' | 'mark-graduated'; reason?: string }) => universityApi.reviewAffiliation(studentId, action, reason),
    retry: false,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [UNIVERSITY_KEY, 'students'] });
      queryClient.invalidateQueries({ queryKey: [UNIVERSITY_KEY, 'dashboard'] });
    },
  });
}

export function useUniversityAnalytics(enabled = false) {
  return useQuery({
    queryKey: [UNIVERSITY_KEY, 'analytics'],
    queryFn: () => universityApi.getAnalytics(),
    enabled: enabled && !!getAccessToken(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

export function useUniversityStaff(params?: UniversityStaffQuery, enabled = false) {
  return useQuery({
    queryKey: [UNIVERSITY_KEY, 'staff', params],
    queryFn: () => universityApi.getStaff(params),
    enabled: enabled && !!getAccessToken(),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

export function useInviteUniversityStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: InviteUniversityStaffRequest) => universityApi.inviteStaff(data),
    retry: false,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [UNIVERSITY_KEY, 'staff'] }),
  });
}

export function useUpdateUniversityStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUniversityStaffRequest }) => universityApi.updateStaff(id, data),
    retry: false,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [UNIVERSITY_KEY, 'staff'] });
      queryClient.invalidateQueries({ queryKey: [UNIVERSITY_KEY, 'my-access'] });
    },
  });
}

export function useUpdateUniversityStaffStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'inactive' }) => universityApi.updateStaffStatus(id, status),
    retry: false,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [UNIVERSITY_KEY, 'staff'] }),
  });
}

export function useResendUniversityStaffInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => universityApi.resendStaffInvitation(id),
    retry: false,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [UNIVERSITY_KEY, 'staff'] }),
  });
}

export function useCancelUniversityStaffInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => universityApi.cancelStaffInvitation(id),
    retry: false,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [UNIVERSITY_KEY, 'staff'] }),
  });
}

export function useUniversityCollegeComparison(enabled = false) {
  return useQuery({
    queryKey: [UNIVERSITY_KEY, 'college-comparison'],
    queryFn: () => universityApi.getCollegeComparison(),
    enabled: enabled && !!getAccessToken(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

export function useUniversityDepartmentComparison(enabled = false) {
  return useQuery({
    queryKey: [UNIVERSITY_KEY, 'department-comparison'],
    queryFn: () => universityApi.getDepartmentComparison(),
    enabled: enabled && !!getAccessToken(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

export function useUniversityMarketTrends(enabled = false) {
  return useQuery({
    queryKey: [UNIVERSITY_KEY, 'market-trends'],
    queryFn: () => universityApi.getMarketTrends(),
    enabled: enabled && !!getAccessToken(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}
