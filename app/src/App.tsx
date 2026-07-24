import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Landing from './pages/Landing'

// Lazy load auth pages
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const OAuthCallback = lazy(() => import('./pages/OAuthCallback'))
const CompleteGoogleProfile = lazy(() => import('./pages/CompleteGoogleProfile'))
const About = lazy(() => import('./pages/About'))
const Contact = lazy(() => import('./pages/Contact'))
const Support = lazy(() => import('./pages/Support'))

// Lazy load student portal
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'))
const StudentRecommendations = lazy(() => import('./pages/student/StudentRecommendations'))
const StudentJobs = lazy(() => import('./pages/student/StudentJobs'))
const StudentProfile = lazy(() => import('./pages/student/StudentProfile'))
const StudentApplications = lazy(() => import('./pages/student/StudentApplications'))
const StudentInsights = lazy(() => import('./pages/student/StudentInsights'))
const StudentNotifications = lazy(() => import('./pages/student/StudentNotifications'))

// Lazy load company portal
const CompanyDashboard = lazy(() => import('./pages/company/CompanyDashboard'))
const CompanyJobs = lazy(() => import('./pages/company/CompanyJobs'))
const CompanyCandidates = lazy(() => import('./pages/company/CompanyCandidates'))
const CompanyAnalytics = lazy(() => import('./pages/company/CompanyAnalytics'))
const CompanyProfile = lazy(() => import('./pages/company/CompanyProfile'))
const CompanyNotifications = lazy(() => import('./pages/student/StudentNotifications'))

// Lazy load university portal
const UniversityDashboard = lazy(() => import('./pages/university/UniversityDashboard'))
const UniversityStructure = lazy(() => import('./pages/university/UniversityStructure'))
const UniversityStudents = lazy(() => import('./pages/university/UniversityStudents'))
const UniversityProfile = lazy(() => import('./pages/university/UniversityProfile'))
const CoordinatorProfile = lazy(() => import('./pages/university/CoordinatorProfile'))
const UniversityPendingApproval = lazy(() => import('./pages/university/UniversityPendingApproval'))
const UniversityStaff = lazy(() => import('./pages/university/UniversityStaff'))
const UniversityCurriculum = lazy(() => import('./pages/university/UniversityCurriculum'))
const UniversityReports = lazy(() => import('./pages/university/UniversityReports'))
const UniversityNotifications = lazy(() => import('./pages/university/UniversityNotifications'))
const UniversityBenchmarking = lazy(() => import('./pages/university/UniversityBenchmarking'))

// Lazy load admin portal
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminUniversities = lazy(() => import('./pages/admin/AdminUniversities'))
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'))
const AdminAccounts = lazy(() => import('./pages/admin/AdminAccounts'))
const AdminRolesPermissions = lazy(() => import('./pages/admin/AdminRolesPermissions'))
const AdminMonitoring = lazy(() => import('./pages/admin/AdminMonitoring'))
const AdminAiOperations = lazy(() => import('./pages/admin/AdminAiOperations'))
const AdminEmail = lazy(() => import('./pages/admin/AdminEmail'))
const AdminBackup = lazy(() => import('./pages/admin/AdminBackup'))
const AdminAuditLogs = lazy(() => import('./pages/admin/AdminAuditLogs'))
const AdminSecurityAlerts = lazy(() => import('./pages/admin/AdminSecurityAlerts'))
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'))
const AdminProfile = lazy(() => import('./pages/admin/AdminProfile'))

import { useAuth } from './hooks/useAuth'

function UniversityProfileRouter() {
  const { isUniversity } = useAuth()
  return isUniversity ? <UniversityProfile /> : <CoordinatorProfile />
}

