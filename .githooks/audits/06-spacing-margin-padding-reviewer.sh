#!/bin/bash

echo "🤖 [Audit 6/8: Spacing, Margin & Padding Standard] Memeriksa perubahan dengan AI (Opencode Muse)..."

export PATH="$HOME/.opencode/bin:/usr/local/bin:$PATH"
OPENCODE_BIN=$(command -v opencode || echo "$HOME/.opencode/bin/opencode")
MODEL="${OPENCODE_MODEL:-opencode/muse-spark-1.3-contributor-free}"

if [ -n "$DIFF_TARGET" ]; then
    STAGED_DIFF=$(git diff "$DIFF_TARGET" -- "app/**" "components/**" "styles/**")
else
    STAGED_DIFF=$(git diff --cached -- "app/**" "components/**" "styles/**")
fi

if [ -z "$STAGED_DIFF" ]; then
    echo "ℹ️ [Audit Spacing Standard] Tidak ada perubahan komponen/halaman yang diuji. Skip."
    exit 0
fi

TRUNCATED_DIFF=$(echo "$STAGED_DIFF" | head -n 400)
PROMPT_FILE=$(mktemp)

cat << 'EOF' > "$PROMPT_FILE"
Kamu adalah Code Auditor khusus Spacing, Margin, Padding & Layout Alignment Standard.
Periksa Git Diff berikut HANYA terhadap Aturan Spacing & Layout Alignment:

Aturan Spacing, Margin & Padding:
1. SKALA SPACING STANDAR:
   - Penataan jarak WAJIB menggunakan skala standar Tailwind / Design System (`p-2` s.d `p-6`, `m-2` s.d `m-6`, `gap-2` s.d `gap-6`, `space-y-4` s.d `space-y-6`).
   - DILARANG ARBITRARY PIXEL SPACING seperti `m-[37px]`, `p-[19px]`, `gap-[13px]`, `mt-[42px]`, `px-[55px]`, `py-[33px]`.

2. COMPACT & PROPORSIONAL CARD/CONTAINER PADDING:
   - Wadah utama (Card, Modal, Drawer, Table Container) wajib compact dan efisien (`p-4` atau `p-6` di desktop, `p-3` atau `p-4` di mobile).
   - DILARANG OVERSIZED PADDING seperti `p-12`, `p-16`, `p-20`, `px-24` yang membuang area layar.

3. KONSISTENSI GAP FLEX/GRID:
   - Jarak antarelemen di container flexbox/grid wajib menggunakan `gap-*` (misal `gap-4` / `gap-6`).

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
- PASSED jika kode bersih dan memenuhi Spacing, Margin & Padding Standard.
- REJECTED: [detail alasan pelanggaran] jika ditemukan pelanggaran Spacing/Padding Standard pada baris baru (+).
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
    echo "⚠️ [Audit Spacing Standard] AI reviewer tidak merespons (Exit: $AI_EXIT_CODE), melanjutkan..."
    exit 0
fi

if echo "$RESULT" | grep -qi "REJECTED"; then
    echo "❌ [Audit Spacing Standard] REJECTED oleh AI (Muse)!"
    echo "$RESULT" | grep -i "REJECTED"
    exit 1
else
    echo "✅ [Audit Spacing Standard] PASSED (Divalidasi oleh AI Opencode Muse)."
    exit 0
fi
