import { api } from './apiClient';

/**
 * GET /calendar/events — live Google Calendar events for the logged-in user.
 * Requires prior OAuth link (GET /calendar/oauth/url → callback → POST /calendar/oauth/token).
 * Optional query: timeMin, timeMax (ISO 8601), calendarId (default primary), maxResults.
 * Auth: Bearer JWT (api client).
 */
export async function getCalendarEvents(params = {}) {
  const { data } = await api.get('/calendar/events', {
    params,
    headers: { Accept: 'application/json' },
  });
  return data;
}

/**
 * GET /calender/all — DB mirror of calendar rows (legacy / alternate list).
 */
export async function getCalendarTableRows() {
  const { data } = await api.get('/calender/all');
  return data;
}
