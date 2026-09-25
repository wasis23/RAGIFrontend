# Arsitektur Multi-Tenant Frontend (Vercel)

> **Model**: satu codebase Next.js melayani banyak "tenant". Pada proyek ini tenant
> = **modul** (`spmb`, `siakad`, `sikeu`, ...). Backend tetap **single-tenant**
> (`integrated_sistem_backend`); FE hanya memetakan hostname -> modul lalu
> me-rewrite path. Tidak ada database di FE.

---

## 1. Alur Routing

```
Request host                      Resolusi (lib/domain.ts)          Aksi (proxy.ts)
--------------------------------  --------------------------------  ------------------------------------
localhost:3000                    default (portal)                  next()
spmb.localhost:3000               module=spmb (dev)                 rewrite /foo -> /spmb/foo
example.com                       default (portal)                  next()
spmb.example.com                  module=spmb (subdomain)           rewrite /foo -> /spmb/foo
clientcompany.com                 custom domain -> spmb             rewrite /foo -> /spmb/foo
portal.kampus.id                  domainMap "default"               next() (portal)
project-xxx.vercel.app            platform host                     next() (preview aman)
host tak dikenal                  isUnknownDomain                   redirect ke sso.<baseDomain>
```

Deteksi environment demo (`demo-spmb.example.com`, `demo.example.com`) tetap
didukung seperti sebelumnya.

## 2. Struktur `app/`

```
app/
  layout.tsx                     # root layout global
  page.tsx                       # landing root -> redirect /login
  api/
    domains/
      route.ts                   # GET/POST/DELETE kelola custom domain (admin)
      [domain]/verify/route.ts   # POST verifikasi domain
  (auth)/                        # route group publik: login, register, dll.
  (main)/                        # route group aplikasi (ber-sidebar)
    spmb/…                       # /spmb/...       (juga diakses via spmb.<root>)
    siakad/…                     # /siakad/...
    sikeu/…                      # /sikeu/...
lib/
  tenant-config.ts               # tipe + config statis (CLIENT-SAFE)
  tenant-config.server.ts        # baca Edge Config (server-only)
  domain.ts                      # resolver hostname -> DomainContext
  vercel-api.ts                  # wrapper Vercel REST API (Domains + Edge Config write)
  domains-admin.ts               # guard admin + tulis mapping
proxy.ts                         # Proxy (Middleware) Next.js 16 — pengganti middleware.ts
```

> **Catatan Next.js 16**: file `middleware.ts` telah berganti nama menjadi
> `proxy.ts` (fungsinya sama). Jangan buat `middleware.ts`.

## 3. Skema Vercel Edge Config

Key: `tenant_config` (satu JSON):

```json
{
  "baseDomains": ["example.com", "example.ac.id"],
  "reservedSubdomains": ["sso", "www", "api", "mail", "demo"],
  "domainMap": {
    "clientcompany.com": "spmb",
    "portal.kampus.id": "default"
  },
  "enabledModules": ["spmb", "siakad", "sikeu", "simpeg", "sinapra"]
}
```

- `domainMap`: hostname (tanpa scheme/port) -> slug modul, atau `"default"`.
- Perubahan berlaku tanpa redeploy (SDK Edge Config read + TTL 30s).
- Pemetaan custom domain otomatis di-upsert ke key ini oleh `POST /api/domains`.

## 4. API Kelola Domain (admin)

Semua endpoint butuh header `x-domains-admin-key: <DOMAINS_ADMIN_SECRET>`
(atau `Authorization: Bearer <secret>`).

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/api/domains` | Daftar custom domain project + modul terkait |
| POST | `/api/domains` | `{ "domain": "client.com", "module": "spmb" }` -> daftar ke Vercel + simpan mapping |
| DELETE | `/api/domains?domain=client.com` | Hapus domain dari project + mapping |
| POST | `/api/domains/client.com/verify` | Picu verifikasi domain |

Contoh:

```bash
curl -X POST https://sso.example.com/api/domains \
  -H "x-domains-admin-key: $DOMAINS_ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"domain":"clientcompany.com","module":"spmb"}'
