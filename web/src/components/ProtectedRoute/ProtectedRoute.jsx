import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { PageSpinner } from '../../design-system';

/**
 * Wraps a route subtree. Redirects to /auth/login when unauthenticated;
 * if `roles` is provided, ensures the user has one of them.
 */
export function ProtectedRoute({ roles, children }) {
  const { isAuthenticated, role, bootstrapping } = useAuth();
  const location = useLocation();

  if (bootstrapping) return <PageSpinner />;

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace state={{ from: location }} />;
  }

  if (roles && !roles.includes(role)) {
    return <Navigate to="/forbidden" replace />;
  }

  return children;
}
