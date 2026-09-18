#!/bin/bash
# ==============================================================================
# AUDIT 02: Admin CRUD Standard Reviewer (FE) — AI Muse Spark Strict (Full Diff, tanpa regex)
# ==============================================================================

echo "🤖 [Audit 2/8: Admin CRUD Standard] Memeriksa perubahan dengan AI (AI Muse Spark 1.3)..."

export PATH="$HOME/.opencode/bin:/usr/local/bin:$PATH"
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

# ------------------------------------------------------------------------------
# DEEP AI AUDIT
# ------------------------------------------------------------------------------
PROMPT_FILE=$(mktemp)

cat << 'EOF' > "$PROMPT_FILE"
Kamu adalah Code Auditor khusus Admin CRUD Standard (Strict Frontend Reviewer).
Periksa Git Diff berikut HANYA terhadap 10 Aturan Admin CRUD & Table Standard di bawah. Penilaian MURNI oleh AI dari full diff ini, tanpa regex/pre-check.

Aturan Baku Admin CRUD (10 ATURAN KETAT):
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
5. WAJIB list pakai DataTable + server-side pagination page/limit + meta={meta} + onPageChange; DILARANG <table>/<thead>/<tbody>/<tr>/<td> mentah; DILARANG paginasi client-side .filter/.map; WAJIB reset page=1 saat limit berubah.
   - SALAH: <table><thead>...</thead></table>; const shown = allData.filter(f).map(...); onLimitChange hanya setLimit(limit).
   - BENAR: <DataTable columns={columns} data={data} meta={meta} onPageChange={(p) => setPage(p)} />; fetch(`/api/x?page=${page}&limit=${limit}`); onLimitChange={(l) => { setLimit(l); setPage(1); }}.
6. WAJIB sort sort_by/orderBy (default name/label) + sort_dir/orderDir asc/desc di Drawer grid 2 kolom dengan separator hr.
   - SALAH: tidak ada kontrol sort; sort hanya satu arah tanpa sort_dir.
   - BENAR: <div className="grid grid-cols-2 gap-4"><Select label="Sort By" options={[{value:'name',label:'Nama'}]} /><Select label="Direction" options={[{value:'asc',label:'Asc'},{value:'desc',label:'Desc'}]} /></div><hr />.
7. WAJIB tombol Filter variant outline dinamis primary modul + ikon Filter size 16 di PageHeader action (bersama Tambah Data Plus size 16) → Drawer kanan-ke-kiri.
   - SALAH: <Button variant="solid">Filter</Button> tanpa ikon; Drawer dari kiri/atas.
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

Catatan:
- HANYA periksa baris baru (+) yaitu baris kode baru yang DITAMBAHKAN atau DIUBAH (diawali tanda `+`). JANGAN menolak baris konteks yang tidak diubah (tanpa `+`).

Git Diff:
EOF

echo '```diff' >> "$PROMPT_FILE"
echo "$STAGED_DIFF" >> "$PROMPT_FILE"
echo '```' >> "$PROMPT_FILE"

cat << 'EOF' >> "$PROMPT_FILE"
PENTING: Jawab HANYA secara langsung tanpa memanggil tool atau membaca file.
Format Respon:
- Jika kode bersih dan memenuhi 10 Aturan Admin CRUD Standard, jawab TEPAT: PASSED
- Jika ditemukan pelanggaran pada baris baru (+), awali respon dengan REJECTED dan berikan rincian lengkap:
  * File & Potongan Baris Melanggar: (nama file dan baris/kode yang melanggar)
  * Aturan yang Dilanggar: (sebutkan nomor dan nama aturan Admin CRUD yang dilanggar)
  * Alasan Penolakan: (penjelasan detail mengapa kode tersebut melanggar)
  * Solusi / Rekomendasi Perbaikan: (solusi konkrit atau contoh kode perbaikan)
EOF

if [ -x "$OPENCODE_BIN" ]; then
    RESULT=$(timeout 45s "$OPENCODE_BIN" run --pure -m "$MODEL" "$(cat "$PROMPT_FILE")" 2>&1)
    AI_EXIT_CODE=$?
elif command -v agy &> /dev/null; then
    RESULT=$(timeout 60s agy --print "$(cat "$PROMPT_FILE")" 2>&1)
    AI_EXIT_CODE=$?
else
    AI_EXIT_CODE=127
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
