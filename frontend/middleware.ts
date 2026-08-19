import { auth } from '@/server/config/auth';
import { NextResponse } from 'next/server';

// ─── Role → Route Mapping ────────────────────────────────
const ROUTE_PERMISSIONS: Record<string, string[]> = {
  '/dashboard/doctor': ['DOCTOR', 'ADMIN'],
  '/dashboard/nurse': ['NURSE', 'ADMIN'],
  '/dashboard/receptionist': ['RECEPTIONIST', 'ADMIN'],
  '/dashboard/pharmacy': ['PHARMACIST', 'ADMIN'],
  '/dashboard/accountant': ['ACCOUNTANT', 'ADMIN'],
  '/dashboard/admin': ['ADMIN'],
  '/api/doctor': ['DOCTOR', 'ADMIN'],
  '/api/nurse': ['NURSE', 'ADMIN'],
  '/api/receptionist': ['RECEPTIONIST', 'ADMIN'],
  '/api/pharmacy': ['PHARMACIST', 'ADMIN'],
  '/api/accountant': ['ACCOUNTANT', 'ADMIN', 'RECEPTIONIST'],
  '/api/admin': ['ADMIN'],
  '/dashboard/patient': ['DOCTOR', 'RECEPTIONIST', 'NURSE', 'PHARMACIST', 'ACCOUNTANT', 'ADMIN'],
};

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;

  // Public routes
  const isPublicRoute =
    nextUrl.pathname === '/' ||
    nextUrl.pathname.startsWith('/api/auth');

  if (isPublicRoute) {
    if (isLoggedIn && nextUrl.pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', nextUrl));
    }
    return NextResponse.next();
  }

  // Protected routes require authentication
  if (!isLoggedIn) {
    const loginUrl = new URL('/', nextUrl);
    loginUrl.searchParams.set('callbackUrl', nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check role-based access for specific routes
  for (const [routePrefix, allowedRoles] of Object.entries(ROUTE_PERMISSIONS)) {
    // Only match exact routes or exact subpaths (e.g. /api/doctor or /api/doctor/...)
    // This prevents /api/doctors from accidentally matching /api/doctor
    if (nextUrl.pathname === routePrefix || nextUrl.pathname.startsWith(`${routePrefix}/`)) {
      if (!userRole || !allowedRoles.includes(userRole)) {
        const dashboardUrl = new URL('/dashboard', nextUrl);
        dashboardUrl.searchParams.set('error', 'unauthorized');
        return NextResponse.redirect(dashboardUrl);
      }
      break;
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
