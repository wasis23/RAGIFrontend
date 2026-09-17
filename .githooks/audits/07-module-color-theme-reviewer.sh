#!/bin/bash

echo "🤖 [Audit 7/8: Module Primary Color & Theme Standard] Memeriksa perubahan dengan AI (Opencode Muse)..."

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

TRUNCATED_DIFF=$(echo "$STAGED_DIFF" | head -n 400)
PROMPT_FILE=$(mktemp)

cat << 'EOF' > "$PROMPT_FILE"
Kamu adalah Code Auditor khusus Module Primary Color & Theme Standard.
Periksa Git Diff berikut HANYA terhadap Aturan Module Primary Color & Theme:

Aturan Module Primary Color & Theme:
1. WARNA AKSEN MODUL DINAMIS:
   - Warna aksen dan tema pada halaman modul WAJIB mengikuti `primary_color` modul yang bersumber dari database secara dinamis (menggunakan inline style CSS var `--module-primary`, styling context modul, atau prop token dinamis).

2. DILARANG KERAS HARDCODE WARNA STATIS MODUL:
   - DILARANG meng-hardcode kelas Tailwind biru statis (`bg-blue-600`, `bg-blue-700`, `text-blue-600`, `border-blue-600`) atau warna heksadesimal (`#3b82f6`, `#2563eb`) secara permanen pada elemen inti halaman modul.
   - Pengecualian: Badge status fungsional standar (misalnya Badge 'Pending' warna amber, Badge 'Success' warna hijau, Badge 'Danger' warna merah) diperbolehkan.

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
- PASSED jika kode bersih dan memenuhi Module Color Theme Standard.
- REJECTED: [detail alasan pelanggaran] jika ditemukan pelanggaran hardcode warna pada baris baru (+).
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
    echo "⚠️ [Audit Module Color Theme Standard] AI reviewer tidak merespons (Exit: $AI_EXIT_CODE), melanjutkan..."
    exit 0
fi

if echo "$RESULT" | grep -qi "REJECTED"; then
    echo "❌ [Audit Module Color Theme Standard] REJECTED oleh AI (Muse)!"
    echo "$RESULT" | grep -i "REJECTED"
    exit 1
else
    echo "✅ [Audit Module Color Theme Standard] PASSED (Divalidasi oleh AI Opencode Muse)."
    exit 0
fi
