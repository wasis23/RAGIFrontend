#!/bin/bash
# ==============================================================================
# AUDIT 07: Module Primary Color & Theme Reviewer (FE) — STRICT HYBRID
# ==============================================================================

echo "🤖 [Audit 7/8: Module Primary Color & Theme Standard] Memeriksa perubahan dengan AI (Opencode Muse)..."

export PATH="$HOME/.opencode/bin:/usr/local/bin:$PATH"
OPENCODE_BIN=$(command -v opencode || echo "$HOME/.opencode/bin/opencode")
MODEL="${OPENCODE_MODEL:-opencode/muse-spark-1.3-contributor-free}"

if [ -n "$DIFF_TARGET" ]; then
    STAGED_DIFF=$(git diff "$DIFF_TARGET" -- "app/(main)/**" "components/**")
    STAGED_FILES=$(git diff "$DIFF_TARGET" --name-only --diff-filter=ACM -- "app/(main)/**" "components/**")
else
    STAGED_DIFF=$(git diff --cached -- "app/(main)/**" "components/**")
    STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM -- "app/(main)/**" "components/**")
fi

if [ -z "$STAGED_DIFF" ]; then
    echo "ℹ️ [Audit Module Color Theme Standard] Tidak ada perubahan komponen/halaman yang diuji. Skip."
    exit 0
fi

# ------------------------------------------------------------------------------
# 1. DETERMINISTIC PRE-CHECK (Fast Rejection)
# ------------------------------------------------------------------------------
FAILED_REGEX=0
PATTERN='bg-blue-600|bg-blue-700|text-blue-600|border-blue-600|#3b82f6|#2563eb'

while IFS= read -r file; do
    [ -f "$file" ] || continue
    if [ -n "$DIFF_TARGET" ]; then
        ADDED=$(git diff "$DIFF_TARGET" -- "$file" | grep '^+' | grep -v '^+++')
    else
        ADDED=$(git diff --cached -- "$file" | grep '^+' | grep -v '^+++')
    fi
    [ -z "$ADDED" ] && continue

    COLOR_HIT=$(echo "$ADDED" | grep -n -E "$PATTERN" | sed 's^+^^' | head -n 3)
    if [ -n "$COLOR_HIT" ]; then
        echo "❌ [Audit Module Color Theme] Hardcode warna biru statis di $file:"
        echo "$COLOR_HIT" | sed 's/^/    /'
        echo "   💡 Aksen modul WAJIB dinamis mengikuti primary_color dari master modul, bukan bg-blue-600/#3b82f6."
        FAILED_REGEX=1
    fi
done <<< "$STAGED_FILES"

if [ $FAILED_REGEX -ne 0 ]; then
    echo "❌ [Audit Module Color Theme Standard] DITOLAK pada tahap pemeriksaan statis!"
    exit 1
fi

# ------------------------------------------------------------------------------
# 2. DEEP AI AUDIT (Opencode Model Muse) — FULL DIFF
# ------------------------------------------------------------------------------
PROMPT_FILE=$(mktemp)

cat << 'EOF' > "$PROMPT_FILE"
Kamu adalah Code Auditor khusus Module Primary Color & Theme Standard (Strict Frontend Reviewer).
Periksa Git Diff berikut HANYA terhadap Aturan Module Primary Color & Theme:

Aturan Baku (STRICT):
1. WARNA AKSEN MODUL DINAMIS:
   - Warna aksen dan tema pada halaman modul WAJIB mengikuti `primary_color` modul yang bersumber dari database secara dinamis (menggunakan inline style CSS var `--module-primary`, styling context modul, atau prop token dinamis).
2. DILARANG KERAS HARDCODE WARNA STATIS MODUL:
   - DILARANG meng-hardcode kelas Tailwind biru statis (`bg-blue-600`, `bg-blue-700`, `text-blue-600`, `border-blue-600`) atau warna heksadesimal (`#3b82f6`, `#2563eb`) secara permanen pada elemen inti halaman modul.
   - Pengecualian: Badge status fungsional standar (misalnya Badge 'Pending' warna amber, Badge 'Success' warna hijau, Badge 'Danger' warna merah) diperbolehkan.

Catatan:
- HANYA periksa baris-baris kode baru yang DITAMBAHKAN atau DIUBAH (diawali tanda `+`). JANGAN menolak baris konteks yang tidak diubah.

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
    RESULT=$(timeout 30s agy --print "$(cat "$PROMPT_FILE")" 2>&1)
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
    echo "❌ [Audit Module Color Theme Standard] REJECTED oleh AI (Muse)!"
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
    echo "✅ [Audit Module Color Theme Standard] PASSED (Divalidasi oleh AI Opencode Muse)."
    exit 0
fi
