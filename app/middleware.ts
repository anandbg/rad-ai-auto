import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

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
  '/productivity',
];

// Admin routes are handled client-side via role checking in auth-context

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ['/login', '/signup'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Use Supabase auth
  const sessionResult = await updateSession(request);
  const response = sessionResult.response;
  const user = sessionResult.user;

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Check if the current path is an auth route (login/signup)
  const isAuthRoute = authRoutes.some((route) => pathname === route);

  // Redirect authenticated users from root to dashboard
  if (pathname === '/' && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Redirect unauthenticated users from protected routes to login
  if (isProtectedRoute && !user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin route protection is handled client-side via auth-context
  // The profile role is fetched after login and checked in admin pages

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
