import { NextRequest, NextResponse } from 'next/server';

// ============================================================
// MIDDLEWARE — Route protection untuk SSO Campus
// Mengamankan protected routes di server-side berdasarkan cookie
// ============================================================

// Route yang bisa diakses tanpa login
const PUBLIC_ROUTES = [
  '/login',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/mfa',
];

// Route yang hanya bisa diakses role admin
const ADMIN_ROUTES = [
  '/admin',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Izinkan akses ke file statis dan route Next.js internal
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('sso_access_token')?.value;
  const userType = request.cookies.get('sso_user_type')?.value;

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
  const isAdminRoute = ADMIN_ROUTES.some((route) => pathname.startsWith(route));

  // ── 1. Jika sudah login dan mencoba akses public route → redirect ke dashboard
  if (isPublicRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // ── 2. Jika belum login dan mencoba akses protected route → redirect ke login
  if (!isPublicRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    // Simpan URL tujuan agar bisa redirect setelah login
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── 3. Jika login tapi bukan admin dan mencoba akses /admin/* → redirect ke dashboard
  if (isAdminRoute && token && userType !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // ── 4. Redirect root "/" ke dashboard jika sudah login, atau ke login jika belum
  if (pathname === '/') {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Terapkan middleware ke semua route kecuali file statis
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
