import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { resolveDomainContext } from '@/lib/domain';

// ============================================================
// PROXY — Multi-Tenant subdomain routing (satu codebase)
//
// Pada subdomain modul (mis. siakad.polinus.cloud), root '/' diarahkan
// ke modul terkait. Portal SSO (sso./ragife./apex) tetap default.
// ============================================================

export function proxy(request: NextRequest) {
  const host =
    request.headers.get('x-forwarded-host') ||
    request.headers.get('host') ||
    '';

  const ctx = resolveDomainContext(host);

  if (ctx.isModule && request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL(ctx.modulePath as string, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/'],
};
