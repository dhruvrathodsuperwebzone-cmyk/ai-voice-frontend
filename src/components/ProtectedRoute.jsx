import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../store/authContext';
import PageLoader from './PageLoader';

/**
 * Renders children only when user is authenticated; otherwise redirects to /login.
 */
export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <PageLoader message="Checking session…" size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
