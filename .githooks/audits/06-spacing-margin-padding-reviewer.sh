#!/bin/bash
# ==============================================================================
# AUDIT 06: Spacing, Margin & Padding Reviewer (FE) — AI Muse Spark Strict (Full Diff, tanpa regex)
# ==============================================================================

echo "🤖 [Audit 6/8: Spacing, Margin & Padding Standard] Memeriksa perubahan dengan AI (AI Muse Spark 1.3)..."

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

# ------------------------------------------------------------------------------
# DEEP AI AUDIT
# ------------------------------------------------------------------------------
PROMPT_FILE=$(mktemp)

cat << 'EOF' > "$PROMPT_FILE"
Kamu adalah Code Auditor khusus Spacing, Margin, Padding & Layout Alignment Standard (Strict Frontend Reviewer).
Periksa Git Diff berikut HANYA terhadap 4 aturan di bawah. Penilaian MURNI oleh AI dari full diff ini, tanpa regex/pre-check.

Aturan Baku (STRICT):
1. WAJIB token PERSIS: p-2/p-3/p-4/p-6, m-2/m-4/m-6/my-4/mx-auto/mt-4/mb-6, gap-2/gap-3/gap-4/gap-6, space-y/x-4/6; DILARANG token lain dan arbitrary -[...].
   - SALAH: p-5, p-7, m-3, m-5, gap-5, gap-8, p-1, m-1; arbitrary: p-[19px], m-[37px], gap-[13px], mt-[42px], px-[55px].
   - BENAR: className="p-4 gap-4", className="p-6 m-4", className="my-4 mx-auto", className="space-y-4", className="space-x-6".
2. WAJIB card/container compact p-4/p-6 desktop dan p-3/p-4 mobile (termasuk Page Wrapper); DILARANG oversized p-8/10/12/16/20/24.
   - SALAH: <Card className="p-8">, <div className="p-12">, <div className="px-24 py-16">, Page Wrapper className="p-10".
   - BENAR: <Card className="p-4 md:p-6">; Page Wrapper: <div className="p-3 md:p-4"> atau <div className="p-4 md:p-6">.
3. WAJIB gap-4 untuk form grid 2 kolom dan gap-2 untuk grup tombol; DILARANG campur gap + margin manual mt-/mb-/ml-/mr- di anak flex/grid.
   - SALAH: <div className="flex gap-4"><Button className="ml-4 mt-2">Simpan</Button><Button className="mb-2">Batal</Button></div>; form grid gap-4 tapi tiap <Input className="mt-4 mb-2">.
   - BENAR: <div className="grid grid-cols-1 md:grid-cols-2 gap-4">...</div>; <div className="flex gap-2"><Button>Simpan</Button><Button>Batal</Button></div> tanpa mt-/mb-/ml-/mr- di anak.
4. WAJIB antar-section pakai space-y-4/6 atau mb-4/6; DILARANG margin negatif kecuali overlay khusus (avatar menumpuk banner).
   - SALAH: <div className="-mt-20"> untuk menggeser section biasa; <div className="mb-10">, <div className="space-y-8"> antar card.
   - BENAR: <div className="space-y-4"> atau <div className="space-y-6">; <Card className="mb-4" /> / <Card className="mb-6" />; margin negatif HANYA mis. <Avatar className="-mt-10 border-4" /> menumpuk banner.

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
- Jika kode bersih dan memenuhi Spacing, Margin & Padding Standard, jawab TEPAT: PASSED
- Jika ditemukan pelanggaran pada baris baru (+), awali respon dengan REJECTED dan berikan rincian lengkap:
  * File & Potongan Baris Melanggar: (nama file dan baris/kode yang melanggar)
  * Aturan yang Dilanggar: (nama aturan / standar spacing yang dilanggar)
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
    echo "❌ [Audit Spacing Standard] REJECTED: AI Reviewer gagal/timeout (Exit: $AI_EXIT_CODE)!"
    exit 1
fi

CLEAN_RESULT=$(echo "$RESULT" | sed -e '/^> build/d' -e '/^Loaded config/d' | awk '/./{p=1} p')

if echo "$RESULT" | grep -qi "REJECTED"; then
    echo "❌ [Audit Spacing Standard] REJECTED oleh AI (Muse Spark)!"
    echo "================================ DETAIL TEMUAN AUDIT ================================"
    echo "$CLEAN_RESULT"
    echo "===================================================================================="
    echo "💡 Harap perbaiki seluruh pelanggaran di atas sebelum melakukan commit."
    exit 1
elif ! echo "$RESULT" | grep -qi "PASSED"; then
    echo "❌ [Audit Spacing Standard] REJECTED: AI tidak memberikan keputusan PASSED yang valid!"
    echo "================================ DETAIL OUTPUT ====================================="
    echo "$CLEAN_RESULT"
    echo "===================================================================================="
    exit 1
else
    echo "✅ [Audit Spacing Standard] PASSED (Divalidasi AI Muse Spark 1.3)."
    exit 0
fi
