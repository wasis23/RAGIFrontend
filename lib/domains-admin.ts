import { timingSafeEqual } from 'node:crypto';
import { get as edgeConfigGet } from '@vercel/edge-config';
import { getVercelConfig, updateEdgeConfigItems, VercelApiError } from './vercel-api';
import { invalidateTenantConfigCache } from './tenant-config.server';

// ============================================================
// DOMAINS ADMIN — guard + tulis pemetaan domain ke Edge Config
// (server-only, runtime Node)
// ============================================================

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export function jsonError(status: number, code: string, message: string): Response {
  return json({ status: 'error', code, message }, status);
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function bearerOf(header: string | null): string {
  if (!header) return '';
  const [scheme, value] = header.split(' ');
  return scheme?.toLowerCase() === 'bearer' && value ? value : '';
}

/**
 * Otorisasi endpoint admin domain.
 *
 * Prioritas: header `x-domains-admin-key` atau `Authorization: Bearer <secret>`
 * dibandingkan (constant-time) dengan env `DOMAINS_ADMIN_SECRET`.
 * Fail-closed: bila secret belum diset, endpoint menolak (503).
 */
export function assertDomainAdmin(req: Request): Response | null {
  const secret = process.env.DOMAINS_ADMIN_SECRET;
  if (!secret) {
    return jsonError(
      503,
      'domains_admin_disabled',
      'DOMAINS_ADMIN_SECRET belum dikonfigurasi; endpoint dinonaktifkan.',
    );
  }
  const provided =
    req.headers.get('x-domains-admin-key') ?? bearerOf(req.headers.get('authorization')) ?? '';
  if (!provided || !safeEqual(provided, secret)) {
    return jsonError(401, 'unauthorized', 'Kunci admin domain tidak valid.');
  }
  return null;
}

export function requireVercelEnv(): ReturnType<typeof getVercelConfig> {
  return getVercelConfig();
}

export const DOMAIN_REGEX =
  /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;

interface StoredTenantConfig {
  domainMap?: Record<string, string>;
  [key: string]: unknown;
}

async function readStoredConfig(): Promise<StoredTenantConfig> {
  if (!process.env.EDGE_CONFIG) return {};
  try {
    const cfg = await edgeConfigGet<StoredTenantConfig>('tenant_config');
    return cfg ?? {};
  } catch {
    return {};
  }
}

/**
 * Upsert pemetaan `domain -> module` ke Edge Config `tenant_config.domainMap`.
 * Mengembalikan false bila EDGE_CONFIG_ID belum dikonfigurasi (domain tetap
 * terdaftar di Vercel, hanya pemetaan runtime belum tersimpan).
 */
export async function upsertDomainMapping(domain: string, module: string): Promise<boolean> {
  const cfg = requireVercelEnv();
  const edgeConfigId = process.env.EDGE_CONFIG_ID;
  if (!cfg || !edgeConfigId) return false;

  const stored = await readStoredConfig();
  const domainMap = { ...(stored.domainMap ?? {}), [domain.toLowerCase()]: module };

  await updateEdgeConfigItems(cfg, edgeConfigId, [
    { operation: 'upsert', key: 'tenant_config', value: { ...stored, domainMap } },
  ]);

  invalidateTenantConfigCache();
  return true;
}

/** Hapus pemetaan domain dari Edge Config. */
export async function removeDomainMapping(domain: string): Promise<boolean> {
  const cfg = requireVercelEnv();
  const edgeConfigId = process.env.EDGE_CONFIG_ID;
  if (!cfg || !edgeConfigId) return false;

  const stored = await readStoredConfig();
  const domainMap = { ...(stored.domainMap ?? {}) };
  delete domainMap[domain.toLowerCase()];

  await updateEdgeConfigItems(cfg, edgeConfigId, [
    { operation: 'upsert', key: 'tenant_config', value: { ...stored, domainMap } },
  ]);

  invalidateTenantConfigCache();
  return true;
}

export function isVercelApiError(err: unknown): err is VercelApiError {
  return err instanceof VercelApiError;
}
