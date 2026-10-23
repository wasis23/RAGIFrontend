# TODO — Frontend PA Bimbingan commit (auditor fixes)

Goal: commit PA-only frontend changes (staged) after passing `.githooks/audits/02` & `03`.

## Environment
- Frontend auditor scripts fixed: removed invalid `opencode run --pure` flag (02, 03).
- Auditors must run with `OPENCODE_MODEL=opencode/deepseek-v4.1-flash-free` (configured models gone).
- Commit only PA: `app/(main)/siakad/bimbingan/page.tsx` + PA hunk of `services/siakad.service.ts`.
- Backup of user's staged non-PA index: `/var/folders/.../opencode/user_staged_backup.patch`.

## Fixes required (audit 02 & 03)
- [ ] #1 master-referensi options: `pa_jadwal_mode`, `pa_insiden_jenis`, `pa_eskalasi_tujuan`, `pa_booking_status`, `pa_pkl_status`, `pa_pkl_jenis`, `pa_insiden_status` via `referensiService.getAll`.
- [ ] #2 central typed constants for domain enums (risiko band, sinyal kode, status mapping) — no inline magic strings / raw display.
- [ ] #3 RBAC: replace `!isMahasiswa` with positive `hasPermission('siakad.pa.*')`; tab visibility + action buttons.
- [ ] #4 service: use `*_id` where master-backed; keep `status`/`jenis` only where closed-set domain.
- [ ] UI Kit: replace native `<input>`/`<textarea>` in jadwal modal + month input with `<Input>`/`<Textarea>`/`<Select>`.
- [ ] Zod + zodResolver for jadwal form (jam_selesai > jam_mulai, kuota int, messages ID).
- [ ] Jadwal form 7 fields → separate handling (drawer/page) — or reduce to <=5 via Modal.
- [ ] Filter Drawer + meta server-side pagination/sort on monitoring & layanan sub-tabs.
- [ ] Hide monitoring/layanan tabs from mahasiswa (no dead-end) — gated by permission.
- [ ] Module color: replace `text-primary-600` etc. with `var(--module-primary)` where module accent.
- [ ] Fix overflow tab bar mobile, `max-w-[200px]`, `p-8`.
- [ ] `isLoading` on laporan bulanan table; local date helper instead of `toISOString()`.
- [ ] Typed payloads (avoid `any`).

## Steps to commit
1. `npx tsc --noEmit` clean.
2. Run audits 01/02/03 with `OPENCODE_MODEL=...` until PASS.
3. `git reset -q HEAD`; re-stage PA only (`bimbingan/page.tsx` + service PA patch).
4. `git commit` (normal).
5. Restore user's staged index: `git apply --cached user_staged_backup.patch` (resolve).
6. Push only if user asks.
