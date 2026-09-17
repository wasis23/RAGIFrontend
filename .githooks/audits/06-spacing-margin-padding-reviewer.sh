#!/bin/bash
# ==============================================================================
# AUDIT 06: Spacing, Margin & Padding Reviewer (FE) — STRICT HYBRID
# ==============================================================================

echo "🤖 [Audit 6/8: Spacing, Margin & Padding Standard] Memeriksa perubahan dengan AI (Opencode Muse)..."

export PATH="$HOME/.opencode/bin:/usr/local/bin:$PATH"
OPENCODE_BIN=$(command -v opencode || echo "$HOME/.opencode/bin/opencode")
MODEL="${OPENCODE_MODEL:-opencode/muse-spark-1.3-contributor-free}"

if [ -n "$DIFF_TARGET" ]; then
    STAGED_DIFF=$(git diff "$DIFF_TARGET" -- "app/**" "components/**" "styles/**")
    STAGED_FILES=$(git diff "$DIFF_TARGET" --name-only --diff-filter=ACM -- "app/**" "components/**" "styles/**")
else
    STAGED_DIFF=$(git diff --cached -- "app/**" "components/**" "styles/**")
    STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM -- "app/**" "components/**" "styles/**")
fi

if [ -z "$STAGED_DIFF" ]; then
    echo "ℹ️ [Audit Spacing Standard] Tidak ada perubahan komponen/halaman yang diuji. Skip."
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

    # Arbitrary pixel spacing: m-[37px], p-[19px], gap-[13px]
    ARB_HIT=$(echo "$ADDED" | grep -nP '(^|[^a-zA-Z0-9_-])(p|m|gap|mt|mb|ml|mr|mx|my|px|py|pt|pb|pl|pr|space-x|space-y)-\[' | head -n 3)
    if [ -n "$ARB_HIT" ]; then
        echo "❌ [Audit Spacing Standard] Spacing arbitrary pixel di $file:"
        echo "$ARB_HIT" | sed 's/^/    /'
        echo "   💡 WAJIB skala standar (p-2..p-6, m-2..m-6, gap-2..gap-6, space-y-4/6). Dilarang m-[37px], gap-[13px], dsb."
        FAILED_REGEX=1
    fi

    # Oversized padding wadah: p-12/16/20/24
    BIG_HIT=$(echo "$ADDED" | grep -nP '(^|[^a-zA-Z0-9_-])(p|px|py|pt|pb|pl|pr)-(12|16|20|24)([^0-9]|$)' | head -n 3)
    if [ -n "$BIG_HIT" ]; then
        echo "❌ [Audit Spacing Standard] Padding wadah oversized di $file:"
        echo "$BIG_HIT" | sed 's/^/    /'
        echo "   💡 Card/container WAJIB compact (p-3/p-4 mobile, p-4/p-6 desktop). Dilarang p-12/p-16/p-20/px-24."
        FAILED_REGEX=1
    fi
done <<< "$STAGED_FILES"

if [ $FAILED_REGEX -ne 0 ]; then
    echo "❌ [Audit Spacing Standard] DITOLAK pada tahap pemeriksaan statis!"
    exit 1
fi

# ------------------------------------------------------------------------------
# 2. DEEP AI AUDIT (Opencode Model Muse) — FULL DIFF
# ------------------------------------------------------------------------------
PROMPT_FILE=$(mktemp)

cat << 'EOF' > "$PROMPT_FILE"
Kamu adalah Code Auditor khusus Spacing, Margin, Padding & Layout Alignment Standard (Strict Frontend Reviewer).
Periksa Git Diff berikut HANYA terhadap Aturan Spacing & Layout Alignment:

Aturan Baku (STRICT):
1. SKALA SPACING STANDAR:
   - Penataan jarak WAJIB menggunakan skala standar Tailwind / Design System (`p-2` s.d `p-6`, `m-2` s.d `m-6`, `gap-2` s.d `gap-6`, `space-y-4` s.d `space-y-6`).
   - DILARANG ARBITRARY PIXEL SPACING seperti `m-[37px]`, `p-[19px]`, `gap-[13px]`, `mt-[42px]`, `px-[55px]`, `py-[33px]`.
2. COMPACT & PROPORSIONAL CARD/CONTAINER PADDING:
   - Wadah utama (Card, Modal, Drawer, Table Container) wajib compact dan efisien (`p-4` atau `p-6` di desktop, `p-3` atau `p-4` di mobile).
   - DILARANG OVERSIZED PADDING seperti `p-12`, `p-16`, `p-20`, `px-24` yang membuang area layar.
3. KONSISTENSI GAP FLEX/GRID & ALIGNMENT:
   - Jarak antarelemen di container flexbox/grid wajib menggunakan `gap-*` (misal `gap-4` / `gap-6`).
   - DILARANG mencampur `gap` dengan inline margin manual (`mt-*`, `mb-*`, `ml-*`, `mr-*`) di elemen turunan flexbox/grid yang merusak alignment.
4. OUTER SECTION SPACING:
   - Jarak vertikal antar section/card utama halaman wajib rapi dengan `space-y-4` / `space-y-6` atau `mb-4` / `mb-6`. Dilarang margin negatif acak (`-mt-20`).

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
- Jika kode bersih dan memenuhi Spacing, Margin & Padding Standard, jawab TEPAT: PASSED
- Jika ditemukan pelanggaran pada baris baru (+), awali respon dengan REJECTED dan berikan rincian lengkap:
  * File & Potongan Baris Melanggar: (nama file dan baris/kode yang melanggar)
  * Aturan yang Dilanggar: (nama aturan / standar spacing yang dilanggar)
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
    echo "❌ [Audit Spacing Standard] REJECTED: AI Reviewer gagal/timeout (Exit: $AI_EXIT_CODE)!"
    exit 1
fi

CLEAN_RESULT=$(echo "$RESULT" | sed -e '/^> build/d' -e '/^Loaded config/d' | awk '/./{p=1} p')

if echo "$RESULT" | grep -qi "REJECTED"; then
    echo "❌ [Audit Spacing Standard] REJECTED oleh AI (Muse)!"
    echo "================================ DETAIL TEMUAN AUDIT ================================"
    echo "$CLEAN_RESULT"
    echo "===================================================================================="
    echo "💡 Harap perbaiki seluruh pelanggaran di atas sebelum melakukan commit."
    exit 1
elif ! echo "$RESULT" | grep -qi "PASSED"; then
    echo "❌ [Audit Spacing Standard] REJECTED: AI tidak memberikan keputusan PASSED yang valid!"
    echo "================================ DETAIL OUTPUT ====================================="
    echo "$CLEAN_RESULT"
    echo "===================================================================================="
    exit 1
else
    echo "✅ [Audit Spacing Standard] PASSED (Divalidasi oleh AI Opencode Muse)."
    exit 0
fi
