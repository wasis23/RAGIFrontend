#!/bin/bash
# ==============================================================================
# AUDIT 05: Icon Standard Reviewer (FE) — AI Muse Spark Strict (Full Diff, tanpa regex)
# ==============================================================================

echo "🤖 [Audit 5/9: Icon Standard] Memeriksa perubahan dengan AI (AI Muse Spark 1.3)..."

export PATH="$HOME/.local/bin:$HOME/.opencode/bin:/usr/local/bin:$PATH"
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

if [ ${#STAGED_DIFF} -gt 80000 ]; then
    STAGED_DIFF="${STAGED_DIFF:0:80000}"
fi

# ------------------------------------------------------------------------------
# DEEP AI AUDIT
# ------------------------------------------------------------------------------
PROMPT_FILE=$(mktemp)

cat << 'EOF' > "$PROMPT_FILE"
Kamu adalah Code Auditor khusus Icon Standard (Strict Frontend Reviewer).
Periksa Git Diff berikut HANYA terhadap 3 aturan di bawah. Penilaian MURNI oleh AI dari full diff ini, tanpa regex/pre-check.

Aturan Baku (STRICT):
1. WAJIB import dan pakai lucide-react untuk ikon (Plus/Trash2/Edit2/Filter/Search/ArrowLeft + ikon di Button).
   - SALAH: tombol tanpa ikon padahal aksi standar (Tambah/Filter/Hapus/Edit/Cari/Kembali); ikon dibuat manual via karakter unicode/emoji.
   - BENAR: import { Plus, Trash2, Edit2, Filter, Search, ArrowLeft } from 'lucide-react'; <Button><Plus size={16} /> Tambah Data</Button>; <Button variant="outline"><Filter size={16} /> Filter</Button>.
2. DILARANG <svg> inline bila ikon tersedia di lucide; DILARANG FA/react-icons/heroicons/paket non-standar; pengecualian HANYA logo custom di public/icons/.
   - SALAH: <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg> untuk ikon plus; <i className="fa fa-trash" />; import { FaTrash } from 'react-icons/fa'; import { TrashIcon } from '@heroicons/react'.
   - BENAR: <Plus size={16} />; <Trash2 size={16} />; logo kampus custom: <img src="/icons/logo-kampus.svg" /> dari public/icons/ (satu-satunya pengecualian).
3. WAJIB ukuran konsisten + warna ikut tema: size 16/18 untuk tombol-input, 20/22 untuk avatar/card-header.
   - SALAH: <Plus size={12} /> di tombol utama; <Search size={32} /> di input; color="#ff0000" hardcode mengabaikan tema.
   - BENAR: <Plus size={16} /> / <Filter size={16} /> / <Search size={18} /> di tombol-input; <Bell size={20} /> di card-header/avatar; warna via className="text-muted-foreground" atau ikut tema (currentColor).

Catatan:
- HANYA periksa baris baru (+) yaitu baris kode baru yang DITAMBAHKAN atau DIUBAH (diawali tanda `+`). JANGAN menolak baris konteks yang tidak diubah (tanpa `+`).

Git Diff:
EOF

echo '```diff' >> "$PROMPT_FILE"
echo "$STAGED_DIFF" >> "$PROMPT_FILE"
echo '```' >> "$PROMPT_FILE"

cat << 'EOF' >> "$PROMPT_FILE"
PENTING: Jawab HANYA secara langsung tanpa memanggil tool atau membaca file.
Format Respon:
- Jika kode bersih dan memenuhi Icon Standard, jawab TEPAT: PASSED
- Jika ditemukan pelanggaran pada baris baru (+), awali respon dengan REJECTED dan berikan rincian lengkap:
  * File & Potongan Baris Melanggar: (nama file dan baris/kode yang melanggar)
  * Aturan yang Dilanggar: (nama aturan / standar ikon yang dilanggar)
  * Alasan Penolakan: (penjelasan detail mengapa kode tersebut melanggar)
  * Solusi / Rekomendasi Perbaikan: (solusi konkrit atau contoh kode perbaikan)
EOF

AI_EXIT_CODE=1
if [ "$AI_ENGINE" != "agy" ] && [ -x "$OPENCODE_BIN" ]; then
    RESULT=$(timeout 120s "$OPENCODE_BIN" run --pure -m "$MODEL" "$(cat "$PROMPT_FILE")" 2>&1)
    AI_EXIT_CODE=$?
fi

if [ $AI_EXIT_CODE -ne 0 ] && command -v agy &> /dev/null; then
    RESULT=$(timeout 120s agy --model gemini-3.8-flash-low --print "$(cat "$PROMPT_FILE")" 2>&1)
    AI_EXIT_CODE=$?
fi

rm -f "$PROMPT_FILE"

if [ $AI_EXIT_CODE -ne 0 ]; then
    echo "❌ [Audit Icon Standard] REJECTED: AI Reviewer gagal/timeout (Exit: $AI_EXIT_CODE)!"
    exit 1
fi

CLEAN_RESULT=$(echo "$RESULT" | sed -e '/^> build/d' -e '/^Loaded config/d' | awk '/./{p=1} p')

if echo "$RESULT" | grep -qi "REJECTED"; then
    echo "❌ [Audit Icon Standard] REJECTED oleh AI (Muse Spark)!"
    echo "================================ DETAIL TEMUAN AUDIT ================================"
    echo "$CLEAN_RESULT"
    echo "===================================================================================="
    echo "💡 Harap perbaiki seluruh pelanggaran di atas sebelum melakukan commit."
    exit 1
elif ! echo "$RESULT" | grep -qi "PASSED"; then
    echo "❌ [Audit Icon Standard] REJECTED: AI tidak memberikan keputusan PASSED yang valid!"
    echo "================================ DETAIL OUTPUT ====================================="
    echo "$CLEAN_RESULT"
    echo "===================================================================================="
    exit 1
else
    echo "✅ [Audit Icon Standard] PASSED (Divalidasi AI Muse Spark 1.3)."
    exit 0
fi
