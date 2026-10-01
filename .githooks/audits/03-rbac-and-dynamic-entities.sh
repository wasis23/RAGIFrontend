#!/bin/bash
# ==============================================================================
# AUDIT 03 (FE): RBAC & Dynamic Entity Reference Standard (Unified AI Reviewer)
# ==============================================================================
# Memeriksa:
# 1. Zero Hardcode Policy: Dilarang array literal statis untuk data master/relasi
#    (wajib referensi ID entitas dinamis dari database via API)
# 2. RBAC Policy: Pengecekan izin/role murni, dilarang atribut statis 'user_type'
# ==============================================================================

echo "🛡️ [Audit 3/3: RBAC & Dynamic Entities] Memeriksa kebijakan Zero Hardcode & RBAC frontend dengan AI (AI Muse Spark 1.3)..."

export PATH="$HOME/.local/bin:$HOME/.opencode/bin:/usr/local/bin:$PATH"
AI_ENGINE="${AI_ENGINE:-agy}"
OPENCODE_BIN=$(command -v opencode || echo "$HOME/.opencode/bin/opencode")
MODEL="${OPENCODE_MODEL:-opencode/muse-spark-1.3-contributor-free}"

if [ -n "$DIFF_TARGET" ]; then
    STAGED_DIFF=$(git diff "$DIFF_TARGET" -- "app/**" "components/**" "services/**" "types/**")
else
    STAGED_DIFF=$(git diff --cached -- "app/**" "components/**" "services/**" "types/**")
fi

if [ -z "$STAGED_DIFF" ]; then
    echo "ℹ️ [Audit 3/3] Tidak ada perubahan kode yang diuji. Skip."
    exit 0
fi

if [ ${#STAGED_DIFF} -gt 100000 ]; then
    STAGED_DIFF="${STAGED_DIFF:0:100000}"$'\n\n[CATATAN: diff dipotong pada 100.000 karakter. Nilai HANYA yang terlihat di atas; JANGAN mengarang pelanggaran pada file yang tidak tampak.]'
fi

PROMPT_FILE=$(mktemp)

cat << 'EOF' > "$PROMPT_FILE"
Kamu adalah Senior Frontend Security & Data Architecture Reviewer (AI Muse Spark 1.3).
Tugasmu adalah memeriksa FULL Git Diff frontend berikut secara SANGAT KETAT terhadap Kebijakan Zero Hardcode dan Sistem RBAC.
Evaluasi HANYA baris baru (+) yang ditambahkan atau diubah. Abaikan baris konteks tanpa tanda (+).

================================ STANDAR INTI EVALUASI ================================

1. KEBIJAKAN ZERO HARDCODE & DYNAMIC ENTITY REFERENCE:
   - DILARANG KERAS array literal statis untuk options pada komponen dropdown/select yang merujuk pada entitas master (misal: prodi, jalur, gelombang, jenjang, role, unit kerja, dll).
   - Opsi untuk tabel master database WAJIB diambil secara dinamis via API (menggunakan `<AsyncSelect />` atau fetch API).
   - Pengecualian sah: Hanya untuk closed-set domain tetap yang tidak memiliki tabel master (misal: jenis kelamin 'L'/'P', agama) yang dideklarasikan terpusat.
   - Referensi query, filter, dan relasi WAJIB menggunakan ID entitas database (`module_id`, `jalur_id`, dll), bukan label string hardcode.

2. KEBIJAKAN ROLE-BASED ACCESS CONTROL (RBAC):
   - Seluruh otorisasi frontend WAJIB memeriksa permission granular atau role dari sistem IAM (misal: `hasPermission('...')` atau `hasRole('...')`).
   - DILARANG KERAS mengandalkan atau memeriksa field statis warisan seperti `user_type`, `user.type === 'admin'`, dsb.
   - Proteksi route dan visibilitas tombol aksi wajib selaras dengan RBAC.

========================================================================================

Catatan Penilaian:
- HANYA periksa baris baru (+) — baris tanpa `+` WAJIB diabaikan.
- JANGAN menuduh simbol/komponen tidak terdefinisi jika baris import berada di luar potongan diff.

Git Diff:
EOF

echo '```diff' >> "$PROMPT_FILE"
echo "$STAGED_DIFF" >> "$PROMPT_FILE"
echo '```' >> "$PROMPT_FILE"

cat << 'EOF' >> "$PROMPT_FILE"
PENTING: Jawab HANYA secara langsung tanpa memanggil tool atau membaca file.
Format Respon:
- Jika kode bersih dan memenuhi standar Zero Hardcode & RBAC, jawab TEPAT: PASSED
- Jika ditemukan pelanggaran pada baris baru (+), awali respon dengan REJECTED dan berikan rincian:
  * File & Potongan Baris Melanggar: (nama file dan baris/kode yang melanggar)
  * Standar yang Dilanggar: (nama standar yang dilanggar)
  * Alasan Penolakan: (penjelasan detail)
  * Solusi / Rekomendasi Perbaikan: (contoh perbaikan konkrit)
EOF

AI_EXIT_CODE=1
if [ "$AI_ENGINE" != "agy" ] && [ -x "$OPENCODE_BIN" ]; then
    RESULT=$(timeout 90s "$OPENCODE_BIN" run --pure -m "$MODEL" "$(cat "$PROMPT_FILE")" 2>&1)
    AI_EXIT_CODE=$?
fi

if [ $AI_EXIT_CODE -ne 0 ] && command -v agy &> /dev/null; then
    RESULT=$(timeout 90s agy --model gemini-3.8-flash-low --print "$(cat "$PROMPT_FILE")" 2>&1)
    AI_EXIT_CODE=$?
fi

rm -f "$PROMPT_FILE"

if [ $AI_EXIT_CODE -ne 0 ]; then
    echo "❌ [Audit 3/3: RBAC & Dynamic Entities] REJECTED: AI Reviewer gagal/timeout (Exit: $AI_EXIT_CODE)!"
    exit 1
fi

CLEAN_RESULT=$(echo "$RESULT" | sed -e '/^> build/d' -e '/^Loaded config/d' | awk '/./{p=1} p')

if echo "$RESULT" | grep -qi "REJECTED"; then
    echo "❌ [Audit 3/3: RBAC & Dynamic Entities] REJECTED oleh AI!"
    echo "================================ DETAIL TEMUAN AUDIT ================================"
    echo "$CLEAN_RESULT"
    echo "===================================================================================="
    echo "💡 Harap perbaiki seluruh pelanggaran di atas sebelum melakukan commit."
    exit 1
elif ! echo "$RESULT" | grep -qi "PASSED"; then
    echo "⚠️ [Audit 3/3: RBAC & Dynamic Entities] Output AI tidak dikenali:"
    echo "$CLEAN_RESULT"
    exit 1
fi

echo "✅ [Audit 3/3: RBAC & Dynamic Entities] PASSED (Divalidasi AI Muse Spark 1.3)."
exit 0
