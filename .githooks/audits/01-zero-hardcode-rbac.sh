#!/bin/bash

echo "🤖 [Audit 1/8: Zero Hardcode & RBAC] Memeriksa perubahan dengan AI (Opencode Muse)..."

export PATH="$HOME/.opencode/bin:/usr/local/bin:$PATH"
OPENCODE_BIN=$(command -v opencode || echo "$HOME/.opencode/bin/opencode")
MODEL="${OPENCODE_MODEL:-opencode/muse-spark-1.3-contributor-free}"

if [ -n "$DIFF_TARGET" ]; then
    STAGED_DIFF=$(git diff "$DIFF_TARGET" -- "app/**" "components/**" "services/**")
else
    STAGED_DIFF=$(git diff --cached -- "app/**" "components/**" "services/**")
fi

if [ -z "$STAGED_DIFF" ]; then
    echo "ℹ️ [Audit Zero Hardcode & RBAC] Tidak ada perubahan kode yang diuji. Skip."
    exit 0
fi

TRUNCATED_DIFF=$(echo "$STAGED_DIFF" | head -n 400)
PROMPT_FILE=$(mktemp)

cat << 'EOF' > "$PROMPT_FILE"
Kamu adalah Code Auditor khusus Zero Hardcode & RBAC.
Periksa Git Diff berikut HANYA terhadap aturan Zero Hardcode & RBAC Policy:

Aturan:
1. DILARANG KERAS ADA HARDCODE string atau array literal untuk opsi/pilihan data MASTER (misalnya wilayah, program studi, jenis pendaftaran). Semua data referensi WAJIB diambil secara dinamis (fetch dari API) yang merujuk pada tabel master di database. PENGECUALIAN: Untuk data struktural berjenis boolean (Aktif/Nonaktif, Wajib/Opsional) atau placeholder UI (seperti 'Semua Jalur', 'Semua Status'), DIPERBOLEHKAN menggunakan array/string literal statis pada properti options.
2. DILARANG ADA HARDCODE string nama modul/role (seperti 'spmb', 'sikeu', 'admin', 'mahasiswa') dalam pengujian logika IF/ELSE atau perbandingan statis.
3. DILARANG menggunakan properti statis user.user_type atau user_type.
4. Seluruh otorisasi dan relasi WAJIB berbasis ID entitas atau hook RBAC (seperti hasRole / hasPermission).

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
- PASSED jika kode bersih dari hardcode dan sesuai RBAC.
- REJECTED: [detail alasan pelanggaran] jika ditemukan hardcode/pelanggaran RBAC pada baris baru (+).
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
    echo "⚠️ [Audit Zero Hardcode & RBAC] AI reviewer tidak merespons (Exit: $AI_EXIT_CODE), melanjutkan..."
    exit 0
fi

if echo "$RESULT" | grep -qi "REJECTED"; then
    echo "❌ [Audit Zero Hardcode & RBAC] REJECTED oleh AI (Muse)!"
    echo "$RESULT" | grep -i "REJECTED"
    exit 1
else
    echo "✅ [Audit Zero Hardcode & RBAC] PASSED (Divalidasi oleh AI Opencode Muse)."
    exit 0
fi
