import 'server-only';
import { get as edgeConfigGet } from '@vercel/edge-config';
import {
  getStaticTenantConfig,
  normalizeConfig,
  type TenantConfig,
} from './tenant-config';
import { resolveDomainContextWithConfig, type DomainContext } from './domain';

// ============================================================
// TENANT CONFIG (SERVER) — baca Vercel Edge Config + resolver async
//
// SERVER-ONLY: jangan diimpor oleh Client Component. Dipakai oleh
// proxy.ts (edge) dan route handler admin domain.
//
// Bentuk item Edge Config `tenant_config` (semua opsional):
// {
//   "baseDomains": ["myplatform.com", "myplatform.ac.id"],
//   "reservedSubdomains": ["sso", "www", "api"],
//   "domainMap": { "clientcompany.com": "spmb", "portal.kampus.id": "default" },
//   "enabledModules": ["spmb", "siakad", "sikeu"]
// }
// ============================================================

interface CacheEntry {
  at: number;
  value: TenantConfig;
}

const TTL_MS = 30_000;
let cache: CacheEntry | null = null;

/**
 * Baca konfigurasi tenant dari Vercel Edge Config.
 *
 * - Fail-open ke konfigurasi statis bila Edge Config tidak tersedia/error,
 *   sehingga routing tetap berjalan (tidak pernah 500 karena config).
 * - Cache singkat di level instance; SDK Edge Config sudah punya cache
 *   internal, TTL ini lapisan tambahan.
 */
export async function getTenantConfig(): Promise<TenantConfig> {
  if (cache && Date.now() - cache.at < TTL_MS) {
    return cache.value;
  }

  let value = getStaticTenantConfig();

  if (process.env.EDGE_CONFIG) {
    try {
      const remote = await edgeConfigGet<Partial<TenantConfig>>('tenant_config');
      value = normalizeConfig(remote);
    } catch {
      value = getStaticTenantConfig();
    }
  }

  cache = { at: Date.now(), value };
  return value;
}

/** Bersihkan cache (setelah update Edge Config dari API handler). */
export function invalidateTenantConfigCache(): void {
  cache = null;
}

/** Resolve konteks tenant dengan Edge Config (server / proxy.ts). */
export async function resolveDomainContextAsync(hostname: string): Promise<DomainContext> {
  const config = await getTenantConfig();
  return resolveDomainContextWithConfig(hostname, config);
}
