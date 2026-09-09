import { ROUTES, TOKEN_KEY } from './constants';

// ============================================================
// DOMAIN / SUBDOMAIN RESOLUTION — Multi-Tenant Frontend (satu codebase)
//
// Konteks tenant ditentukan dari hostname:
//   sso.polinus.cloud      -> portal SSO (default)
//   siakad.polinus.cloud   -> modul SIAKAD
//   sikeu.polinus.cloud    -> modul SIKEU
//   <module>.polinus.cloud -> <module>
//
// Backend tetap single-tenant (satu API_BASE_URL). FE hanya
// menentukan landing & konteks modul berdasarkan subdomain.
// ============================================================

export const BASE_DOMAINS = ['polinus.cloud', 'polinus.ac.id', 'ragi.cloud'];

// Subdomain yang BUKAN modul (dianggap portal SSO default)
export const RESERVED_SUBDOMAINS = new Set([
  'sso',
  'www',
  'api',
  'mail',
  'webmail',
  'ftp',
  'cloudflare',
  'ragife',
  'ragibe',
  'localhost',
]);

// Label tampilan per modul (untuk branding navbar/header)
export const MODULE_LABELS: Record<string, string> = {
  iam: 'IAM & Auth Center',
  spmb: 'SPMB',
  siakad: 'SIAKAD',
  obe: 'OBE',
  simpi: 'SIMPI',
  simanta: 'SIMANTA',
  simpreskul: 'SIMPRESKUL',
  sikeu: 'SIKEU',
  simpeg: 'SIMPEG',
  sippm: 'SIPPM',
  lms: 'LMS',
  sinapra: 'SINAPRA',
  kerjasama: 'Kerjasama',
  upm: 'UPM',
};

export interface DomainContext {
  hostname: string;
  baseDomain: string;
  subdomain: string;
  effectiveSubdomain: string;
  moduleSlug: string | null;
  modulePath: string | null;
  moduleLabel: string | null;
  isModule: boolean;
  isDefault: boolean;
  isDemo: boolean;
}

/**
 * Resolve konteks tenant dari hostname (framework-agnostic & pure,
 * aman dipakai di proxy.ts (server) maupun komponen client).
 * Mendukung deteksi lingkungan Demo (prefix 'demo-').
 */
export function resolveDomainContext(hostname: string): DomainContext {
  const host = (hostname || '').trim().toLowerCase().split(':')[0];

  let baseDomain = '';
  let subdomain = '';

  for (const bd of BASE_DOMAINS) {
    if (host === bd) {
      baseDomain = bd;
      subdomain = '';
      break;
    }
    if (host.endsWith(`.${bd}`)) {
      baseDomain = bd;
      subdomain = host.slice(0, -(bd.length + 1));
      break;
    }
  }

  // Fallback: host tidak dikenal -> ambil label pertama sebagai subdomain
  if (!baseDomain) {
    const parts = host.split('.');
    subdomain = parts.length > 1 ? parts[0] : '';
  }

  const sub = subdomain.toLowerCase();
  const isDemo = sub.startsWith('demo-');
  const effectiveSub = isDemo ? sub.slice(5) : sub;
  const isReserved = effectiveSub === '' || RESERVED_SUBDOMAINS.has(effectiveSub);
  const moduleSlug = isReserved ? null : effectiveSub;
  const modulePath = moduleSlug ? `/${moduleSlug}` : null;

  return {
    hostname: host,
    baseDomain,
    subdomain: sub,
    effectiveSubdomain: effectiveSub,
    moduleSlug,
    modulePath,
    moduleLabel: moduleSlug
      ? MODULE_LABELS[moduleSlug] ?? moduleSlug.toUpperCase()
      : null,
    isModule: moduleSlug !== null,
    isDefault: moduleSlug === null,
    isDemo,
  };
}

/**
 * Halaman landing default setelah login.
 * - Subdomain modul  -> /<module>
 * - Portal SSO        -> /dashboard
 */
export function getDefaultLandingPath(hostname: string): string {
  const ctx = resolveDomainContext(hostname);
  return ctx.modulePath ?? ROUTES.DASHBOARD;
}

