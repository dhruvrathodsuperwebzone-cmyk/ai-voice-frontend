import { Navigate } from 'react-router-dom';
import { useAuth } from '../store/authContext';
import PageLoader from '../components/PageLoader';
import LandingPage from './LandingPage';

export default function LandingRedirect() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <PageLoader message="Loading…" size="lg" />
      </div>
    );
  }

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <LandingPage />;
}

