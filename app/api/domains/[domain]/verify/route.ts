import type { NextRequest } from 'next/server';
import {
  assertDomainAdmin,
  json,
  jsonError,
  isVercelApiError,
  requireVercelEnv,
} from '@/lib/domains-admin';
import { verifyProjectDomain } from '@/lib/vercel-api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** POST /api/domains/:domain/verify — picu verifikasi domain di Vercel. */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ domain: string }> },
): Promise<Response> {
  const denied = assertDomainAdmin(req);
  if (denied) return denied;

  const cfg = requireVercelEnv();
  if (!cfg) {
    return jsonError(503, 'vercel_not_configured', 'VERCEL_TOKEN / VERCEL_PROJECT_ID belum dikonfigurasi.');
  }

  const { domain: raw } = await ctx.params;
  const domain = decodeURIComponent(raw ?? '').trim().toLowerCase();
  if (!domain) {
    return jsonError(422, 'invalid_domain', 'Domain tidak valid.');
  }

  try {
    const result = await verifyProjectDomain(cfg, domain);
    return json({
      status: 'success',
      message: result.verified ? 'Domain berhasil diverifikasi.' : 'Verifikasi belum selesai.',
      data: {
        domain: result.name,
        verified: result.verified,
        verification: result.verification ?? [],
      },
    });
  } catch (err) {
    if (isVercelApiError(err)) {
      return jsonError(err.status, err.code, err.message);
    }
    return jsonError(500, 'internal_error', 'Terjadi kesalahan internal.');
  }
}
