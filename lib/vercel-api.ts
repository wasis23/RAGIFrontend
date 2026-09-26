// ============================================================
// VERCEL REST API — helper tipis & type-safe (server-only)
//
// Digunakan oleh app/api/domains/* untuk:
//   - Mendaftarkan/menghapus/memverifikasi custom domain di project.
//   - Menulis pemetaan domain -> modul ke Edge Config (domain_map).
//
// WAJIB dijalankan di runtime Node (route handler admin), bukan edge,
// karena memakai token rahasia. JANGAN pernah mengimpor file ini dari
// Client Component / proxy.ts.
// ============================================================

const API_BASE = 'https://api.vercel.com';

export interface VercelVerificationChallenge {
  type: string;
  domain: string;
  value: string;
  reason?: string;
}

export interface VercelProjectDomain {
  name: string;
  apexName?: string;
  projectId?: string;
  verified: boolean;
  verification?: VercelVerificationChallenge[];
}

interface VercelConfig {
  token: string;
  projectId: string;
  teamId?: string;
}

export class VercelApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'VercelApiError';
  }
}

export function getVercelConfig(): VercelConfig | null {
  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (!token || !projectId) return null;
  return { token, projectId, teamId: process.env.VERCEL_TEAM_ID || undefined };
}

function withTeam(path: string, teamId?: string): string {
  if (!teamId) return path;
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}teamId=${encodeURIComponent(teamId)}`;
}

async function vercelFetch<T>(
  cfg: VercelConfig,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(API_BASE + withTeam(path, cfg.teamId), {
    ...init,
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });

  const text = await res.text();
  const body = text ? (JSON.parse(text) as unknown) : null;

  if (!res.ok) {
    const err = body as { error?: { code?: string; message?: string } } | null;
    throw new VercelApiError(
      res.status,
      err?.error?.code ?? 'vercel_api_error',
      err?.error?.message ?? `Vercel API gagal (${res.status}).`,
    );
  }

  return body as T;
}

/** Tambah custom domain ke project. Mengembalikan challenge verifikasi bila belum terverifikasi. */
export async function addProjectDomain(
  cfg: VercelConfig,
  domain: string,
): Promise<VercelProjectDomain> {
  return vercelFetch<VercelProjectDomain>(
    cfg,
    `/v10/projects/${encodeURIComponent(cfg.projectId)}/domains`,
    {
      method: 'POST',
      body: JSON.stringify({ name: domain }),
    },
  );
}

/** Hapus custom domain dari project. */
export async function removeProjectDomain(cfg: VercelConfig, domain: string): Promise<void> {
  await vercelFetch<unknown>(
    cfg,
    `/v9/projects/${encodeURIComponent(cfg.projectId)}/domains/${encodeURIComponent(domain)}`,
    { method: 'DELETE' },
  );
}

/** Daftar custom domain pada project. */
export async function listProjectDomains(cfg: VercelConfig): Promise<VercelProjectDomain[]> {
  const data = await vercelFetch<{ domains?: VercelProjectDomain[] }>(
    cfg,
    `/v9/projects/${encodeURIComponent(cfg.projectId)}/domains`,
  );
  return data.domains ?? [];
}

/** Picu verifikasi domain (setelah challenge TXT/CNAME dipasang). */
export async function verifyProjectDomain(
  cfg: VercelConfig,
  domain: string,
): Promise<VercelProjectDomain> {
  return vercelFetch<VercelProjectDomain>(
    cfg,
    `/v9/projects/${encodeURIComponent(cfg.projectId)}/domains/${encodeURIComponent(domain)}/verify`,
    { method: 'POST' },
  );
}

// ----------------------------------------------------------------------------
// Edge Config write (pemetaan domain -> modul)
// ----------------------------------------------------------------------------

export interface EdgeConfigItem {
  operation: 'upsert' | 'create' | 'update' | 'delete';
  key: string;
  value?: unknown;
}

/**
 * Tulis item ke Edge Config lewat Vercel API.
 * Membutuhkan EDGE_CONFIG_ID + VERCEL_TOKEN.
 */
export async function updateEdgeConfigItems(
  cfg: VercelConfig,
  edgeConfigId: string,
  items: EdgeConfigItem[],
): Promise<void> {
  await vercelFetch<unknown>(cfg, `/v1/edge-config/${encodeURIComponent(edgeConfigId)}/items`, {
    method: 'PATCH',
    body: JSON.stringify({ items }),
  });
}