```

Respons berisi `verification` (TXT/CNAME challenge) bila domain belum terverifikasi.

## 5. Environment Variables

Lihat `.env.example`. Ringkas:

| Var | Fungsi |
|---|---|
| `EDGE_CONFIG` | Connection string baca Edge Config (read) |
| `EDGE_CONFIG_ID` | ID Edge Config untuk **write** mapping |
| `VERCEL_TOKEN` | Token Vercel (Domains API + Edge Config write) |
| `VERCEL_PROJECT_ID` | ID/nama project Vercel |
| `VERCEL_TEAM_ID` | Opsional (jika project di Team) |
| `DOMAINS_ADMIN_SECRET` | Kunci admin endpoint `/api/domains` |
| `TENANT_BASE_DOMAINS` / `NEXT_PUBLIC_BASE_DOMAINS` | Root domain |

---

## 6. Checklist DNS & Dashboard Vercel

### 6.1 Wildcard Subdomain (modul)

Di **Vercel > Project > Settings > Domains**:
1. Tambah `example.com` (apex) untuk portal.
2. Tambah `*.example.com` (wildcard) untuk subdomain modul.
3. Tambah `sso.example.com` bila portal memakai `sso`.

Record DNS di registrar/DNS provider:

| Tipe | Name | Value |
|---|---|---|
| A | `@` | `76.76.21.21` |
| CNAME | `*` | `cname.vercel-dns.com` |
| CNAME | `sso` | `cname.vercel-dns.com` |
| CNAME | `www` | `cname.vercel-dns.com` |

> Untuk apex, ikuti nilai persis dari dashboard Vercel (bisa `A 76.76.21.21`
> atau ALIAS/ANAME `cname.vercel-dns.com` tergantung provider).

### 6.2 Custom Domain Tenant `clientcompany.com`

1. Panggil `POST /api/domains` (atau tambahkan manual di Vercel Domains).
2. Vercel memberi challenge. Pasang di DNS `clientcompany.com`:

| Tipe | Name | Value |
|---|---|---|
| A | `@` | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com` |

3. Bila diminta verifikasi kepemilikan (TXT):

| Tipe | Name | Value |
|---|---|---|
| TXT | `_vercel` | `vc-domain-verify=...` (dari respons `verification`) |
| TXT | `@` | `vercel-challenge-...` (bila `verification.type = TXT`) |

4. Verifikasi: `POST /api/domains/clientcompany.com/verify` atau tombol
   **Verify** di dashboard Vercel.

### 6.3 Kalau domain dikelola Cloudflare
- Wildcard CNAME wajib **DNS only (grey cloud)**.
- Set SSL/TLS mode **Full (strict)**.
- Jangan aktifkan "Proxy" pada `*` untuk menghindari konflik validasi Vercel.

---

## 7. Dev Lokal

Cukup akses subdomain `.localhost` (tidak perlu ubah `hosts`):

```
http://localhost:3000          -> portal
http://spmb.localhost:3000     -> modul SPMB (rewrite ke /spmb)
http://siakad.localhost:3000   -> modul SIAKAD
```

Alternatif tanpa DNS: `http://spmb.127.0.0.1.nip.io:3000`.

## 8. Isolasi Data (FE-only)

Karena backend tunggal, FE **tidak** memiliki database. Isolasi data adalah
tanggung jawab backend. FE menyampaikan konteks tenant lewat header:

- Di **Server Components**: `headers().get('x-tenant-module')` (di-set oleh `proxy.ts`).
- Di **client / request ke BE**: `getTenantHeaders()` dari `lib/domain.ts`
  mengembalikan `{ 'x-tenant-host', 'x-tenant-module' }` untuk dilampirkan
  pada pemanggilan API bila backend ingin men-scope query per modul.

Backend tetap wajib memvalidasi otorisasi (RBAC) — header tenant tidak boleh
dipercaya mentah tanpa verifikasi sesi pengguna.

## 9. Keamanan

- `VERCEL_TOKEN` & `DOMAINS_ADMIN_SECRET` **hanya** dipakai di route handler
  `runtime = 'nodejs'`; tidak pernah dikirim ke client.
- Perbandingan kunci admin memakai `crypto.timingSafeEqual` (anti timing attack).
- Fail-closed: bila `DOMAINS_ADMIN_SECRET` belum diset, endpoint mengembalikan 503.
- `@vercel/edge-config` hanya diimpor dari file `*.server.ts` (dilindungi
  `server-only`) agar tidak bocor ke bundle client.
- Apex domain pihak ketiga yang belum dipetakan tidak diperlakukan sebagai modul.
