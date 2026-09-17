#!/bin/bash

echo "🤖 [Audit 4/8: State Management Standard] Memeriksa perubahan dengan AI (Opencode Muse)..."

export PATH="$HOME/.opencode/bin:/usr/local/bin:$PATH"
OPENCODE_BIN=$(command -v opencode || echo "$HOME/.opencode/bin/opencode")
MODEL="${OPENCODE_MODEL:-opencode/muse-spark-1.3-contributor-free}"

if [ -n "$DIFF_TARGET" ]; then
    STAGED_DIFF=$(git diff "$DIFF_TARGET" -- "store/**" "hooks/**" "app/(main)/**")
else
    STAGED_DIFF=$(git diff --cached -- "store/**" "hooks/**" "app/(main)/**")
fi

if [ -z "$STAGED_DIFF" ]; then
    echo "ℹ️ [Audit State Management Standard] Tidak ada perubahan state/store yang diuji. Skip."
    exit 0
fi

TRUNCATED_DIFF=$(echo "$STAGED_DIFF" | head -n 400)
PROMPT_FILE=$(mktemp)

cat << 'EOF' > "$PROMPT_FILE"
Kamu adalah Code Auditor khusus State Management Standard.
Periksa Git Diff berikut HANYA terhadap Aturan State Management:

Aturan State Management:
1. ZUSTAND GLOBAL STORE:
   - Global state WAJIB menggunakan Zustand dan berlokasi di `@/store/` dengan TypeScript interface terpisah untuk State dan Actions.

2. LOCAL STATE SCOPING:
   - Data transient/spesifik 1 halaman (seperti baris tabel CRUD) DILARANG dimasukkan ke Zustand global store. Wajib dikelola dalam local state (`useState` / React Query).

3. PERSIST MIDDLEWARE:
   - State yang memerlukan persistensi (seperti auth session / ui preferences) WAJIB menggunakan middleware `persist` dengan atribut `name` unik.

Catatan Penting:
- HANYA periksa baris-baris kode baru yang DITAMBAHKAN atau DIUBAH (diawali tanda `+`). JANGAN menolak baris konteks yang tidak diubah.

Git Diff:
EOF

echo '```diff' >> "$PROMPT_FILE"
echo "$TRUNCATED_DIFF" >> "$PROMPT_FILE"
echo '```' >> "$PROMPT_FILE"

cat << 'EOF' >> "$PROMPT_FILE"
PENTING: Jawab HANYA secara langsung tanpa memanggil tool atau membaca file.
Jawab HANYA salah satu:
- PASSED jika kode bersih dan memenuhi State Management Standard.
- REJECTED: [detail alasan pelanggaran] jika ditemukan pelanggaran State Management Standard pada baris baru (+).
EOF

if [ -x "$OPENCODE_BIN" ]; then
    RESULT=$(timeout 30s "$OPENCODE_BIN" run --pure -m "$MODEL" "$(cat "$PROMPT_FILE")" 2>&1)
    AI_EXIT_CODE=$?
elif command -v agy &> /dev/null; then
    RESULT=$(timeout 20s agy --print "$(cat "$PROMPT_FILE")" 2>&1)
    AI_EXIT_CODE=$?
else
    AI_EXIT_CODE=127
fi

rm -f "$PROMPT_FILE"

if [ $AI_EXIT_CODE -ne 0 ]; then
    echo "⚠️ [Audit State Management Standard] AI reviewer tidak merespons (Exit: $AI_EXIT_CODE), melanjutkan..."
    exit 0
fi

if echo "$RESULT" | grep -qi "REJECTED"; then
    echo "❌ [Audit State Management Standard] REJECTED oleh AI (Muse)!"
    echo "$RESULT" | grep -i "REJECTED"
    exit 1
else
    echo "✅ [Audit State Management Standard] PASSED (Divalidasi oleh AI Opencode Muse)."
    exit 0
fi
