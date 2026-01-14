import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { MOCK_AUTH_COOKIE, getMockUser, type MockUser } from '@/lib/auth/mock-auth';

// Routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/transcribe',
  '/generate',
  '/templates',
  '/brand-templates',
  '/macros',
  '/billing',
  '/settings',
  '/admin',
];

// Routes that require admin role
const adminRoutes = ['/admin'];

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ['/login', '/signup'];

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function isDevelopmentMode(): boolean {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return true;
  return !isValidUrl(supabaseUrl);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  let user: { id: string; email?: string | null } | null = null;
  let userRole: 'radiologist' | 'admin' = 'radiologist';

  // In development mode without Supabase, use mock auth
  if (isDevelopmentMode()) {
    const mockUserKey = request.cookies.get(MOCK_AUTH_COOKIE)?.value;
    const mockUser = getMockUser(mockUserKey);
    if (mockUser) {
      user = { id: mockUser.id, email: mockUser.email };
      userRole = mockUser.role;
    }
  } else {
    // Use real Supabase auth
    const sessionResult = await updateSession(request);
    response = sessionResult.response;
    user = sessionResult.user;
    // In production, role would come from profile lookup
    // For now, assume radiologist unless we implement profile checking
  }

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Check if the current path is an admin route
  const isAdminRoute = adminRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Check if the current path is an auth route (login/signup)
  const isAuthRoute = authRoutes.some((route) => pathname === route);

  // Redirect unauthenticated users from protected routes to login
  if (isProtectedRoute && !user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect non-admin users from admin routes to dashboard with 403-like behavior
  if (isAdminRoute && user && userRole !== 'admin') {
    const dashboardUrl = new URL('/dashboard', request.url);
    dashboardUrl.searchParams.set('error', 'unauthorized');
    return NextResponse.redirect(dashboardUrl);
  }

  // Redirect authenticated users from auth routes to dashboard
  if (isAuthRoute && user) {
    const redirectTo = request.nextUrl.searchParams.get('redirect') || '/dashboard';
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
