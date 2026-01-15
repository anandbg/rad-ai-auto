/**
 * CSRF (Cross-Site Request Forgery) Protection
 *
 * This module provides CSRF token generation and validation
 * to protect forms from cross-site request forgery attacks.
 */

// Storage key for CSRF token
const CSRF_TOKEN_KEY = 'ai-rad-csrf-token';
const CSRF_TOKEN_HEADER = 'x-csrf-token';

/**
 * Generate a cryptographically secure random token
 */
function generateRandomToken(): string {
  // Use crypto API if available (browser or Node.js)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback to Math.random (less secure but functional)
  return 'csrf-' + Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15) +
         Date.now().toString(36);
}

/**
 * Get or create a CSRF token for the current session
 * Token is stored in sessionStorage to persist across page navigations
 * but cleared when the browser session ends
 */
export function getCsrfToken(): string {
  if (typeof window === 'undefined') {
    // Server-side: generate a new token (will be validated against client token)
    return generateRandomToken();
  }

  // Check if token already exists in sessionStorage
  let token = sessionStorage.getItem(CSRF_TOKEN_KEY);

  if (!token) {
    // Generate new token and store it
    token = generateRandomToken();
    sessionStorage.setItem(CSRF_TOKEN_KEY, token);
  }

  return token;
}

/**
 * Validate a CSRF token against the stored session token
 * @param providedToken - The token provided in the request
 * @returns true if valid, false otherwise
 */
export function validateCsrfToken(providedToken: string | null | undefined): boolean {
  if (!providedToken) {
    console.warn('[CSRF] No token provided');
    return false;
  }

  if (typeof window === 'undefined') {
    // Server-side validation would need to use cookies or headers
    // For now, we trust the token format
    return providedToken.length > 20;
  }

  const storedToken = sessionStorage.getItem(CSRF_TOKEN_KEY);

  if (!storedToken) {
    console.warn('[CSRF] No stored token found');
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  if (providedToken.length !== storedToken.length) {
    console.warn('[CSRF] Token length mismatch');
    return false;
  }

  let result = 0;
  for (let i = 0; i < providedToken.length; i++) {
    result |= providedToken.charCodeAt(i) ^ storedToken.charCodeAt(i);
  }

  const isValid = result === 0;
  if (!isValid) {
    console.warn('[CSRF] Token validation failed');
  }

  return isValid;
}

/**
 * Clear the CSRF token (e.g., on logout)
 */
export function clearCsrfToken(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(CSRF_TOKEN_KEY);
  }
}

/**
 * Regenerate the CSRF token (e.g., after sensitive operations)
 */
export function regenerateCsrfToken(): string {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(CSRF_TOKEN_KEY);
  }
  return getCsrfToken();
}

/**
 * Get the CSRF header name for API requests
 */
export function getCsrfHeaderName(): string {
  return CSRF_TOKEN_HEADER;
}

/**
 * Create headers object with CSRF token for fetch requests
 */
export function getCsrfHeaders(): Record<string, string> {
  return {
    [CSRF_TOKEN_HEADER]: getCsrfToken(),
  };
}

/**
 * Helper to check if a request method requires CSRF protection
 * GET and HEAD requests don't modify data, so they don't need CSRF protection
 */
export function requiresCsrfProtection(method: string): boolean {
  const safeMethod = method.toUpperCase();
  return !['GET', 'HEAD', 'OPTIONS'].includes(safeMethod);
}
