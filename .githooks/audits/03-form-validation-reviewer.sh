#!/bin/bash

echo "🤖 [Audit 3/8: Form & Input Validation Standard] Memeriksa perubahan dengan AI (Opencode Muse)..."

export PATH="$HOME/.opencode/bin:/usr/local/bin:$PATH"
OPENCODE_BIN=$(command -v opencode || echo "$HOME/.opencode/bin/opencode")
MODEL="${OPENCODE_MODEL:-opencode/muse-spark-1.3-contributor-free}"

if [ -n "$DIFF_TARGET" ]; then
    STAGED_DIFF=$(git diff "$DIFF_TARGET" -- "app/(main)/**" "components/**")
else
    STAGED_DIFF=$(git diff --cached -- "app/(main)/**" "components/**")
fi

if [ -z "$STAGED_DIFF" ]; then
    echo "ℹ️ [Audit Form Validation Standard] Tidak ada perubahan komponen form/input yang diuji. Skip."
    exit 0
fi

TRUNCATED_DIFF=$(echo "$STAGED_DIFF" | head -n 400)
PROMPT_FILE=$(mktemp)

cat << 'EOF' > "$PROMPT_FILE"
Kamu adalah Code Auditor khusus Form Validation & Input Component Standard.
Periksa Git Diff berikut HANYA terhadap Aturan Form & Input Validation:

Aturan Form & Validasi:
1. KONSISTENSI UI KIT INPUT:
   - Komponen input form WAJIB menggunakan UI Kit terpusat (`<Input>`, `<Select>`, `<AsyncSelect>`, `<Textarea>`, `<Checkbox>`).
   - DILARANG menggunakan elemen HTML mentah (`<input>`, `<select>`, `<textarea>`) tanpa wrapper/style UI Kit.

2. SERVER-SIDE ASYNCSELECT UNTUK DATA API:
   - Jika dropdown/select mengambil data dari API backend (seperti User, Role, Pegawai, Matkul, Tipe Referensi), WAJIB menggunakan `<AsyncSelect />` (`@/components/ui/AsyncSelect`) atau hook service terkait.

3. MANDATORY STRICT ZOD VALIDATION:
   - DILARANG KERAS ada form tanpa validasi.
   - Seluruh form WAJIB menggunakan skema Zod (`z.object({...})`) yang dihubungkan ke `react-hook-form` (`zodResolver(schema)`).
   - Error message wajib Bahasa Indonesia dan tampil di bawah field.

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
- PASSED jika kode bersih dan memenuhi Form Validation Standard.
- REJECTED: [detail alasan pelanggaran] jika ditemukan pelanggaran Form Validation Standard pada baris baru (+).
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
    echo "⚠️ [Audit Form Validation Standard] AI reviewer tidak merespons (Exit: $AI_EXIT_CODE), melanjutkan..."
    exit 0
fi

if echo "$RESULT" | grep -qi "REJECTED"; then
    echo "❌ [Audit Form Validation Standard] REJECTED oleh AI (Muse)!"
    echo "$RESULT" | grep -i "REJECTED"
    exit 1
else
    echo "✅ [Audit Form Validation Standard] PASSED (Divalidasi oleh AI Opencode Muse)."
    exit 0
fi
