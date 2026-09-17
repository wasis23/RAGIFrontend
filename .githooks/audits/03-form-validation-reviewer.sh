#!/bin/bash
# ==============================================================================
# AUDIT 03: Form Validation Standard Reviewer (FE) — STRICT HYBRID
# ==============================================================================

echo "🤖 [Audit 3/8: Form & Input Validation Standard] Memeriksa perubahan dengan AI (Opencode Muse)..."

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
    echo "ℹ️ [Audit Form Validation Standard] Tidak ada perubahan komponen form/input yang diuji. Skip."
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

    # useForm tanpa zodResolver
    if echo "$ADDED" | grep -q 'useForm(' && ! grep -q 'zodResolver' "$file"; then
        echo "❌ [Audit Form Validation] useForm() tanpa zodResolver di $file:"
        echo "   💡 Seluruh form WAJIB memakai skema Zod (z.object) via zodResolver dengan pesan Bahasa Indonesia."
        FAILED_REGEX=1
    fi

    # Raw input/select/textarea mentah
    RAW_INPUT=$(echo "$ADDED" | grep -nP '<(input|select|textarea)[\s>]' | grep -v 'type="file"' | head -n 3)
    if [ -n "$RAW_INPUT" ]; then
        echo "❌ [Audit Form Validation] Tag form mentah terdeteksi di $file:"
        echo "$RAW_INPUT" | sed 's/^/    /'
        echo "   💡 WAJIB menggunakan komponen UI Kit (@/components/ui/Input, Select, AsyncSelect, Textarea)."
        FAILED_REGEX=1
    fi
done <<< "$STAGED_FILES"

if [ $FAILED_REGEX -ne 0 ]; then
    echo "❌ [Audit Form Validation Standard] DITOLAK pada tahap pemeriksaan statis!"
    exit 1
fi

# ------------------------------------------------------------------------------
# 2. DEEP AI AUDIT (Opencode Model Muse) — FULL DIFF
# ------------------------------------------------------------------------------
PROMPT_FILE=$(mktemp)

cat << 'EOF' > "$PROMPT_FILE"
Kamu adalah Code Auditor khusus Form Validation & Input Component Standard (Strict Frontend Reviewer).
Periksa Git Diff berikut HANYA terhadap Aturan Form & Input Validation:

Aturan Baku (STRICT):
1. KONSISTENSI UI KIT INPUT:
   - Komponen input form WAJIB menggunakan UI Kit terpusat (`<Input>`, `<Select>`, `<AsyncSelect>`, `<Textarea>`, `<Checkbox>`).
   - DILARANG menggunakan elemen HTML mentah (`<input>`, `<select>`, `<textarea>`) tanpa wrapper/style UI Kit.
2. SERVER-SIDE ASYNCSELECT UNTUK DATA API:
   - Jika dropdown/select mengambil data dari API backend (seperti User, Role, Pegawai, Matkul, Tipe Referensi), WAJIB menggunakan `<AsyncSelect />` (`@/components/ui/AsyncSelect`) yang mendukung pencarian & fetching server-side.
3. MANDATORY STRICT ZOD VALIDATION:
   - DILARANG KERAS ada form tanpa validasi.
   - Seluruh form WAJIB menggunakan skema Zod (`z.object({...})`) yang dihubungkan ke `react-hook-form` (`zodResolver(schema)`).
   - Error message wajib Bahasa Indonesia dan tampil di bawah field.

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
- Jika kode bersih dan memenuhi Form Validation Standard, jawab TEPAT: PASSED
- Jika ditemukan pelanggaran pada baris baru (+), awali respon dengan REJECTED dan berikan rincian lengkap:
  * File & Potongan Baris Melanggar: (nama file dan baris/kode yang melanggar)
  * Aturan yang Dilanggar: (nama aturan / standar validasi form yang dilanggar)
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
    echo "❌ [Audit Form Validation Standard] REJECTED: AI Reviewer gagal/timeout (Exit: $AI_EXIT_CODE)!"
    exit 1
fi

CLEAN_RESULT=$(echo "$RESULT" | sed -e '/^> build/d' -e '/^Loaded config/d' | awk '/./{p=1} p')

if echo "$RESULT" | grep -qi "REJECTED"; then
    echo "❌ [Audit Form Validation Standard] REJECTED oleh AI (Muse)!"
    echo "================================ DETAIL TEMUAN AUDIT ================================"
    echo "$CLEAN_RESULT"
    echo "===================================================================================="
    echo "💡 Harap perbaiki seluruh pelanggaran di atas sebelum melakukan commit."
    exit 1
elif ! echo "$RESULT" | grep -qi "PASSED"; then
    echo "❌ [Audit Form Validation Standard] REJECTED: AI tidak memberikan keputusan PASSED yang valid!"
    echo "================================ DETAIL OUTPUT ====================================="
    echo "$CLEAN_RESULT"
    echo "===================================================================================="
    exit 1
else
    echo "✅ [Audit Form Validation Standard] PASSED (Divalidasi oleh AI Opencode Muse)."
    exit 0
fi
