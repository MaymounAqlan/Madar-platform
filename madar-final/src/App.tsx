import { Routes, Route } from 'react-router'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import StudentDashboard from './pages/student/StudentDashboard'
import StudentJobs from './pages/student/StudentJobs'
import StudentProfile from './pages/student/StudentProfile'
import StudentApplications from './pages/student/StudentApplications'
import StudentInsights from './pages/student/StudentInsights'
import CompanyDashboard from './pages/company/CompanyDashboard'
import CompanyJobs from './pages/company/CompanyJobs'
import CompanyCandidates from './pages/company/CompanyCandidates'
import CompanyAnalytics from './pages/company/CompanyAnalytics'
import UniversityDashboard from './pages/university/UniversityDashboard'
import UniversityStructure from './pages/university/UniversityStructure'
import UniversityStudents from './pages/university/UniversityStudents'
import AdminDashboard from './pages/admin/AdminDashboard'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Landing />} />
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/student/dashboard" element={<StudentDashboard />} />
      <Route path="/student/jobs" element={<StudentJobs />} />
      <Route path="/student/profile" element={<StudentProfile />} />
      <Route path="/student/applications" element={<StudentApplications />} />
      <Route path="/student/insights" element={<StudentInsights />} />
      <Route path="/company/dashboard" element={<CompanyDashboard />} />
      <Route path="/company/jobs" element={<CompanyJobs />} />
      <Route path="/company/candidates" element={<CompanyCandidates />} />
      <Route path="/company/analytics" element={<CompanyAnalytics />} />
      <Route path="/university/dashboard" element={<UniversityDashboard />} />
      <Route path="/university/structure" element={<UniversityStructure />} />
      <Route path="/university/students" element={<UniversityStudents />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
    </Routes>
  )
}
