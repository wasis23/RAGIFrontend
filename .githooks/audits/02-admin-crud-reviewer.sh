#!/bin/bash
# ==============================================================================
# AUDIT 02: Admin CRUD Standard Reviewer (FE) — AI Muse Spark Strict (Full Diff, tanpa regex)
# ==============================================================================

echo "🤖 [Audit 2/9: Admin CRUD Standard] Memeriksa perubahan dengan AI (AI Muse Spark 1.3)..."

export PATH="$HOME/.local/bin:$HOME/.opencode/bin:/usr/local/bin:$PATH"
AI_ENGINE="${AI_ENGINE:-agy}"
OPENCODE_BIN=$(command -v opencode || echo "$HOME/.opencode/bin/opencode")
MODEL="${OPENCODE_MODEL:-opencode/muse-spark-1.3-contributor-free}"

if [ -n "$DIFF_TARGET" ]; then
    STAGED_DIFF=$(git diff "$DIFF_TARGET" -- "app/(main)/**" "components/**")
else
    STAGED_DIFF=$(git diff --cached -- "app/(main)/**" "components/**")
fi

if [ -z "$STAGED_DIFF" ]; then
    echo "ℹ️ [Audit Admin CRUD Standard] Tidak ada perubahan pada file admin/CRUD yang diuji. Skip."
    exit 0
fi

