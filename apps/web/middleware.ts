import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

const PUBLIC_PATHS = ['/auth/login', '/kiosk'];
const SESSION_COOKIE = 'vms_session';

/**
 * Route-level auth guard.
 * Protects /admin and /receptionist — redirects unauthenticated users to login.
 * Also enforces role-based access: Receptionist cannot access /admin pages.
 */
export async function middleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;

  // Allow public and static paths through
  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/'
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifyToken(token) : null;

  // Not authenticated → send to login
  if (!session) {
    const loginUrl = new URL('/auth/login', req.url);
    loginUrl.searchParams.set('redirected', '1');
    return NextResponse.redirect(loginUrl);
  }

  // Role guard: Receptionist cannot access /admin
  if (pathname.startsWith('/admin') && session.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/receptionist', req.url));
  }

  // Role guard: Admin trying to access /receptionist is fine (admins can do everything)
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/receptionist/:path*'],
};
