#!/bin/bash
# ==============================================================================
# AUDIT 05: Icon Standard Reviewer (FE) — STRICT HYBRID
# ==============================================================================

echo "🤖 [Audit 5/8: Icon Standard] Memeriksa perubahan dengan AI (Opencode Muse)..."

export PATH="$HOME/.opencode/bin:/usr/local/bin:$PATH"
OPENCODE_BIN=$(command -v opencode || echo "$HOME/.opencode/bin/opencode")
MODEL="${OPENCODE_MODEL:-opencode/muse-spark-1.3-contributor-free}"

if [ -n "$DIFF_TARGET" ]; then
    STAGED_DIFF=$(git diff "$DIFF_TARGET" -- "app/**" "components/**")
    STAGED_FILES=$(git diff "$DIFF_TARGET" --name-only --diff-filter=ACM -- "app/**" "components/**")
else
    STAGED_DIFF=$(git diff --cached -- "app/**" "components/**")
    STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM -- "app/**" "components/**")
fi

if [ -z "$STAGED_DIFF" ]; then
    echo "ℹ️ [Audit Icon Standard] Tidak ada perubahan komponen/halaman yang diuji. Skip."
    exit 0
fi

# ------------------------------------------------------------------------------
# 1. DETERMINISTIC PRE-CHECK (Fast Rejection)
# ------------------------------------------------------------------------------
FAILED_REGEX=0

while IFS= read -r file; do
    [ -f "$file" ] || continue
    if [ -n "$DIFF_TARGET" ]; then
        ADDED=$(git diff "$DIFF_TARGET" -- "$file" | grep '^+' | grep -v '^+++' | sed 's^+^^')
    else
        ADDED=$(git diff --cached -- "$file" | grep '^+' | grep -v '^+++' | sed 's^+^^')
    fi
    [ -z "$ADDED" ] && continue

    SVG_HIT=$(echo "$ADDED" | grep -nP '<svg[\s>]' | head -n 3)
    if [ -n "$SVG_HIT" ]; then
        echo "❌ [Audit Icon Standard] Tag <svg> mentah di $file:"
        echo "$SVG_HIT" | sed 's/^/    /'
        echo "   💡 Seluruh ikon WAJIB memakai lucide-react (pengecualian hanya logo custom di public/icons/)."
        FAILED_REGEX=1
    fi

    FA_HIT=$(echo "$ADDED" | grep -nP 'fa-[a-z-]+|font-?awesome' | head -n 3)
    if [ -n "$FA_HIT" ]; then
        echo "❌ [Audit Icon Standard] Ikon non-standar (FontAwesome) di $file:"
        echo "$FA_HIT" | sed 's/^/    /'
        echo "   💡 DILARANG <i className=\"fa ...\"> atau paket ikon pihak ketiga. Pakai lucide-react."
        FAILED_REGEX=1
    fi
done <<< "$STAGED_FILES"

if [ $FAILED_REGEX -ne 0 ]; then
    echo "❌ [Audit Icon Standard] DITOLAK pada tahap pemeriksaan statis!"
    exit 1
fi

# ------------------------------------------------------------------------------
# 2. DEEP AI AUDIT (Opencode Model Muse) — FULL DIFF
# ------------------------------------------------------------------------------
PROMPT_FILE=$(mktemp)

cat << 'EOF' > "$PROMPT_FILE"
Kamu adalah Code Auditor khusus Icon Standard (Strict Frontend Reviewer).
Periksa Git Diff berikut HANYA terhadap Aturan Penggunaan Ikon:

Aturan Baku (STRICT):
1. MANDATORY LUCIDE-REACT:
   - Seluruh ikon visual WAJIB meng-import dan menggunakan pustaka `lucide-react` (seperti `<Plus size={16} />`, `<Trash2 size={16} />`, `<Filter size={16} />`, dsb.).
2. DILARANG SVG MENTAH INLINE & ICON THIRD-PARTY NON-STANDAR:
   - DILARANG KERAS menyisipkan tag `<svg>` mentah inline dengan `<path>` panjang di file komponen jika ikon sudah tersedia di `lucide-react`.
   - DILARANG KERAS menggunakan `<i className="fa ...">` (FontAwesome legacy) atau meng-import pustaka ikon pihak ketiga lainnya.

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
- Jika kode bersih dan memenuhi Icon Standard, jawab TEPAT: PASSED
- Jika ditemukan pelanggaran pada baris baru (+), awali respon dengan REJECTED dan berikan rincian lengkap:
  * File & Potongan Baris Melanggar: (nama file dan baris/kode yang melanggar)
  * Aturan yang Dilanggar: (nama aturan / standar ikon yang dilanggar)
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
    echo "❌ [Audit Icon Standard] REJECTED: AI Reviewer gagal/timeout (Exit: $AI_EXIT_CODE)!"
    exit 1
fi

CLEAN_RESULT=$(echo "$RESULT" | sed -e '/^> build/d' -e '/^Loaded config/d' | awk '/./{p=1} p')

if echo "$RESULT" | grep -qi "REJECTED"; then
    echo "❌ [Audit Icon Standard] REJECTED oleh AI (Muse)!"
    echo "================================ DETAIL TEMUAN AUDIT ================================"
    echo "$CLEAN_RESULT"
    echo "===================================================================================="
    echo "💡 Harap perbaiki seluruh pelanggaran di atas sebelum melakukan commit."
    exit 1
elif ! echo "$RESULT" | grep -qi "PASSED"; then
    echo "❌ [Audit Icon Standard] REJECTED: AI tidak memberikan keputusan PASSED yang valid!"
    echo "================================ DETAIL OUTPUT ====================================="
    echo "$CLEAN_RESULT"
    echo "===================================================================================="
    exit 1
else
    echo "✅ [Audit Icon Standard] PASSED (Divalidasi oleh AI Opencode Muse)."
    exit 0
fi
