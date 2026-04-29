/**
 * Normalize user.role to 'viewer' | 'agent' | 'admin'
 * Defaults to 'viewer' when role is missing so Viewer UI is enforced until API returns role.
 */
export function getRole(user) {
  const r = user?.role?.toLowerCase?.();
  if (r === 'viewer' || r === 'agent' || r === 'admin') return r;
  return 'viewer';
}

export function isViewer(user) {
  return getRole(user) === 'viewer';
}

export function isAgent(user) {
  return getRole(user) === 'agent';
}

export function isAdmin(user) {
  return getRole(user) === 'admin';
}

export {
  VIEWER_READ_ONLY_API_PATHS,
  VIEWER_READ_ONLY_API_PATH_COUNT,
} from '../constants/viewerReadOnlyApiInventory';