function PageLoader() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center" style={{ background: '#e8ebe6' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#dfe1dd] border-t-[#9fe870]" />
        <p className="text-sm font-semibold" style={{ color: '#5b5e5a' }}>Loading...</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Landing />} />
          <Route path="/features" element={<Landing />} />
          <Route path="/how-it-works" element={<Landing />} />
          <Route path="/careers" element={<Landing />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/support" element={<Support />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/oauth/callback" element={<OAuthCallback />} />
        <Route path="/auth/google/success" element={<OAuthCallback />} />
        <Route path="/complete-profile" element={<CompleteGoogleProfile />} />
        <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
        <Route path="/student/dashboard" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
        <Route path="/student/recommendations" element={<ProtectedRoute allowedRoles={['student']}><StudentRecommendations /></ProtectedRoute>} />
        <Route path="/student/jobs" element={<ProtectedRoute allowedRoles={['student']}><StudentJobs /></ProtectedRoute>} />
        <Route path="/student/profile" element={<ProtectedRoute allowedRoles={['student']}><StudentProfile /></ProtectedRoute>} />
        <Route path="/student/applications" element={<ProtectedRoute allowedRoles={['student']}><StudentApplications /></ProtectedRoute>} />
        <Route path="/student/insights" element={<ProtectedRoute allowedRoles={['student']}><StudentInsights /></ProtectedRoute>} />
        <Route path="/student/notifications" element={<ProtectedRoute allowedRoles={['student']}><StudentNotifications /></ProtectedRoute>} />
        <Route path="/company/dashboard" element={<ProtectedRoute allowedRoles={['company']}><CompanyDashboard /></ProtectedRoute>} />
        <Route path="/company/profile" element={<ProtectedRoute allowedRoles={['company']}><CompanyProfile /></ProtectedRoute>} />
        <Route path="/company/jobs" element={<ProtectedRoute allowedRoles={['company']}><CompanyJobs /></ProtectedRoute>} />
        <Route path="/company/candidates" element={<ProtectedRoute allowedRoles={['company']}><CompanyCandidates /></ProtectedRoute>} />
        <Route path="/company/analytics" element={<ProtectedRoute allowedRoles={['company']}><CompanyAnalytics /></ProtectedRoute>} />
        <Route path="/company/notifications" element={<ProtectedRoute allowedRoles={['company']}><CompanyNotifications /></ProtectedRoute>} />
        <Route path="/university/dashboard" element={<ProtectedRoute allowedRoles={['university', 'coordinator', 'university_viewer', 'data_officer', 'quality_officer', 'academic_development_officer']}><UniversityDashboard /></ProtectedRoute>} />
        <Route path="/university/structure" element={<ProtectedRoute allowedRoles={['university', 'coordinator', 'university_viewer', 'data_officer', 'quality_officer']}><UniversityStructure /></ProtectedRoute>} />
        <Route path="/university/students" element={<ProtectedRoute allowedRoles={['university', 'coordinator', 'university_viewer', 'data_officer', 'quality_officer']}><UniversityStudents /></ProtectedRoute>} />
        <Route path="/university/staff" element={<ProtectedRoute allowedRoles={['university']}><UniversityStaff /></ProtectedRoute>} />
        <Route path="/university/profile" element={<ProtectedRoute allowedRoles={['university', 'coordinator', 'university_viewer', 'data_officer', 'quality_officer', 'academic_development_officer']}><UniversityProfileRouter /></ProtectedRoute>} />
        <Route path="/university/benchmarking" element={<ProtectedRoute allowedRoles={['university']}><UniversityBenchmarking /></ProtectedRoute>} />
        <Route path="/university/curriculum" element={<ProtectedRoute allowedRoles={['university', 'coordinator', 'university_viewer', 'data_officer', 'quality_officer', 'academic_development_officer']}><UniversityCurriculum /></ProtectedRoute>} />
        <Route path="/university/reports" element={<ProtectedRoute allowedRoles={['university', 'coordinator', 'university_viewer', 'data_officer', 'quality_officer', 'academic_development_officer']}><UniversityReports /></ProtectedRoute>} />
        <Route path="/university/notifications" element={<ProtectedRoute allowedRoles={['university', 'coordinator', 'university_viewer', 'data_officer', 'quality_officer', 'academic_development_officer']}><UniversityNotifications /></ProtectedRoute>} />
        <Route path="/university/pending-approval" element={<ProtectedRoute allowedRoles={['university']}><UniversityPendingApproval /></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/accounts" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><AdminAccounts /></ProtectedRoute>} />
        <Route path="/admin/roles" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><AdminRolesPermissions /></ProtectedRoute>} />
        <Route path="/admin/monitoring" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><AdminMonitoring /></ProtectedRoute>} />
        <Route path="/admin/ai-operations" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><AdminAiOperations /></ProtectedRoute>} />
        <Route path="/admin/email" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><AdminEmail /></ProtectedRoute>} />
        <Route path="/admin/backup" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><AdminBackup /></ProtectedRoute>} />
        <Route path="/admin/audit-logs" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><AdminAuditLogs /></ProtectedRoute>} />
        <Route path="/admin/security-alerts" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><AdminSecurityAlerts /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><AdminSettings /></ProtectedRoute>} />
        <Route path="/admin/universities" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><AdminUniversities /></ProtectedRoute>} />
        <Route path="/admin/profile" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><AdminProfile /></ProtectedRoute>} />
      </Routes>
    </Suspense>
  )
}
