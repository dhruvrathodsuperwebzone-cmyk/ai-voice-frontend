import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../store/authContext';
import { getRole } from '../utils/roleUtils';

/**
 * Admin full access; viewer may open the same routes with read-only UI (mutations hidden in pages).
 * Agents are redirected to the dashboard.
 */
export default function AdminOrViewerRoute({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const role = getRole(user);

  if (role !== 'admin' && role !== 'viewer') {
    return <Navigate to="/dashboard" replace state={{ from: location }} />;
  }

  return children;
}
