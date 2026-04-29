/**
 * Backend permission reference: HTTP paths the **read-only viewer** UI may call
 * when given the same navigation as an admin (GET / read-only usage only).
 * All paths are relative to your API base, e.g. `${VITE_API_URL}/api` + path below.
 *
 * Mutations (POST/PUT/PATCH/DELETE) are **not** invoked from the viewer UI after
 * the read-only guards; still return **403** for those on the server if role is viewer.
 */

export const VIEWER_READ_ONLY_API_PATHS = [
  'GET /dashboard/stats',
  'GET /revenue',
  'GET /calls/outbound/agents',
  'GET /calls/outbound/requests',
  'GET /calls/outbound/requests/:id',
  'GET /leads',
  'GET /leads/by-creator',
  'GET /leads/:id',
  'GET /calendar/events',
  'GET /calender/all',
  'GET /voice/agents/:agentId/calls',
  'GET /voice/calls/:id',
  'GET /payments/admin',
  'GET /payment/status',
  'GET /omni/admin/omnidim-agents',
  'GET /users',
  'GET /users/names',
];

/** Number of distinct viewer-safe read operations listed above (for quick backend checks). */
export const VIEWER_READ_ONLY_API_PATH_COUNT = VIEWER_READ_ONLY_API_PATHS.length;
