import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { resolveDomainContext, MODULE_LABELS, RESERVED_SUBDOMAINS } from '@/lib/domain';

// ============================================================
// PROXY — Multi-Tenant Subdomain Routing (Next.js 16)
//
// 1. Pada domain SSO / portal default (mis. sso.polinus.cloud / ragife.polinus.cloud):
//    Akses ke path modul (/siakad, /sikeu, dll.) dialihkan (307 redirect)
//    ke subdomain modul terkait (siakad.polinus.cloud, sikeu.polinus.cloud).
//
// 2. Pada subdomain modul (mis. siakad.polinus.cloud):
//    - Root '/' di-rewrite secara internal ke '/siakad' agar URL tetap bersih.
//    - Path eksplisit '/siakad' di-redirect ke '/' agar tidak duplikasi.
//    - Subpath '/siakad/xyz' di-redirect ke '/xyz'.
//    - Subpath bersih '/xyz' di-rewrite secara internal ke '/siakad/xyz'.
// ============================================================

export function proxy(request: NextRequest) {
  // 0. Cegah re-processing jika request sudah pernah di-rewrite secara internal
  if (request.headers.get('x-proxy-rewritten') === '1') {
    return NextResponse.next();
  }

  const host =
    request.headers.get('x-forwarded-host') ||
    request.headers.get('host') ||
    '';

  const ctx = resolveDomainContext(host);
  const { pathname } = request.nextUrl;

  // Kasus 1: Permintaan berada di domain SSO / portal default
  if (ctx.baseDomain && ctx.isDefault) {
    const firstSegment = pathname.split('/')[1]?.toLowerCase();
    if (firstSegment && firstSegment in MODULE_LABELS && !RESERVED_SUBDOMAINS.has(firstSegment)) {
      const restPath = pathname.slice(firstSegment.length + 1);
      const targetUrl = new URL(restPath || '/', `https://${firstSegment}.${ctx.baseDomain}`);
      targetUrl.search = request.nextUrl.search;
      return NextResponse.redirect(targetUrl);
    }
  }

  // Kasus 2: Permintaan berada di subdomain modul (misal siakad.polinus.cloud)
  if (ctx.isModule && ctx.moduleSlug) {
    const modSlug = ctx.moduleSlug;
    const modPath = ctx.modulePath as string; // misal '/siakad'

    // 2a. Jika pathname sudah memiliki prefix modul (misal '/siakad' atau '/siakad/krs'),
    // langsung lanjutkan tanpa rewrite/redirect agar tidak terjadi redirect loop
    if (pathname === modPath || pathname.startsWith(`${modPath}/`)) {
      return NextResponse.next();
    }

    // 2b. Abaikan rute auth & system global (login, profile, api, dll.)
    const isExcluded = [
      '/login',
      '/register',
      '/forgot-password',
      '/reset-password',
      '/profile',
      '/mfa',
      '/not-found',
      '/unauthorized',
      '/error',
    ].some((p) => pathname === p || pathname.startsWith(`${p}/`));

    if (isExcluded || pathname.startsWith('/api/')) {
      return NextResponse.next();
    }

    // Pasang penanda request header pada rewrite internal
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-proxy-rewritten', '1');

    // 2c. Root path '/' -> rewrite internal ke modPath (misal '/siakad')
    if (pathname === '/') {
      const targetUrl = new URL(modPath, request.url);
      targetUrl.search = request.nextUrl.search;
      return NextResponse.rewrite(targetUrl, {
        request: {
          headers: requestHeaders,
        },
      });
    }

    // 2d. Subpath bersih (misal '/krs', '/dashboard', '/nilai')
    // Rewrite internal ke modPath + pathname (misal '/siakad/krs')
    const internalPath = `${modPath}${pathname}`;
    const targetUrl = new URL(internalPath, request.url);
    targetUrl.search = request.nextUrl.search;
    return NextResponse.rewrite(targetUrl, {
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};

