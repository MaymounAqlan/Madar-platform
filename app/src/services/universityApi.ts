// University API Service
import apiClient from './api';
import type { ApiResponse } from '@/types/api.types';
import type {
  UniversityDashboard,
  UniversityStudentQuery,
  UniversityStudents,
  UniversityStudentStatistics,
  UniversityStructure,
  UniversityCollege,
  UniversityDepartment,
  CreateCollegeRequest,
  UpdateCollegeRequest,
  CreateDepartmentRequest,
  UpdateDepartmentRequest,
  UniversityProfileResponse,
  UpdateUniversityProfileRequest,
  UniversityStatusResponse,
  UniversityStaffList,
  UniversityStaffMember,
  UniversityStaffQuery,
  InviteUniversityStaffRequest,
  UpdateUniversityStaffRequest,
  PublicAcademicOption,
  AcademicReferencePage,
  UniversityAffiliationStudent,
  UniversityStudyPlan,
  UniversityCourse,
  CurriculumAnalysis,
  AcademicRecommendation,
  InstitutionalAccess,
  StaffProfileResponse,
  UpdateStaffProfileRequest,
  StudyPlanImportJob,
  ConfirmImportData,
} from '@/types/university.types';
import {
  adaptUniversityDashboard,
  adaptUniversityStudents,
  adaptUniversityStudentStatistics,
  adaptUniversityStructure,
} from './universityAdapters';

