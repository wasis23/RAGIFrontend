# Alur Branch: `main` (kerja tim) → `vercel` (deploy)

- **`main`** — branch kerja tim. Semua fitur/perbaikan di-merge ke sini.
- **`vercel`** — branch deploy. Vercel men-deploy dari branch ini
  (Project Settings → Git → **Production Branch = `vercel`**).
- `vercel` = `main` + commit khusus deploy (multi-tenant routing, anti-bot
  Turnstile, penyesuaian build). Karena itu, setiap `main` bertambah,
  `vercel` harus disinkronkan.

## Sinkronisasi (main → vercel)

Cara cepat:

```bash
bash scripts/sync-vercel.sh          # merge + push
bash scripts/sync-vercel.sh --dry    # hanya cek, tanpa merge/push
```

Manual:

```bash
git checkout vercel
git fetch origin
git merge origin/main -m "merge: sinkronkan main ke vercel"
git push origin vercel        # origin punya 2 push URL (wasis + Akhyar11)
```

## Catatan penting

1. **Jangan push langsung ke `vercel`** untuk fitur. Kerjakan di `main`,
   lalu sinkronkan — supaya branch tidak divergen.
2. **Pre-commit audit** berjalan saat merge dan menilai kode dari `main`.
   Bila ditolak karena kode pihak lain, perbaiki di `main`, bukan di `vercel`.
3. **Jangan kill** proses `git merge`/`commit` di tengah jalan (bisa merusak
   index). Bila terjadi error `unable to read <sha>`:
   `rm .git/index && git reset`.
4. Vercel hanya men-deploy saat `vercel` berubah. Setelah `git push origin vercel`,
   pantau tab Deployments.
