import { Navigate, useLocation } from 'react-router';
import type { ReactNode } from 'react';
import { getAccessToken } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { getDashboardPath } from '@/services/authApi';
import { useUniversityStatus } from '@/hooks/useUniversity';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const location = useLocation();
  const { user, hasToken, isLoading, isUniversity, isCoordinator } = useAuth();
  const isApprovalPage = location.pathname === '/university/pending-approval';
  // Only the University Manager role needs the approval status gate.
  const universityStatus = useUniversityStatus(!isLoading && hasToken && isUniversity);

  if (!getAccessToken() && !hasToken) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (isLoading || (isUniversity && universityStatus.isLoading)) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center" style={{ background: '#e8ebe6' }}>
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#dfe1dd] border-t-[#9fe870]" />
      </div>
    );
  }

  if (user && allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  if (isUniversity && universityStatus.data) {
    if (!universityStatus.data.canAccessPortal && !isApprovalPage) {
      return <Navigate to="/university/pending-approval" replace />;
    }
    if (universityStatus.data.canAccessPortal && isApprovalPage) {
      return <Navigate to="/university/dashboard" replace />;
    }
  }

  if (isUniversity && universityStatus.isError && !isApprovalPage) {
    return <Navigate to="/university/pending-approval" replace />;
  }

  return <>{children}</>;
}
