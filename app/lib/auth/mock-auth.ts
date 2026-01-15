/**
 * Mock authentication for development testing
 * This allows testing protected routes and user flows without Supabase
 */

export interface MockUser {
  id: string;
  email: string;
  role: 'radiologist' | 'admin';
  name: string;
}

// Development mock users
export const MOCK_USERS: Record<string, MockUser> = {
  radiologist: {
    id: 'mock-user-radiologist-123',
    email: 'radiologist@test.com',
    role: 'radiologist',
    name: 'Dr. Test Radiologist',
  },
  admin: {
    id: 'mock-user-admin-456',
    email: 'admin@test.com',
    role: 'admin',
    name: 'Admin User',
  },
};

// Cookie name for mock auth
export const MOCK_AUTH_COOKIE = 'mock-auth-user';

// Check if we're in development mode without Supabase
export function isDevelopmentMode(): boolean {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return true;
  try {
    new URL(supabaseUrl);
    return false;
  } catch {
    return true;
  }
}

// Get mock user from cookie value
export function getMockUser(cookieValue: string | undefined): MockUser | null {
  if (!cookieValue) return null;

  // Handle predefined mock users
  if (MOCK_USERS[cookieValue]) {
    return MOCK_USERS[cookieValue];
  }

  // Handle custom registered users (signed up via signup form)
  // Cookie format: custom_{email}
  if (cookieValue.startsWith('custom_')) {
    const email = cookieValue.replace('custom_', '');
    // Return a mock user object for custom users
    // The actual user details are loaded from localStorage on the client
    return {
      id: `custom-user-${email.replace(/[^a-z0-9]/gi, '-')}`,
      email: email,
      role: 'radiologist', // Custom users are always radiologists
      name: email.split('@')[0], // Placeholder name, will be overridden by client
    };
  }

  return null;
}
