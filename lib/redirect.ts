import { getStaticTenantConfig } from './tenant-config';

const MAX_REDIRECT_LENGTH = 2048;

/**
 * Allowlist pasca-login (mitigasi open redirect / F-001).
 *
 * Hanya mengembalikan target yang aman dinavigasi setelah login:
 *  1. Path relatif internal (`/dashboard`, `/spmb/...`) — tolak `//evil`,
 *     `/\evil`, backslash, dan karakter kontrol.
 *  2. URL absolut http(s) yang host-nya sama dengan host saat ini, ATAU
 *     subdomain dari base domain terdaftar (mis. siakad.ragispace.com saat
 *     login di sso.ragispace.com), ATAU host dev lokal.
 *
 * Mengembalikan `null` bila target tidak aman — pemanggil WAJIB fallback
 * ke landing default, jangan pernah menavigasi ke input mentah.
 */
export function getSafeRedirectTarget(
  raw: string | null | undefined,
  currentHostname?: string,
): string | null {
  if (!raw) return null;
  const target = raw.trim();
  if (!target || target.length > MAX_REDIRECT_LENGTH) return null;
  if (/[\u0000-\u001f\u007f\\]/.test(target)) return null;

  // Path relatif internal. Tolak protocol-relative (`//evil.com`) dan `/\...`.
  if (target.startsWith('/')) {
    if (target.startsWith('//') || target.startsWith('/\\')) return null;
    return target;
  }

  // Tolak scheme relatif lain (`javascript:`, `data:`, `//host`, dsb).
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(target) || target.startsWith('//')) {
    // Izinkan hanya http(s) absolut — selebihnya tolak di bawah.
    if (!/^https?:\/\//i.test(target)) return null;
  } else {
    // Bukan path absolut dan bukan URL absolut (mis. `evil.com/path`)
    // — tolak; browser akan menganggapnya path relatif yang ambigu.
    // Hmm: string tanpa scheme & tanpa leading slash tidak pernah valid
    // sebagai target aman di sini.
    return null;
  }

  let url: URL;
  try {
    url = new URL(target);
  } catch {
    return null;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  // Tolak userinfo (`https://legit@evil`) — pola phishing klasik.
  if (url.username || url.password) return null;

  const current = (currentHostname || (typeof window !== 'undefined' ? window.location.hostname : ''))
    .trim()
    .toLowerCase()
    .split(':')[0];
  const host = url.hostname.toLowerCase();
  if (!host) return null;

  // 1. Host yang sama persis (termasuk localhost/IP/port apa pun).
  if (current && host === current) return url.toString();

  // 2. Host dev lokal.
  if (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '[::1]' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.test')
  ) {
    return url.toString();
  }

  // 3. Subdomain dari base domain terdaftar (multi-tenant).
  const baseDomains = getStaticTenantConfig().baseDomains.map((d) => d.toLowerCase());
  for (const base of baseDomains) {
    if (!base) continue;
    if (host === base || host.endsWith(`.${base}`)) {
      return url.toString();
    }
  }

  return null;
}

/**
 * Resolve target navigasi pasca-login: kembalikan target aman, atau fallback.
 */
export function resolvePostLoginRedirect(
  raw: string | null | undefined,
  fallback: string,
  currentHostname?: string,
): string {
  return getSafeRedirectTarget(raw, currentHostname) ?? fallback;
}
