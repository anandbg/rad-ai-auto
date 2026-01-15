/**
 * Session management utilities
 * Works with both client-side storage and cookies for API validation
 */

// Session timeout in milliseconds (30 minutes)
export const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

// Cookie name for session timestamp
export const SESSION_TIMESTAMP_COOKIE = 'session-timestamp';

// Check if session is expired based on timestamp
export function isSessionExpired(timestamp: number | null): boolean {
  if (!timestamp) return true;
  const timeSinceActivity = Date.now() - timestamp;
  return timeSinceActivity >= SESSION_TIMEOUT_MS;
}

// Parse session timestamp from cookie value
export function parseSessionTimestamp(cookieValue: string | undefined): number | null {
  if (!cookieValue) return null;
  const timestamp = parseInt(cookieValue, 10);
  return isNaN(timestamp) ? null : timestamp;
}
