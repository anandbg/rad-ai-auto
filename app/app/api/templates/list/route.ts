import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { MOCK_AUTH_COOKIE, getMockUser } from '@/lib/auth/mock-auth';
import { SESSION_TIMESTAMP_COOKIE, isSessionExpired, parseSessionTimestamp } from '@/lib/auth/session';

// Mock templates for API response
const mockTemplates = [
  {
    id: 'tpl-001',
    name: 'Chest X-Ray Standard',
    modality: 'X-Ray',
    bodyPart: 'Chest',
    description: 'Standard chest X-ray report template with PA and lateral views',
    isGlobal: true,
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-10T10:00:00Z',
  },
  {
    id: 'tpl-002',
    name: 'CT Abdomen',
    modality: 'CT',
    bodyPart: 'Abdomen',
    description: 'CT scan of abdomen and pelvis with and without contrast',
    isGlobal: true,
    createdAt: '2024-01-12T14:30:00Z',
    updatedAt: '2024-01-12T14:30:00Z',
  },
];

export async function GET(request: NextRequest) {
  // Check authentication
  const cookieStore = await cookies();
  const authCookie = cookieStore.get(MOCK_AUTH_COOKIE);
  const user = getMockUser(authCookie?.value);

  if (!user) {
    return NextResponse.json(
      {
        error: 'Unauthorized',
        message: 'Authentication required. Please sign in to access this resource.'
      },
      { status: 401 }
    );
  }

  // Check session expiration
  const sessionTimestampCookie = cookieStore.get(SESSION_TIMESTAMP_COOKIE);
  const sessionTimestamp = parseSessionTimestamp(sessionTimestampCookie?.value);

  if (isSessionExpired(sessionTimestamp)) {
    return NextResponse.json(
      {
        error: 'Session Expired',
        message: 'Your session has expired due to inactivity. Please sign in again.',
        code: 'SESSION_EXPIRED'
      },
      { status: 401 }
    );
  }

  // Return templates for authenticated users
  return NextResponse.json({
    success: true,
    data: mockTemplates,
    user: {
      id: user.id,
      role: user.role,
    },
  });
}
