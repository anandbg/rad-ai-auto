import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { MOCK_AUTH_COOKIE, getMockUser } from '@/lib/auth/mock-auth';

// Mock users data for admin view
const mockUsers = [
  {
    id: 'mock-user-radiologist-123',
    email: 'radiologist@test.com',
    name: 'Dr. Test Radiologist',
    role: 'radiologist',
    createdAt: '2024-01-01T10:00:00Z',
    lastActive: '2024-01-15T14:30:00Z',
  },
  {
    id: 'mock-user-admin-456',
    email: 'admin@test.com',
    name: 'Admin User',
    role: 'admin',
    createdAt: '2024-01-01T09:00:00Z',
    lastActive: '2024-01-15T15:00:00Z',
  },
];

export async function GET(request: NextRequest) {
  // Check authentication
  const cookieStore = await cookies();
  const authCookie = cookieStore.get(MOCK_AUTH_COOKIE);
  const user = getMockUser(authCookie?.value);

  // Return 401 if not authenticated
  if (!user) {
    return NextResponse.json(
      {
        error: 'Unauthorized',
        message: 'Authentication required. Please sign in to access this resource.'
      },
      { status: 401 }
    );
  }

  // Return 403 if user is not an admin
  if (user.role !== 'admin') {
    return NextResponse.json(
      {
        error: 'Forbidden',
        message: 'Access denied. Admin role required to access this resource.'
      },
      { status: 403 }
    );
  }

  // Return users list for admin users
  return NextResponse.json({
    success: true,
    data: mockUsers,
    totalUsers: mockUsers.length,
  });
}
