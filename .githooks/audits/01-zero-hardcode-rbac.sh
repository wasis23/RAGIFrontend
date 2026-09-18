#!/bin/bash
# ==============================================================================
# AUDIT 01: Zero Hardcode & RBAC Reviewer (FE) — AI Muse Spark Strict (Full Diff, tanpa regex)
# ==============================================================================

echo "🤖 [Audit 1/8: Zero Hardcode & RBAC] Memeriksa perubahan dengan AI (AI Muse Spark 1.3)..."

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

# ------------------------------------------------------------------------------
# DEEP AI AUDIT
# ------------------------------------------------------------------------------
PROMPT_FILE=$(mktemp)

cat << 'EOF' > "$PROMPT_FILE"
Kamu adalah Code Auditor khusus Zero Hardcode & RBAC Policy (Strict Frontend Reviewer).
Periksa Git Diff berikut secara SANGAT KETAT terhadap 5 aturan di bawah. Penilaian MURNI oleh AI dari full diff ini, tanpa regex/pre-check.

Aturan Baku (STRICT):
1. DILARANG array literal statis untuk options dropdown; WAJIB fetch master via API.
   - Konteks: props options pada <Select>/<Dropdown>/AsyncSelect dan sejenisnya.
   - SALAH: options={[{ value: 'REGULER', label: 'Reguler' }]} atau const options = [{ value: 'spmb', label: 'SPMB' }].
   - BENAR: fetch dari API master referensi, mis. const { data } = useMasterTipeJalur(); lalu options={data.map(d => ({ value: d.id, label: d.label }))} (master_tipe_jalur, master_jalur_kelas, dsb.).
2. DILARANG user_type di MANA PUN dalam kode baru.
   - Mencakup: perbandingan ==/===/!=/!==, switch/case, ternary, destructure (const { user_type } = user / user.user_type / sso_user_type), definisi interface User di types/auth.types.ts, komponen UserTypeBadge statis, penyimpanan/pembacaan sso_user_type di cookie/middleware.
   - SALAH: if (user.user_type === 'admin'), switch (user.type), interface User { user_type: string }, document.cookie = `sso_user_type=${...}`.
   - BENAR: andalkan user.roles: Role[] dari API; cookie/middleware hanya menyimpan token + role slug dinamis; hapus field user_type dari types/auth.types.ts; hapus UserTypeBadge statis.
3. DILARANG string slug modul/role dalam branching IF/ELSE atau perbandingan statis; WAJIB relasi/filter pakai ID entitas.
   - SALAH: if (module === 'spmb'), role === 'mahasiswa' ? A : B, filter(m => m.slug === 'sikeu'), case 'superadmin':.
   - BENAR: filter by ID, mis. where('module_id', currentModule.id) / items.filter(i => i.module_id === moduleId); logika akses via aturan no. 4.
4. WAJIB otorisasi via hasRole/hasPermission dari useAuth(); WAJIB tampilkan role via user.roles?.[0]?.name.
   - SALAH: const { user } = ...; if (user.role === 'admin'); <span>{user.user_type}</span>.
   - BENAR: const { hasRole, hasPermission, user } = useAuth(); if (hasRole('admin')) ...; if (hasPermission('pegawai.delete')) ...; <span>{user.roles?.[0]?.name}</span>.
5. WAJIB bedakan argumen hasRole()/hasPermission() dari hardcode: string literal di DALAM argumen hasRole()/hasPermission() adalah BENAR, bukan pelanggaran.
   - SALAH (tetap pelanggaran): if (role === 'admin') di luar hasRole/hasPermission.
   - BENAR (bukan pelanggaran): hasRole('admin'), hasRole(['admin','dosen']), hasPermission('spmb.pendaftar.create').

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
- Jika kode bersih dan memenuhi aturan di atas, jawab TEPAT: PASSED
- Jika ditemukan pelanggaran pada baris baru (+), awali respon dengan REJECTED dan berikan rincian lengkap:
  * File & Potongan Baris Melanggar: (nama file dan baris/kode yang melanggar)
  * Aturan yang Dilanggar: (nama aturan / standar yang dilanggar)
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
    echo "❌ [Audit Zero Hardcode & RBAC] REJECTED: AI Reviewer gagal/timeout (Exit: $AI_EXIT_CODE)!"
    exit 1
fi

CLEAN_RESULT=$(echo "$RESULT" | sed -e '/^> build/d' -e '/^Loaded config/d' | awk '/./{p=1} p')

if echo "$RESULT" | grep -qi "REJECTED"; then
    echo "❌ [Audit Zero Hardcode & RBAC] REJECTED oleh AI (Muse Spark)!"
    echo "================================ DETAIL TEMUAN AUDIT ================================"
    echo "$CLEAN_RESULT"
    echo "===================================================================================="
    echo "💡 Harap perbaiki seluruh pelanggaran di atas sebelum melakukan commit."
    exit 1
elif ! echo "$RESULT" | grep -qi "PASSED"; then
    echo "❌ [Audit Zero Hardcode & RBAC] REJECTED: AI tidak memberikan keputusan PASSED yang valid!"
    echo "================================ DETAIL OUTPUT ====================================="
    echo "$CLEAN_RESULT"
    echo "===================================================================================="
    exit 1
else
    echo "✅ [Audit Zero Hardcode & RBAC] PASSED (Divalidasi AI Muse Spark 1.3)."
    exit 0
fi
