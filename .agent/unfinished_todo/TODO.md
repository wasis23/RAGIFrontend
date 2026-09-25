# TODO Refactor Master SIAKAD — Form Tambah (Zero Hardcode + UI Kit + Zod)

Dipilih user: Semua sekaligus (bertahap).

## Selesai
- [x] Audit 8 halaman master (laporan tabel)
- [x] `frontend/lib/siakad-options.ts` — JENJANG/AKREDITASI/TIPE_MK/TIPE_PRASYARAT/MODE_PENILAIAN/HARI (sumber tunggal, cerminkan enum backend)
- [x] `frontend/components/siakad/FakultasForm.tsx` (Zod+RHF, UI Kit)
- [x] `frontend/components/siakad/ProdiForm.tsx` (Zod+RHF, Select+AsyncSelect kaprodi)
- [x] `frontend/components/siakad/MataKuliahForm.tsx` (termasuk PrasyaratForm)
- [x] `frontend/components/siakad/SkalaNilaiForm.tsx` (termasuk refine batas_atas>=batas_bawah, Checkbox UI Kit)

## Berikutnya
- [x] `components/siakad/TahunAkademikForm.tsx` (10 field + mode_penilaian Select; default tahun dinamis)
- [x] `master/fakultas/page.tsx`: FakultasForm di modal; hapus modal prodi → route ke halaman edit; ConfirmDialog hapus; Drawer Select UI Kit; hapus fallback hardcode
- [x] `master/fakultas/prodi/create/page.tsx`: pakai ProdiForm
- [x] `master/fakultas/prodi/[id]/edit/page.tsx`: BARU (pakai ProdiForm, load via list+find)
- [x] `master/matakuliah/page.tsx`: Drawer Select; ConfirmDialog; PrasyaratForm di modal; hapus modal MK → route create/edit
- [x] `master/matakuliah/create/page.tsx`: BARU (MataKuliahForm)
- [x] `master/matakuliah/[id]/edit/page.tsx`: BARU
- [x] `master/skala-nilai/page.tsx`: Drawer Select; ConfirmDialog; hapus modal → route create/edit
- [x] `master/skala-nilai/create/page.tsx`: BARU (SkalaNilaiForm)
- [x] `master/skala-nilai/[id]/edit/page.tsx`: BARU
- [x] `master/tahun-akademik/page.tsx`: hapus modal → route create/edit; tambah aksi Edit + Badge mode
- [x] `master/tahun-akademik/create/page.tsx`: BARU (TahunAkademikForm)
- [x] `master/tahun-akademik/[id]/edit/page.tsx`: BARU
- [x] `tsc --noEmit` bersih + ringkasan akhir

## Catatan keputusan
- Backend tanpa endpoint show satuan (hanya list); halaman edit load via list+find by id.
- Backend tanpa API master untuk enum jenjang/akreditasi/tipe (validasi string bebas); opsi terpusat di `lib/siakad-options.ts`.
- MK `tipe` backend: `wajib,pilihan,wajib_prodi` (frontend lama kurang `wajib_prodi` → ditambahkan).
- Skala backend: `batas_atas gte batas_bawah` → refine Zod.
- Tahun-akademik backend: tanpa endpoint delete → tidak ada tombol hapus.
- Mode penilaian: editor dipindah ke master tahun-akademik (header nilai cukup Badge).
