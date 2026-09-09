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

    // 2a. Root path '/' -> rewrite internal ke '/siakad' (URL browser tetap siakad.polinus.cloud)
    if (pathname === '/') {
      return NextResponse.rewrite(new URL(modPath, request.url));
    }

    // 2b. Mengakses langsung '/siakad' di subdomain siakad -> redirect ke '/'
    if (pathname === modPath) {
      const targetUrl = new URL('/', request.url);
      targetUrl.search = request.nextUrl.search;
      return NextResponse.redirect(targetUrl);
    }

    // 2c. Mengakses '/siakad/xyz' di subdomain siakad -> redirect ke '/xyz'
    if (pathname.startsWith(`${modPath}/`)) {
      const cleanPath = pathname.slice(modPath.length);
      const targetUrl = new URL(cleanPath, request.url);
      targetUrl.search = request.nextUrl.search;
      return NextResponse.redirect(targetUrl);
    }

    // 2d. Subpath bersih (misal '/krs', '/dashboard', '/nilai')
    // Rewrite internal ke '/siakad/krs', dsb.
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

    if (!isExcluded && !pathname.startsWith('/api/')) {
      const internalPath = `${modPath}${pathname}`;
      return NextResponse.rewrite(new URL(internalPath, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};

