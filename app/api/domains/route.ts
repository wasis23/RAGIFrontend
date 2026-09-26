import type { NextRequest } from 'next/server';
import {
  DOMAIN_REGEX,
  assertDomainAdmin,
  json,
  jsonError,
  isVercelApiError,
  removeDomainMapping,
  requireVercelEnv,
  upsertDomainMapping,
} from '@/lib/domains-admin';
import { addProjectDomain, listProjectDomains, removeProjectDomain } from '@/lib/vercel-api';
import { getTenantConfig } from '@/lib/tenant-config.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function handleError(err: unknown): Response {
  if (isVercelApiError(err)) {
    return jsonError(err.status, err.code, err.message);
  }
  return jsonError(500, 'internal_error', 'Terjadi kesalahan internal.');
}

/** GET /api/domains — daftar custom domain project + modul terkait. */
export async function GET(req: NextRequest): Promise<Response> {
  const denied = assertDomainAdmin(req);
  if (denied) return denied;

  const cfg = requireVercelEnv();
  if (!cfg) {
    return jsonError(503, 'vercel_not_configured', 'VERCEL_TOKEN / VERCEL_PROJECT_ID belum dikonfigurasi.');
  }

  try {
    const [domains, config] = await Promise.all([listProjectDomains(cfg), getTenantConfig()]);
    const data = domains.map((d) => ({
      domain: d.name,
      apexName: d.apexName ?? null,
      verified: d.verified,
      module: config.domainMap[d.name.toLowerCase()] ?? null,
      verification: d.verification ?? [],
    }));
    return json({ status: 'success', data });
  } catch (err) {
    return handleError(err);
  }
}

/** POST /api/domains — daftarkan custom domain ke project + petakan ke modul. */
export async function POST(req: NextRequest): Promise<Response> {
  const denied = assertDomainAdmin(req);
  if (denied) return denied;

  const cfg = requireVercelEnv();
  if (!cfg) {
    return jsonError(503, 'vercel_not_configured', 'VERCEL_TOKEN / VERCEL_PROJECT_ID belum dikonfigurasi.');
  }

  let body: { domain?: string; module?: string };
  try {
    body = (await req.json()) as { domain?: string; module?: string };
  } catch {
    return jsonError(400, 'invalid_json', 'Body harus berupa JSON.');
  }

  const domain = (body.domain ?? '').trim().toLowerCase();
  const module = (body.module ?? '').trim().toLowerCase();

  if (!domain || !DOMAIN_REGEX.test(domain)) {
    return jsonError(422, 'invalid_domain', 'Format domain tidak valid.');
  }
  if (module !== 'default') {
    const config = await getTenantConfig();
    if (!config.enabledModules.includes(module)) {
      return jsonError(422, 'invalid_module', `Modul "${module}" tidak dikenal/tidak aktif.`);
    }
  }

  try {
    const result = await addProjectDomain(cfg, domain);
    const mappingSaved = await upsertDomainMapping(domain, module);

    return json(
      {
        status: 'success',
        message: result.verified
          ? 'Domain terdaftar dan sudah terverifikasi.'
          : 'Domain terdaftar. Selesaikan verifikasi DNS.',
        data: {
          domain: result.name,
          module,
          verified: result.verified,
          mapping_saved: mappingSaved,
          verification: result.verification ?? [],
        },
      },
      result.verified ? 200 : 202,
    );
  } catch (err) {
    return handleError(err);
  }
}

/** DELETE /api/domains?domain=example.com — lepas domain dari project & pemetaan. */
export async function DELETE(req: NextRequest): Promise<Response> {
  const denied = assertDomainAdmin(req);
  if (denied) return denied;

  const cfg = requireVercelEnv();
  if (!cfg) {
    return jsonError(503, 'vercel_not_configured', 'VERCEL_TOKEN / VERCEL_PROJECT_ID belum dikonfigurasi.');
  }

  const domain = (req.nextUrl.searchParams.get('domain') ?? '').trim().toLowerCase();
  if (!domain || !DOMAIN_REGEX.test(domain)) {
    return jsonError(422, 'invalid_domain', 'Query parameter `domain` tidak valid.');
  }

  try {
    await removeProjectDomain(cfg, domain);
    const mappingRemoved = await removeDomainMapping(domain);
    return json({
      status: 'success',
      message: 'Domain dilepas dari project.',
      data: { domain, mapping_removed: mappingRemoved },
    });
  } catch (err) {
    return handleError(err);
  }
}
