#!/bin/bash
# ==============================================================================
# AUDIT 07: Module Primary Color & Theme Reviewer (FE) — AI Muse Spark Strict (Full Diff, tanpa regex)
# ==============================================================================

echo "🤖 [Audit 7/8: Module Primary Color & Theme Standard] Memeriksa perubahan dengan AI (AI Muse Spark 1.3)..."

export PATH="$HOME/.opencode/bin:/usr/local/bin:$PATH"
OPENCODE_BIN=$(command -v opencode || echo "$HOME/.opencode/bin/opencode")
MODEL="${OPENCODE_MODEL:-opencode/muse-spark-1.3-contributor-free}"

if [ -n "$DIFF_TARGET" ]; then
    STAGED_DIFF=$(git diff "$DIFF_TARGET" -- "app/(main)/**" "components/**")
else
    STAGED_DIFF=$(git diff --cached -- "app/(main)/**" "components/**")
fi

if [ -z "$STAGED_DIFF" ]; then
    echo "ℹ️ [Audit Module Color Theme Standard] Tidak ada perubahan komponen/halaman yang diuji. Skip."
    exit 0
fi

# ------------------------------------------------------------------------------
# DEEP AI AUDIT
# ------------------------------------------------------------------------------
PROMPT_FILE=$(mktemp)

cat << 'EOF' > "$PROMPT_FILE"
Kamu adalah Code Auditor khusus Module Primary Color & Theme Standard (Strict Frontend Reviewer).
Periksa Git Diff berikut HANYA terhadap 3 aturan di bawah, TANPA pengecualian badge apa pun. Penilaian MURNI oleh AI dari full diff ini, tanpa regex/pre-check.

Aturan Baku (STRICT):
1. WAJIB binding dinamis ke primary_color modul; fallback #3b82f6 HANYA saat null, bukan permanen.
   - SALAH: <div className="bg-[#0d9488]"> permanen; const primary = '#4f46e5'; tanpa membaca API.
   - BENAR: style={{ '--module-primary': currentModule?.primary_color || '#3b82f6' }}; className="bg-[var(--module-primary)]" / style={{ background: 'var(--module-primary)' }}; const primary = currentModule?.primary_color || '#3b82f6' dari primary_color API (fallback hanya saat null).
2. WAJIB menu aktif sidebar/nav, border aksen, badge modul, dan SEMUA tombol (Aksi Utama, Kembali, Filter Outline) refleksikan primary_color modul.
   - SALAH: sidebar active className="bg-blue-600 text-white"; <Badge className="bg-teal-600">SIPPM</Badge> hardcode; <Button>Kembali</Button> biru statis di modul SIMPEG.
   - BENAR: menu aktif style={{ background: 'var(--module-primary)' }}; badge modul style={{ background: currentModule?.primary_color }}; tombol: <Button style={{ background: 'var(--module-primary)' }}>Simpan</Button>, <Button variant="outline" style={{ borderColor: 'var(--module-primary)', color: 'var(--module-primary)' }}><Filter size={16}/> Filter</Button>; contoh: SIPPM Teal #0d9488, SIMPEG Indigo #4f46e5 berasal dari DB, bukan hardcode.
3. DILARANG hardcode hex/class Tailwind statis; WAJIB perubahan warna cukup via Master Modul /admin/modules.
   - SALAH: bg-blue-600/bg-blue-700/text-blue-600/border-blue-600, bg-teal-600, bg-indigo-600, #3b82f6/#2563eb/#0d9488/#4f46e5 tertulis permanen di halaman/komponen modul.
   - BENAR: tidak ada hex/class warna modul di kode; warna mengalir dari DB; ubah warna cukup via halaman Master Modul /admin/modules (field primary_color), tanpa edit kode.

Catatan:
- HANYA periksa baris baru (+) yaitu baris kode baru yang DITAMBAHKAN atau DIUBAH (diawali tanda `+`). JANGAN menolak baris konteks yang tidak diubah (tanpa `+`).
- TIDAK ADA pengecualian badge/status (amber/hijau/merah): setiap aksen modul TETAP wajib dinamis via aturan 1-3.

Git Diff:
EOF

echo '```diff' >> "$PROMPT_FILE"
echo "$STAGED_DIFF" >> "$PROMPT_FILE"
echo '```' >> "$PROMPT_FILE"

cat << 'EOF' >> "$PROMPT_FILE"
PENTING: Jawab HANYA secara langsung tanpa memanggil tool atau membaca file.
Format Respon:
- Jika kode bersih dan memenuhi Module Color Theme Standard, jawab TEPAT: PASSED
- Jika ditemukan pelanggaran pada baris baru (+), awali respon dengan REJECTED dan berikan rincian lengkap:
  * File & Potongan Baris Melanggar: (nama file dan baris/kode yang melanggar)
  * Aturan yang Dilanggar: (nama aturan / standar warna modul yang dilanggar)
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
    echo "❌ [Audit Module Color Theme Standard] REJECTED: AI Reviewer gagal/timeout (Exit: $AI_EXIT_CODE)!"
    exit 1
fi

CLEAN_RESULT=$(echo "$RESULT" | sed -e '/^> build/d' -e '/^Loaded config/d' | awk '/./{p=1} p')

if echo "$RESULT" | grep -qi "REJECTED"; then
    echo "❌ [Audit Module Color Theme Standard] REJECTED oleh AI (Muse Spark)!"
    echo "================================ DETAIL TEMUAN AUDIT ================================"
    echo "$CLEAN_RESULT"
    echo "===================================================================================="
    echo "💡 Harap perbaiki seluruh pelanggaran di atas sebelum melakukan commit."
    exit 1
elif ! echo "$RESULT" | grep -qi "PASSED"; then
    echo "❌ [Audit Module Color Theme Standard] REJECTED: AI tidak memberikan keputusan PASSED yang valid!"
    echo "================================ DETAIL OUTPUT ====================================="
    echo "$CLEAN_RESULT"
    echo "===================================================================================="
    exit 1
else
    echo "✅ [Audit Module Color Theme Standard] PASSED (Divalidasi AI Muse Spark 1.3)."
    exit 0
fi