if [ ${#STAGED_DIFF} -gt 80000 ]; then
    STAGED_DIFF="${STAGED_DIFF:0:80000}"$'\n\n[CATATAN: diff dipotong pada 80.000 karakter. Nilai HANYA yang terlihat di atas; JANGAN mengarang pelanggaran pada file/bagian yang tidak tampak.]'
fi

# ------------------------------------------------------------------------------
# DEEP AI AUDIT
# ------------------------------------------------------------------------------
PROMPT_FILE=$(mktemp)

cat << 'EOF' > "$PROMPT_FILE"
Kamu adalah Code Auditor khusus Admin CRUD Standard (Strict Frontend Reviewer).
Periksa Git Diff berikut HANYA terhadap 11 Aturan Admin CRUD & Table Standard di bawah. Penilaian MURNI oleh AI dari full diff ini, tanpa regex/pre-check.

Aturan Baku Admin CRUD (11 ATURAN KETAT):
1. WAJIB Mobile-first responsive styling dengan w-full flex-col grid-cols-1 gap-4 + breakpoint sm:/md:/lg:.
   - SALAH: <div className="flex flex-row w-[1200px]"> tanpa breakpoint; grid statis grid-cols-3 tanpa grid-cols-1 mobile.
   - BENAR: <div className="flex w-full flex-col gap-4 md:flex-row">; <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">.
2. WAJIB halaman Detail terpisah /[id] dengan Tombol Kembali dinamis primary modul di PageHeader action; DILARANG modal detail rumit.
   - SALAH: <Modal><DetailRumit ... ratusan baris ... /></Modal> untuk detail entitas.
   - BENAR: app/(main)/modul/[id]/page.tsx dengan <PageHeader title="Detail" action={<Button style={{ background: 'var(--module-primary)' }}><ArrowLeft size={16}/> Kembali</Button>} />.
3. WAJIB desain form compact grid-cols-1 md:2 lg:3 gap-4, prop label bawaan, tanpa whitespace berlebih.
   - SALAH: <div className="grid grid-cols-1 p-10 space-y-10"><input placeholder="Nama" /><input placeholder="NIP" /></div> (tanpa label, whitespace besar).
   - BENAR: <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"><Input label="Nama" ... /><Input label="NIP" ... /></div>.
4. WAJIB Atomic Design: Button/Input/Select/AsyncSelect/Modal/Drawer/DataTable/Badge/StatusBadge/ConfirmDialog/DropdownMenu dari @/components/ui + PageHeader/Sidebar dari layout; DILARANG HTML mentah; Pages hanya merangkai.
   - SALAH: <button className="btn">Simpan</button>, <input type="text" />, <select>...</select> di halaman.
   - BENAR: import { Button, Input, Select } from '@/components/ui'; import { PageHeader } from '@/components/layout'; halaman hanya merangkai komponen atomik.
5. WAJIB list pakai DataTable + server-side pagination page/limit + meta={meta} + onPageChange + WAJIB background tabel/container berwarna putih (bg-white / #ffffff), DILARANG background abu-abu (bg-slate-50, bg-gray-100, dsb); DILARANG <table>/<thead>/<tbody>/<tr>/<td> mentah; DILARANG paginasi client-side .filter/.map; WAJIB reset page=1 saat limit berubah.
   - SALAH: <table><thead>...</thead></table>; const shown = allData.filter(f).map(...); table wrapper diberi bg-slate-50/bg-gray-100 abu-abu; onLimitChange hanya setLimit(limit).
   - BENAR: <DataTable columns={columns} data={data} meta={meta} onPageChange={(p) => setPage(p)} /> (background tabel putih bersih bg-white); fetch(`/api/x?page=${page}&limit=${limit}`); onLimitChange={(l) => { setLimit(l); setPage(1); }}.
6. WAJIB sorting komprehensif mencakup SELURUH kolom informasi tabel + sort_dir/orderDir asc/desc di Drawer grid 2 kolom dengan separator hr.
   - Dropdown 'Sort By' / 'Urut Berdasarkan' WAJIB menyediakan opsi pengurutan untuk SELURUH kolom informasi yang tampil pada tabel (contoh: jika tabel menampilkan 5 kolom informasi, maka opsi sort wajib memuat kelima kolom tersebut, bukan hanya 1 atau 2 kolom saja).
   - SALAH: tidak ada kontrol sort; sort hanya satu arah tanpa sort_dir; opsi sort hanya menyediakan 'nama' saja padahal tabel menampilkan banyak kolom informasi.
   - BENAR: <div className="grid grid-cols-2 gap-4"><Select label="Urut Berdasarkan" options={[{value:'code',label:'Kode'},{value:'name',label:'Nama'},{value:'jalur',label:'Jalur'},...]} /><Select label="Direction" options={[{value:'asc',label:'Asc'},{value:'desc',label:'Desc'}]} /></div><hr />.
7. WAJIB tombol Filter variant outline dinamis primary modul + ikon Filter size 16 di PageHeader action dan WAJIB di sebelah KIRI tombol Tambah Data ([Filter] [Tambah Data]); DILARANG tombol Tambah Data diletakkan sebelum Filter → Drawer kanan-ke-kiri.
   - SALAH: <Button variant="solid">Filter</Button> tanpa ikon; Drawer dari kiri/atas; tombol Tambah mendahului Filter.
   - BENAR: <PageHeader action={<><Button variant="outline" style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}><Filter size={16} /> Filter</Button><Button><Plus size={16} /> Tambah Data</Button></>} />; <Drawer position="right">.
8. WAJIB konsistensi form: ≤5 input = Modal grid maks 2 kolom; >5 input = halaman /create /[id]/edit + Tombol Kembali dinamis + Batal sekunder.
   - SALAH: form 8 input dipadatkan ke <Modal className="grid-cols-4">; form 3 input dibuatkan halaman /create penuh.
   - BENAR: ≤5 input → <Modal><div className="grid grid-cols-1 md:grid-cols-2 gap-4">...</div></Modal>; >5 input → app/.../create/page.tsx dengan Tombol Kembali + <Button variant="secondary">Batal</Button>.
9. WAJIB aksi tabel pakai DropdownMenu 3-dots; DILARANG tombol horizontal.
   - SALAH: <td><Button>Edit</Button><Button>Hapus</Button><Button>Detail</Button></td> sejajar horizontal.
   - BENAR: <DropdownMenu trigger={<Button variant="ghost"><MoreVertical size={16} /></Button>} items={[{label:'Detail'},{label:'Edit'},{label:'Hapus'}]} />.
10. DILARANG confirm/alert/prompt; WAJIB ConfirmDialog/Modal dengan Batal+Hapus+isLoading.
   - SALAH: if (confirm('Hapus?')) doDelete(); alert('Berhasil'); const x = prompt('Nama?').
   - BENAR: <ConfirmDialog open={open} onCancel={close} onConfirm={doDelete} cancelText="Batal" confirmText="Hapus" isLoading={isDeleting} />.
11. WAJIB Paritas 100% Field Filter Sidebar (Drawer) terhadap Kolom Informasi Tabel (1:1 Column-to-Filter Parity).
   - Seluruh kolom informasi data yang ditampilkan pada tabel (di luar kolom non-informasi teknis seperti nomor urut/No, checkbox multi-select, dan tombol dropdown aksi 3-dots) WAJIB memiliki inputan filter yang bersesuaian di dalam Sidebar Filter (Drawer). Jika tabel menampilkan 5 kolom informasi, maka Sidebar Filter WAJIB menyediakan 5 kontrol filter untuk ke-5 kolom tersebut.
   - Kontrol filter disesuaikan: Input untuk teks/angka/pencarian spesifik, Select/AsyncSelect untuk data referensi/dropdown status, DatePicker/Input date untuk kolom tanggal.
   - SALAH: tabel menampilkan kolom Kode, Nama, Jalur Masuk, Gelombang, dan Status (5 kolom informasi), tetapi di Filter Drawer hanya ada filter Nama dan Status (3 kolom informasi lainnya tidak bisa difilter).
   - BENAR: setiap kolom informasi pada tabel memiliki input filter yang padan di dalam Sidebar Filter (Drawer).

Catatan:
- CAKUPAN: Aturan 6, 7, dan 11 (sort komprehensif, tombol "Tambah Data", paritas filter 1:1) HANYA berlaku untuk halaman CRUD pengelolaan data yang memang memiliki aksi Tambah/kelola data. Halaman LAPORAN/STATISTIK/detail read-only TIDAK wajib memiliki tombol "Tambah Data" dan TIDAK wajib paritas filter 1:1 — JANGAN menolak halaman laporan karena tidak ada tombol Tambah Data.
- HANYA periksa baris baru (+) yaitu baris kode baru yang DITAMBAHKAN atau DIUBAH (diawali tanda `+`). JANGAN menolak baris konteks yang tidak diubah (tanpa `+`).

- JANGAN menuduh sebuah simbol/komponen/ikon "tidak di-import" atau "tidak terdefinisi": diff hanya memuat potongan file, sehingga baris import sering berada DI LUAR diff. Validitas import sudah diverifikasi terpisah (tsc --noEmit untuk FE, php -l untuk BE). Laporkan hanya pelanggaran yang benar-benar terlihat pada baris (+).

Git Diff:
EOF

echo '```diff' >> "$PROMPT_FILE"
echo "$STAGED_DIFF" >> "$PROMPT_FILE"
echo '```' >> "$PROMPT_FILE"

cat << 'EOF' >> "$PROMPT_FILE"
PENTING: Jawab HANYA secara langsung tanpa memanggil tool atau membaca file.
Format Respon:
- Jika kode bersih dan memenuhi 11 Aturan Admin CRUD Standard, jawab TEPAT: PASSED
- Jika ditemukan pelanggaran pada baris baru (+), awali respon dengan REJECTED dan berikan rincian lengkap:
  * File & Potongan Baris Melanggar: (nama file dan baris/kode yang melanggar)
  * Aturan yang Dilanggar: (sebutkan nomor dan nama aturan Admin CRUD yang dilanggar)
  * Alasan Penolakan: (penjelasan detail mengapa kode tersebut melanggar)
  * Solusi / Rekomendasi Perbaikan: (solusi konkrit atau contoh kode perbaikan)
EOF

AI_EXIT_CODE=1
if [ "$AI_ENGINE" != "agy" ] && [ -x "$OPENCODE_BIN" ]; then
    RESULT=$(timeout 120s "$OPENCODE_BIN" run --pure -m "$MODEL" "$(cat "$PROMPT_FILE")" 2>&1)
    AI_EXIT_CODE=$?
fi

if [ $AI_EXIT_CODE -ne 0 ] && command -v agy &> /dev/null; then
    RESULT=$(timeout 120s agy --model gemini-3.8-flash-low --print "$(cat "$PROMPT_FILE")" 2>&1)
    AI_EXIT_CODE=$?
fi

rm -f "$PROMPT_FILE"

if [ $AI_EXIT_CODE -ne 0 ]; then
    echo "❌ [Audit Admin CRUD Standard] REJECTED: AI Reviewer gagal/timeout (Exit: $AI_EXIT_CODE)!"
    exit 1
fi

CLEAN_RESULT=$(echo "$RESULT" | sed -e '/^> build/d' -e '/^Loaded config/d' | awk '/./{p=1} p')

if echo "$RESULT" | grep -qi "REJECTED"; then
    echo "❌ [Audit Admin CRUD Standard] REJECTED oleh AI (Muse Spark)!"
    echo "================================ DETAIL TEMUAN AUDIT ================================"
    echo "$CLEAN_RESULT"
    echo "===================================================================================="
    echo "💡 Harap perbaiki seluruh pelanggaran di atas sebelum melakukan commit."
    exit 1
elif ! echo "$RESULT" | grep -qi "PASSED"; then
    echo "❌ [Audit Admin CRUD Standard] REJECTED: AI tidak memberikan keputusan PASSED yang valid!"
    echo "================================ DETAIL OUTPUT ====================================="
    echo "$CLEAN_RESULT"
    echo "===================================================================================="
    exit 1
else
    echo "✅ [Audit Admin CRUD Standard] PASSED (Divalidasi AI Muse Spark 1.3)."
    exit 0
fi