/**
 * Ambil konteks tenant saat ini (client-side).
 * Di server (SSR/SSG) mengembalikan konteks default.
 */
export function getCurrentDomainContext(): DomainContext {
  if (typeof window === 'undefined') return resolveDomainContext('');
  return resolveDomainContext(window.location.hostname);
}

/**
 * Dapatkan atribut cookie domain (misal: "domain=.polinus.cloud; " atau "")
 * agar cookie SSO dapat diakses oleh seluruh subdomain (*.polinus.cloud).
 */
export function getCookieDomain(hostname?: string): string {
  if (typeof window === 'undefined' && !hostname) return '';
  const host = (hostname || (typeof window !== 'undefined' ? window.location.hostname : '')).trim().toLowerCase().split(':')[0];
  const ctx = resolveDomainContext(host);
  if (ctx.baseDomain) {
    return `domain=.${ctx.baseDomain}; `;
  }
  return '';
}

/**
 * Baca nilai cookie dari document.cookie berdasarkan nama.
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Buat URL modul berdasarkan konteks multi-tenant:
 * - Di lingkungan domain (mis. sso.polinus.cloud):
 *     getModuleUrl('siakad') -> "https://siakad.polinus.cloud"
 *     getModuleUrl('sso')    -> "https://sso.polinus.cloud/dashboard"
 *     getModuleUrl('siakad', '/krs') -> "https://siakad.polinus.cloud/krs"
 * - Di lingkungan lokal (localhost / IP tanpa base domain terdaftar):
 *     getModuleUrl('siakad') -> "/siakad"
 *     getModuleUrl('sso')    -> "/dashboard"
 *     getModuleUrl('siakad', '/krs') -> "/siakad/krs"
 */
export function getModuleUrl(moduleCode: string, path: string = '', currentHostname?: string): string {
  const host = (currentHostname || (typeof window !== 'undefined' ? window.location.hostname : '')).trim().toLowerCase().split(':')[0];
  const ctx = resolveDomainContext(host);
  const code = (moduleCode || '').toLowerCase().trim();

  let cleanPath = path.trim();
  if (cleanPath && !cleanPath.startsWith('/')) {
    cleanPath = `/${cleanPath}`;
  }

  // Jika di localhost / non-base domain, gunakan relative path internal
  if (!ctx.baseDomain) {
    if (RESERVED_SUBDOMAINS.has(code)) {
      return cleanPath || ROUTES.DASHBOARD;
    }
    return `/${code}${cleanPath}`;
  }

  const protocol = typeof window !== 'undefined' && window.location.protocol ? window.location.protocol : 'https:';
  const prefix = ctx.isDemo ? 'demo-' : '';

  // Jika target adalah portal SSO / domain default
  if (RESERVED_SUBDOMAINS.has(code)) {
    const ssoPath = cleanPath || ROUTES.DASHBOARD;
    return `${protocol}//${prefix}sso.${ctx.baseDomain}${ssoPath.startsWith('/') ? ssoPath : `/${ssoPath}`}`;
  }

  // Jika target adalah subdomain modul (misal siakad, sikeu, spmb)
  // Potong prefix `/${code}` jika ada di path agar tidak menjadi siakad.polinus.cloud/siakad
  if (cleanPath === `/${code}`) {
    cleanPath = '';
  } else if (cleanPath.startsWith(`/${code}/`)) {
    cleanPath = cleanPath.slice(code.length + 1);
  }

  return `${protocol}//${prefix}${code}.${ctx.baseDomain}${cleanPath || ''}`;
}

/**
 * Dapatkan nama cookie / key token otentikasi berdasarkan lingkungan:
 * - Lingkungan Demo     -> 'demo_sso_access_token'
 * - Lingkungan Produksi -> 'sso_access_token' (TOKEN_KEY)
 */
export function getAuthTokenKey(isDemo?: boolean, hostname?: string): string {
  if (typeof isDemo === 'boolean') {
    return isDemo ? 'demo_sso_access_token' : TOKEN_KEY;
  }
  const host = hostname || (typeof window !== 'undefined' ? window.location.hostname : '');
  const ctx = resolveDomainContext(host);
  return ctx.isDemo ? 'demo_sso_access_token' : TOKEN_KEY;
}