export const universityApi = {
  async getMyAccess(): Promise<InstitutionalAccess> { const response = await apiClient.get<ApiResponse<InstitutionalAccess>>('/universities/staff/me/access'); return response.data.data; },
  async getMyStaffProfile(): Promise<StaffProfileResponse> { const response = await apiClient.get<ApiResponse<StaffProfileResponse>>('/universities/staff/me/profile'); return response.data.data; },
  async updateMyStaffProfile(data: UpdateStaffProfileRequest): Promise<StaffProfileResponse> { const response = await apiClient.put<ApiResponse<StaffProfileResponse>>('/universities/staff/me/profile', data); return response.data.data; },
  async searchReferenceUniversities(params: { search?: string; governorate?: string; institutionType?: string; ownership?: string; page?: number; limit?: number } = {}): Promise<AcademicReferencePage> { const response = await apiClient.get<ApiResponse<AcademicReferencePage>>('/reference/universities', { params }); return response.data.data; },
  async getReferenceColleges(universityId: string, params: { search?: string; page?: number; limit?: number } = {}): Promise<AcademicReferencePage> { const response = await apiClient.get<ApiResponse<AcademicReferencePage>>(`/reference/universities/${universityId}/colleges`, { params }); return response.data.data; },
  async getReferenceDepartments(collegeId: string, params: { search?: string; page?: number; limit?: number } = {}): Promise<AcademicReferencePage> { const response = await apiClient.get<ApiResponse<AcademicReferencePage>>(`/reference/colleges/${collegeId}/departments`, { params }); return response.data.data; },
  async getReferenceMajors(departmentId: string, params: { search?: string; page?: number; limit?: number } = {}): Promise<AcademicReferencePage> { const response = await apiClient.get<ApiResponse<AcademicReferencePage>>(`/reference/departments/${departmentId}/majors`, { params }); return response.data.data; },
  async getPublicUniversities(): Promise<PublicAcademicOption[]> { return (await this.searchReferenceUniversities({ limit: 100 })).items; },
  async getPublicColleges(universityId: string): Promise<PublicAcademicOption[]> { return (await this.getReferenceColleges(universityId, { limit: 100 })).items; },
  async getPublicDepartments(collegeId: string): Promise<PublicAcademicOption[]> { return (await this.getReferenceDepartments(collegeId, { limit: 100 })).items; },
  async getStatus(): Promise<UniversityStatusResponse> {
    const response = await apiClient.get<ApiResponse<UniversityStatusResponse>>('/universities/me/status');
    return response.data.data;
  },

  async getProfile(): Promise<UniversityProfileResponse> {
    const response = await apiClient.get<ApiResponse<UniversityProfileResponse>>('/universities/profile');
    return response.data.data;
  },

  async uploadLogo(file: File): Promise<{ logoUrl: string }> {
    const form = new FormData();
    form.append('logo', file);
    const response = await apiClient.post<ApiResponse<{ logoUrl: string }>>('/universities/profile/logo', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },

  async updateProfile(data: UpdateUniversityProfileRequest): Promise<UniversityProfileResponse> {
    const response = await apiClient.put<ApiResponse<UniversityProfileResponse>>('/universities/profile', data);
    return response.data.data;
  },

  async getDashboard(): Promise<UniversityDashboard> {
    const response = await apiClient.get<ApiResponse<unknown>>('/universities/dashboard');
    return adaptUniversityDashboard(response.data.data);
  },

  async getStructure(): Promise<UniversityStructure> {
    const response = await apiClient.get<ApiResponse<unknown>>('/universities/structure');
    return adaptUniversityStructure(response.data.data);
  },

  async getColleges(params?: { page?: number; limit?: number; search?: string; includeArchived?: boolean }): Promise<unknown> {
    const response = await apiClient.get<ApiResponse<unknown>>('/universities/colleges', { params });
    return response.data.data;
  },

  async createCollege(data: CreateCollegeRequest): Promise<UniversityCollege> {
    const response = await apiClient.post<ApiResponse<UniversityCollege>>('/universities/colleges', data);
    return response.data.data;
  },

  async updateCollege(collegeId: string, data: UpdateCollegeRequest): Promise<UniversityCollege> {
    const response = await apiClient.put<ApiResponse<UniversityCollege>>(`/universities/colleges/${collegeId}`, data);
    return response.data.data;
  },

  async archiveCollege(collegeId: string): Promise<UniversityCollege> {
    const response = await apiClient.put<ApiResponse<UniversityCollege>>(`/universities/colleges/${collegeId}/archive`);
    return response.data.data;
  },

  async restoreCollege(collegeId: string): Promise<UniversityCollege> {
    const response = await apiClient.put<ApiResponse<UniversityCollege>>(`/universities/colleges/${collegeId}/restore`);
    return response.data.data;
  },

  async deleteCollege(collegeId: string): Promise<any> {
    const response = await apiClient.delete<ApiResponse<any>>(`/universities/colleges/${collegeId}`);
    return response.data.data;
  },

  async getDepartments(params?: { collegeId?: string; search?: string }): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>('/universities/departments', { params });
    return response.data.data;
  },

  async createDepartment(collegeId: string, data: CreateDepartmentRequest): Promise<UniversityDepartment> {
    const response = await apiClient.post<ApiResponse<UniversityDepartment>>(`/universities/colleges/${collegeId}/departments`, data);
    return response.data.data;
  },

  async updateDepartment(departmentId: string, data: UpdateDepartmentRequest): Promise<UniversityDepartment> {
    const response = await apiClient.put<ApiResponse<UniversityDepartment>>(`/universities/departments/${departmentId}`, data);
    return response.data.data;
  },

  async deleteDepartment(departmentId: string): Promise<any> {
    const response = await apiClient.delete<ApiResponse<any>>(`/universities/departments/${departmentId}`);
    return response.data.data;
  },

  async restoreDepartment(departmentId: string): Promise<UniversityDepartment> {
    const response = await apiClient.put<ApiResponse<UniversityDepartment>>(`/universities/departments/${departmentId}/restore`);
    return response.data.data;
  },

  async updateStructure(data: any): Promise<any> {
    const response = await apiClient.put<ApiResponse<any>>('/universities/structure', data);
    return response.data.data;
  },

  async getStudents(params?: UniversityStudentQuery): Promise<UniversityStudents> {
    const response = await apiClient.get<ApiResponse<unknown>>('/universities/students', { params });
    return adaptUniversityStudents(response.data.data);
  },

  async getStudentStatistics(): Promise<UniversityStudentStatistics> {
    const response = await apiClient.get<ApiResponse<unknown>>('/universities/students/statistics');
    return adaptUniversityStudentStatistics(response.data.data);
  },
  async getAffiliationStudent(studentId: string): Promise<UniversityAffiliationStudent> { const response = await apiClient.get<ApiResponse<UniversityAffiliationStudent>>(`/universities/students/${studentId}`); return response.data.data; },
  async reviewAffiliation(studentId: string, action: 'verify' | 'reject' | 'suspend' | 'mark-graduated', reason?: string): Promise<{ status: string }> { const response = await apiClient.patch<ApiResponse<{ status: string }>>(`/universities/students/${studentId}/${action}-affiliation`.replace('/mark-graduated-affiliation', '/mark-graduated'), reason ? { reason } : {}); return response.data.data; },

  async getAnalytics(): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>('/universities/analytics');
    return response.data.data;
  },

  async getStaff(params?: UniversityStaffQuery): Promise<UniversityStaffList> {
    const response = await apiClient.get<ApiResponse<UniversityStaffList>>('/universities/staff', { params });
    return response.data.data;
  },

  async inviteStaff(data: InviteUniversityStaffRequest): Promise<UniversityStaffMember> {
    const response = await apiClient.post<ApiResponse<UniversityStaffMember>>('/universities/staff/invite', data);
    return response.data.data;
  },

  async updateStaff(id: string, data: UpdateUniversityStaffRequest): Promise<UniversityStaffMember> {
    const response = await apiClient.patch<ApiResponse<UniversityStaffMember>>(`/universities/staff/${id}`, data);
    return response.data.data;
  },

  async updateStaffStatus(id: string, status: 'active' | 'inactive'): Promise<UniversityStaffMember> {
    const response = await apiClient.patch<ApiResponse<UniversityStaffMember>>(`/universities/staff/${id}/status`, { status });
    return response.data.data;
  },

  async resendStaffInvitation(id: string): Promise<{ message: string; emailSent: boolean }> {
    const response = await apiClient.post<ApiResponse<{ message: string; emailSent: boolean }>>(`/universities/staff/${id}/resend-invitation`);
    return response.data.data;
  },

  async cancelStaffInvitation(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(`/universities/staff/${id}/invitation`);
    return response.data.data;
  },

  async getCollegeComparison(): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>('/universities/college-comparison');
    return response.data.data;
  },

  async getDepartmentComparison(): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>('/universities/department-comparison');
    return response.data.data;
  },

  async getMarketTrends(): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>('/universities/market-trends');
    return response.data.data;
  },

  async getCurriculumSuggestions(): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>('/universities/curriculum-suggestions');
    return response.data.data;
  },

  async getLowEmploymentAnalysis(): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>('/universities/low-employment-analysis');
    return response.data.data;
  },

  async getStudyPlans(params?: { departmentId?: string; status?: string; search?: string; page?: number; limit?: number; includeArchived?: boolean }): Promise<{ items: UniversityStudyPlan[]; pagination?: { page: number; limit: number; total: number; totalPages: number } }> {
    const response = await apiClient.get<ApiResponse<{ items: UniversityStudyPlan[] }>>('/universities/study-plans', { params });
    return response.data.data;
  },
  async createStudyPlan(data: { departmentId: string; name: string; nameAr?: string; description?: string; academicYear: string; totalCreditHours: number; levelsCount?: number; semestersCount?: number }): Promise<UniversityStudyPlan> {
    const response = await apiClient.post<ApiResponse<UniversityStudyPlan>>('/universities/study-plans', data);
    return response.data.data;
  },
  async submitStudyPlan(id: string): Promise<UniversityStudyPlan> {
    const response = await apiClient.post<ApiResponse<UniversityStudyPlan>>(`/universities/study-plans/${id}/submit`);
    return response.data.data;
  },
  async updateStudyPlan(id: string, data: { name?: string; description?: string; totalCreditHours?: number; levelsCount?: number; semestersCount?: number; levels?: unknown[] }): Promise<UniversityStudyPlan> { const response = await apiClient.patch<ApiResponse<UniversityStudyPlan>>(`/universities/study-plans/${id}`, data); return response.data.data; },
  async createStudyPlanVersion(id: string): Promise<UniversityStudyPlan> { const response = await apiClient.post<ApiResponse<UniversityStudyPlan>>(`/universities/study-plans/${id}/new-version`); return response.data.data; },
  async activateStudyPlan(id: string): Promise<UniversityStudyPlan> { const response = await apiClient.post<ApiResponse<UniversityStudyPlan>>(`/universities/study-plans/${id}/activate`); return response.data.data; },
  async archiveStudyPlan(id: string): Promise<UniversityStudyPlan> { const response = await apiClient.delete<ApiResponse<UniversityStudyPlan>>(`/universities/study-plans/${id}`); return response.data.data; },
  async reviewStudyPlan(id: string, status: 'approved' | 'rejected' | 'changes_requested' | 'under_review', reason?: string): Promise<UniversityStudyPlan> {
    const response = await apiClient.patch<ApiResponse<UniversityStudyPlan>>(`/universities/study-plans/${id}/review`, { status, reason });
    return response.data.data;
  },
  async getCourses(params?: { studyPlanId?: string; departmentId?: string; search?: string; page?: number; limit?: number; includeArchived?: boolean }): Promise<{ items: UniversityCourse[]; pagination?: { page: number; limit: number; total: number; totalPages: number } }> {
    const response = await apiClient.get<ApiResponse<{ items: UniversityCourse[] }>>('/universities/courses', { params });
    return response.data.data;
  },
  async createCourse(data: { studyPlanId: string; code: string; name: string; nameAr?: string; description?: string; descriptionAr?: string; descriptionEn?: string; creditHours: number; level: number; semester: number; type: 'required' | 'elective' | 'practical' | 'laboratory' | 'project' | 'internship'; prerequisites?: string[]; corequisites?: string[]; learningOutcomes?: string[]; learningOutcomesAr?: string[]; learningOutcomesEn?: string[] }): Promise<UniversityCourse> {
    const response = await apiClient.post<ApiResponse<UniversityCourse>>('/universities/courses', data);
    return response.data.data;
  },
  async archiveCourse(id: string): Promise<UniversityCourse> {
    const response = await apiClient.delete<ApiResponse<UniversityCourse>>(`/universities/courses/${id}`);
    return response.data.data;
  },
  async updateCourse(id: string, data: Partial<{ code: string; name: string; nameAr: string; description: string; descriptionAr: string; descriptionEn: string; creditHours: number; level: number; semester: number; type: 'required' | 'elective' | 'practical' | 'laboratory' | 'project' | 'internship'; prerequisites: string[]; corequisites: string[]; learningOutcomes: string[]; learningOutcomesAr: string[]; learningOutcomesEn: string[] }>): Promise<UniversityCourse> { const response = await apiClient.patch<ApiResponse<UniversityCourse>>(`/universities/courses/${id}`, data); return response.data.data; },
  async restoreCourse(id: string): Promise<UniversityCourse> { const response = await apiClient.post<ApiResponse<UniversityCourse>>(`/universities/courses/${id}/restore`); return response.data.data; },
  async mapCourseSkill(id: string, data: { skillId: string; coverageLevel: number; coverageType: 'theoretical' | 'practical' | 'mixed'; assessmentMethod: string; notes?: string }): Promise<UniversityCourse> { const response = await apiClient.post<ApiResponse<UniversityCourse>>(`/universities/courses/${id}/skills`, data); return response.data.data; },
  async unmapCourseSkill(id: string, skillId: string): Promise<UniversityCourse> { const response = await apiClient.delete<ApiResponse<UniversityCourse>>(`/universities/courses/${id}/skills/${skillId}`); return response.data.data; },
  async getSkills(params?: { search?: string; limit?: number }): Promise<Array<{ id: string; name: string; nameAr?: string; category?: string }>> { const response = await apiClient.get<ApiResponse<any[]>>('/skills', { params: { limit: 100, ...params } }); const payload: any = response.data; const rows = Array.isArray(response.data.data) ? response.data.data : payload.data?.data || []; return rows.map((item: any) => ({ id: String(item.id || item._id), name: item.name, nameAr: item.nameAr, category: item.category })); },
  async analyzeCurriculum(departmentId: string, refresh = false): Promise<CurriculumAnalysis> {
    const response = await apiClient.get<ApiResponse<CurriculumAnalysis>>(`/universities/curriculum/analysis/${departmentId}`, { params: refresh ? { refresh: true } : undefined });
    return response.data.data;
  },
  async getAcademicRecommendations(params?: { departmentId?: string; status?: string; search?: string; page?: number; limit?: number }): Promise<{ items: AcademicRecommendation[]; pagination?: { page: number; limit: number; total: number; totalPages: number } }> {
    const response = await apiClient.get<ApiResponse<{ items: AcademicRecommendation[]; pagination?: { page: number; limit: number; total: number; totalPages: number } }>>('/universities/curriculum/recommendations', { params });
    return response.data.data;
  },
  async createAcademicRecommendation(data: { title: string; description: string; type: string; departmentId: string; studyPlanId?: string; evidence: string[]; marketDemand: number; studentImpact: string; priority: string }): Promise<AcademicRecommendation> {
    const response = await apiClient.post<ApiResponse<AcademicRecommendation>>('/universities/curriculum/recommendations', data);
    return response.data.data;
  },
  async submitAcademicRecommendation(id: string): Promise<AcademicRecommendation> {
    const response = await apiClient.post<ApiResponse<AcademicRecommendation>>(`/universities/curriculum/recommendations/${id}/submit`);
    return response.data.data;
  },
  async updateAcademicRecommendation(id: string, data: Partial<{ title: string; description: string; type: string; studyPlanId: string; affectedCourses: string[]; affectedSkills: string[]; evidence: string[]; marketDemand: number; studentImpact: string; priority: string }>): Promise<AcademicRecommendation> { const response = await apiClient.patch<ApiResponse<AcademicRecommendation>>(`/universities/curriculum/recommendations/${id}`, data); return response.data.data; },
  async reviewAcademicRecommendation(id: string, status: 'approved' | 'rejected' | 'changes_requested' | 'under_review', reason?: string): Promise<AcademicRecommendation> {
    const response = await apiClient.patch<ApiResponse<AcademicRecommendation>>(`/universities/curriculum/recommendations/${id}/review`, { status, reason });
    return response.data.data;
  },

  async getBenchmarking(): Promise<any[]> {
    const response = await apiClient.get<ApiResponse<any[]>>('/universities/benchmarking');
    return response.data.data;
  },
  async getReport(type: string, format: 'json' | 'csv' | 'xlsx' | 'pdf' = 'json'): Promise<any> {
    const response = await apiClient.get<ApiResponse<any> | Blob>(`/universities/reports/${type}`, {
      params: { format },
      responseType: format === 'json' ? 'json' : 'blob',
    });
    if (format !== 'json') return response.data;
    const payload = response.data as ApiResponse<any> & { meta?: Record<string, unknown> };
    return payload.meta ? { ...payload.meta, data: payload.data } : payload.data;
  },

  async importStudyPlanPdf(departmentId: string, file: File): Promise<StudyPlanImportJob> {
    const form = new FormData();
    form.append('file', file);
    const response = await apiClient.post<ApiResponse<StudyPlanImportJob>>(
      `/universities/study-plans/import-pdf?departmentId=${encodeURIComponent(departmentId)}`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data.data;
  },

  async getImportJob(jobId: string): Promise<StudyPlanImportJob> {
    const response = await apiClient.get<ApiResponse<StudyPlanImportJob>>(`/universities/study-plans/imports/${jobId}`);
    return response.data.data;
  },

  async confirmImport(
    jobId: string,
    data?: ConfirmImportData
  ): Promise<{ planId: string; coursesCreated: number; status: string }> {
    const response = await apiClient.post<ApiResponse<{ planId: string; coursesCreated: number; status: string }>>(
      `/universities/study-plans/imports/${jobId}/confirm`,
      data ?? {}
    );
    return response.data.data;
  },

  async cancelImport(jobId: string): Promise<{ status: string }> {
    const response = await apiClient.delete<ApiResponse<{ status: string }>>(`/universities/study-plans/imports/${jobId}`);
    return response.data.data;
  },
};
