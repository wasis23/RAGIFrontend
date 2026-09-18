#!/bin/bash
# ==============================================================================
# AUDIT 03: Form Validation Standard Reviewer (FE) — AI Muse Spark Strict (Full Diff, tanpa regex)
# ==============================================================================

echo "🤖 [Audit 3/9: Form & Input Validation Standard] Memeriksa perubahan dengan AI (AI Muse Spark 1.3)..."

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

# ------------------------------------------------------------------------------
# DEEP AI AUDIT
# ------------------------------------------------------------------------------
PROMPT_FILE=$(mktemp)

cat << 'EOF' > "$PROMPT_FILE"
Kamu adalah Code Auditor khusus Form Validation & Input Component Standard (Strict Frontend Reviewer).
Periksa Git Diff berikut HANYA terhadap 4 aturan di bawah. Penilaian MURNI oleh AI dari full diff ini, tanpa regex/pre-check.

Aturan Baku (STRICT):
1. WAJIB UI Kit per fungsi; DILARANG tag form mentah.
   - Input untuk teks/angka/tanggal/email/password; Textarea untuk multiline; Select HANYA untuk opsi statis-sedikit; AsyncSelect WAJIB untuk data API; Checkbox untuk boolean.
   - SALAH: <input type="text" />, <select><option>A</option></select>, <textarea rows={5} /> mentah; <Select> untuk data ribuan user dari API.
   - BENAR: <Input label="Nama" type="text" />, <Input label="Email" type="email" />, <Textarea label="Alamat" />, <Select label="Status" options={[{value:'A',label:'Aktif'}]} /> (sedikit & statis), <AsyncSelect label="Mahasiswa" fetcher={fetchMahasiswa} />, <Checkbox label="Aktif" />.
2. DILARANG render ratusan/ribuan relasi ke select statis; WAJIB dropdown API pakai AsyncSelect server-side search+pagination.
   - SALAH: <Select options={allMahasiswa.map(m => ({ value: m.id, label: m.nama }))} /> dengan allMahasiswa 5000 baris; useEffect fetch semua lalu .map ke <option>.
   - BENAR: <AsyncSelect label="Mahasiswa" loadOptions={(q, page) => fetch(`/api/mahasiswa?search=${q}&page=${page}&limit=20`)} /> dengan search + pagination server-side.
3. WAJIB skema Zod z.object di LUAR komponen + zodResolver + react-hook-form; DILARANG form tanpa validasi / validasi manual; WAJIB error Bahasa Indonesia di bawah field.
   - SALAH: const onSubmit = () => { if (val === '') alert('isi!'); }; useForm() tanpa resolver; const schema didefinisikan di dalam komponen sehingga dibuat ulang tiap render; error bahasa Inggris / tidak ditampilkan.
   - BENAR: const schema = z.object({ nama: z.string().min(1, 'Nama wajib diisi'), email: z.string().email('Email tidak valid') }); di LUAR komponen; const { register, formState: { errors } } = useForm({ resolver: zodResolver(schema) }); {errors.nama && <p className="form-error">{errors.nama.message}</p>}.
4. WAJIB submit dengan loading={isSubmitting}+disabled saat submitting.
   - SALAH: <Button onClick={onSubmit}>Simpan</Button> tanpa state loading sehingga bisa double-submit.
   - BENAR: const { formState: { isSubmitting } } = form; <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>Simpan</Button>.

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
- Jika kode bersih dan memenuhi Form Validation Standard, jawab TEPAT: PASSED
- Jika ditemukan pelanggaran pada baris baru (+), awali respon dengan REJECTED dan berikan rincian lengkap:
  * File & Potongan Baris Melanggar: (nama file dan baris/kode yang melanggar)
  * Aturan yang Dilanggar: (nama aturan / standar validasi form yang dilanggar)
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
    echo "❌ [Audit Form Validation Standard] REJECTED: AI Reviewer gagal/timeout (Exit: $AI_EXIT_CODE)!"
    exit 1
fi

CLEAN_RESULT=$(echo "$RESULT" | sed -e '/^> build/d' -e '/^Loaded config/d' | awk '/./{p=1} p')

if echo "$RESULT" | grep -qi "REJECTED"; then
    echo "❌ [Audit Form Validation Standard] REJECTED oleh AI (Muse Spark)!"
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
    echo "✅ [Audit Form Validation Standard] PASSED (Divalidasi AI Muse Spark 1.3)."
    exit 0
fi
