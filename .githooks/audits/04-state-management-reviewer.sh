#!/bin/bash
# ==============================================================================
# AUDIT 04: State Management Reviewer (FE) — STRICT HYBRID
# ==============================================================================

echo "🤖 [Audit 4/8: State Management Standard] Memeriksa perubahan dengan AI (Opencode Muse)..."

export PATH="$HOME/.opencode/bin:/usr/local/bin:$PATH"
OPENCODE_BIN=$(command -v opencode || echo "$HOME/.opencode/bin/opencode")
MODEL="${OPENCODE_MODEL:-opencode/muse-spark-1.3-contributor-free}"

if [ -n "$DIFF_TARGET" ]; then
    STAGED_DIFF=$(git diff "$DIFF_TARGET" -- "store/**" "hooks/**" "app/(main)/**")
    STAGED_FILES=$(git diff "$DIFF_TARGET" --name-only --diff-filter=ACM -- "store/**")
else
    STAGED_DIFF=$(git diff --cached -- "store/**" "hooks/**" "app/(main)/**")
    STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM -- "store/**")
fi

if [ -z "$STAGED_DIFF" ]; then
    echo "ℹ️ [Audit State Management Standard] Tidak ada perubahan state/store yang diuji. Skip."
    exit 0
fi

# ------------------------------------------------------------------------------
# 1. DETERMINISTIC PRE-CHECK
# ------------------------------------------------------------------------------
FAILED_REGEX=0

while IFS= read -r file; do
    [ -f "$file" ] || continue
    if ! grep -q "from 'zustand'" "$file"; then
        echo "❌ [Audit State Management] $file tidak memakai Zustand:"
        echo "   💡 Global store di @/store/ WAJIB memakai pustaka Zustand."
        FAILED_REGEX=1
    fi
done <<< "$STAGED_FILES"

if [ $FAILED_REGEX -ne 0 ]; then
    echo "❌ [Audit State Management Standard] DITOLAK pada tahap pemeriksaan statis!"
    exit 1
fi

# ------------------------------------------------------------------------------
# 2. DEEP AI AUDIT (Opencode Model Muse) — FULL DIFF
# ------------------------------------------------------------------------------
PROMPT_FILE=$(mktemp)

cat << 'EOF' > "$PROMPT_FILE"
Kamu adalah Code Auditor khusus State Management Standard (Strict Frontend Reviewer).
Periksa Git Diff berikut HANYA terhadap Aturan State Management:

Aturan Baku (STRICT):
1. ZUSTAND GLOBAL STORE:
   - Global state WAJIB menggunakan Zustand dan berlokasi di `@/store/` dengan TypeScript interface terpisah untuk State dan Actions.
2. LOCAL STATE SCOPING:
   - Data transient/spesifik 1 halaman (seperti baris tabel CRUD) DILARANG dimasukkan ke Zustand global store. Wajib dikelola dalam local state (`useState` / React Query).
3. PERSIST MIDDLEWARE:
   - State yang memerlukan persistensi (seperti auth session / ui preferences) WAJIB menggunakan middleware `persist` dengan atribut `name` unik.

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
- Jika kode bersih dan memenuhi State Management Standard, jawab TEPAT: PASSED
- Jika ditemukan pelanggaran pada baris baru (+), awali respon dengan REJECTED dan berikan rincian lengkap:
  * File & Potongan Baris Melanggar: (nama file dan baris/kode yang melanggar)
  * Aturan yang Dilanggar: (nama aturan / standar state management yang dilanggar)
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
    echo "❌ [Audit State Management Standard] REJECTED: AI Reviewer gagal/timeout (Exit: $AI_EXIT_CODE)!"
    exit 1
fi

CLEAN_RESULT=$(echo "$RESULT" | sed -e '/^> build/d' -e '/^Loaded config/d' | awk '/./{p=1} p')

if echo "$RESULT" | grep -qi "REJECTED"; then
    echo "❌ [Audit State Management Standard] REJECTED oleh AI (Muse)!"
    echo "================================ DETAIL TEMUAN AUDIT ================================"
    echo "$CLEAN_RESULT"
    echo "===================================================================================="
    echo "💡 Harap perbaiki seluruh pelanggaran di atas sebelum melakukan commit."
    exit 1
elif ! echo "$RESULT" | grep -qi "PASSED"; then
    echo "❌ [Audit State Management Standard] REJECTED: AI tidak memberikan keputusan PASSED yang valid!"
    echo "================================ DETAIL OUTPUT ====================================="
    echo "$CLEAN_RESULT"
    echo "===================================================================================="
    exit 1
else
    echo "✅ [Audit State Management Standard] PASSED (Divalidasi oleh AI Opencode Muse)."
    exit 0
fi
