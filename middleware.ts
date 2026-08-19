import { NextRequest, NextResponse } from 'next/server';

// ============================================================
// MIDDLEWARE — Route protection & Subdomain Routing (SSO Campus)
// ============================================================

const PUBLIC_ROUTES = [
  '/login',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/mfa',
  '/register', // Untuk SPMB
];

const ADMIN_ROUTES = [
  '/admin',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  const isSpmb = hostname.startsWith('spmb.');
  const isSimpeg = hostname.startsWith('simpeg.');

  // Izinkan akses ke file statis dan route Next.js internal
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('sso_access_token')?.value;
  const userRole = request.cookies.get('sso_user_role')?.value;

  // SPMB / SIMPEG root "/" adalah landing page / dashboard, bukan auth route
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route)) || ((isSpmb || isSimpeg) && pathname === '/');
  const isAdminRoute = ADMIN_ROUTES.some((route) => pathname.startsWith(route));

  // ── 1. Jika sudah login dan mencoba akses public route (auth) → redirect ke dashboard
  if (PUBLIC_ROUTES.some(r => pathname.startsWith(r)) && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // ── 2. Jika belum login dan mencoba akses protected route → redirect ke login
  if (!isPublicRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── 3. Jika login tapi bukan admin dan mencoba akses /admin/* → redirect ke dashboard
  if (isAdminRoute && token && userRole !== 'admin' && userRole !== 'superadmin') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // ── 4. Redirect root "/" Main App
  if (!isSpmb && !isSimpeg && pathname === '/') {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // ── 5. SUBDOMAIN REWRITE LOGIC
  if (isSpmb) {
    return NextResponse.rewrite(new URL(`/spmb${pathname}`, request.url));
  }
  if (isSimpeg) {
    return NextResponse.rewrite(new URL(`/simpeg${pathname}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
