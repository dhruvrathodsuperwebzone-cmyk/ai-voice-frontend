import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../store/authContext';
import { getRole } from '../utils/roleUtils';

/** Outbound Calls UI: admin and agent only (viewer redirected to dashboard). */
export default function AdminAgentRoute({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const role = getRole(user);

  if (role !== 'admin' && role !== 'agent') {
    return <Navigate to="/dashboard" replace state={{ from: location }} />;
  }

  return children;
}
