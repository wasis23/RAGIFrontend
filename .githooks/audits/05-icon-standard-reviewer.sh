#!/bin/bash

echo "🤖 [Audit 5/8: Icon Standard] Memeriksa perubahan dengan AI (Opencode Muse)..."

export PATH="$HOME/.opencode/bin:/usr/local/bin:$PATH"
OPENCODE_BIN=$(command -v opencode || echo "$HOME/.opencode/bin/opencode")
MODEL="${OPENCODE_MODEL:-opencode/muse-spark-1.3-contributor-free}"

if [ -n "$DIFF_TARGET" ]; then
    STAGED_DIFF=$(git diff "$DIFF_TARGET" -- "app/**" "components/**")
else
    STAGED_DIFF=$(git diff --cached -- "app/**" "components/**")
fi

if [ -z "$STAGED_DIFF" ]; then
    echo "ℹ️ [Audit Icon Standard] Tidak ada perubahan komponen/halaman yang diuji. Skip."
    exit 0
fi

TRUNCATED_DIFF=$(echo "$STAGED_DIFF" | head -n 400)
PROMPT_FILE=$(mktemp)

cat << 'EOF' > "$PROMPT_FILE"
Kamu adalah Code Auditor khusus Icon Standard.
Periksa Git Diff berikut HANYA terhadap Aturan Penggunaan Ikon:

Aturan Penggunaan Ikon:
1. MANDATORY LUCIDE-REACT:
   - Seluruh ikon visual WAJIB meng-import dan menggunakan pustaka `lucide-react` (seperti `<Plus size={16} />`, `<Trash2 size={16} />`, `<Filter size={16} />`, dsb.).

2. DILARANG SVG MENTAH INLINE & ICON THIRD-PARTY NON-STANDAR:
   - DILARANG KERAS menyisipkan tag `<svg>` mentah inline dengan `<path>` panjang di file komponen jika ikon sudah tersedia di `lucide-react`.
   - DILARANG KERAS menggunakan `<i className="fa ...">` (FontAwesome legacy) atau meng-import pustaka ikon pihak ketiga lainnya.

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
- PASSED jika kode bersih dan memenuhi Icon Standard.
- REJECTED: [detail alasan pelanggaran] jika ditemukan penggunaan ikon non-standar / SVG mentah pada baris baru (+).
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
    echo "⚠️ [Audit Icon Standard] AI reviewer tidak merespons (Exit: $AI_EXIT_CODE), melanjutkan..."
    exit 0
fi

if echo "$RESULT" | grep -qi "REJECTED"; then
    echo "❌ [Audit Icon Standard] REJECTED oleh AI (Muse)!"
    echo "$RESULT" | grep -i "REJECTED"
    exit 1
else
    echo "✅ [Audit Icon Standard] PASSED (Divalidasi oleh AI Opencode Muse)."
    exit 0
fi
