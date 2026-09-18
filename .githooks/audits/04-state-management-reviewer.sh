#!/bin/bash
# ==============================================================================
# AUDIT 04: State Management Reviewer (FE) — AI Muse Spark Strict (Full Diff, tanpa regex)
# ==============================================================================

echo "🤖 [Audit 4/9: State Management Standard] Memeriksa perubahan dengan AI (AI Muse Spark 1.3)..."

export PATH="$HOME/.opencode/bin:/usr/local/bin:$PATH"
OPENCODE_BIN=$(command -v opencode || echo "$HOME/.opencode/bin/opencode")
MODEL="${OPENCODE_MODEL:-opencode/muse-spark-1.3-contributor-free}"

if [ -n "$DIFF_TARGET" ]; then
    STAGED_DIFF=$(git diff "$DIFF_TARGET" -- "store/**" "hooks/**" "app/(main)/**")
else
    STAGED_DIFF=$(git diff --cached -- "store/**" "hooks/**" "app/(main)/**")
fi

if [ -z "$STAGED_DIFF" ]; then
    echo "ℹ️ [Audit State Management Standard] Tidak ada perubahan state/store yang diuji. Skip."
    exit 0
fi

# ------------------------------------------------------------------------------
# DEEP AI AUDIT
# ------------------------------------------------------------------------------
PROMPT_FILE=$(mktemp)

cat << 'EOF' > "$PROMPT_FILE"
Kamu adalah Code Auditor khusus State Management Standard (Strict Frontend Reviewer).
Periksa Git Diff berikut HANYA terhadap 3 aturan di bawah. Penilaian MURNI oleh AI dari full diff ini, tanpa regex/pre-check.

Aturan Baku (STRICT):
1. WAJIB global store pakai Zustand di @/store/ + interface State & Actions terpisah + 'use client' baris atas + pola create<StoreType>() + selector useXStore((s)=>s.x).
   - SALAH: import { createContext, useReducer } untuk global auth; export const useStore = create((set) => ({...})) tanpa tipe; interface State+Actions digabung inline di file store; tanpa 'use client'; const data = useXStore() (subscribe seluruh store).
   - BENAR: 'use client' di baris 1; // types/auth-store.types.ts: interface AuthState { token: string | null } interface AuthActions { setToken: (t: string) => void } type AuthStore = AuthState & AuthActions; // store/auth-store.ts: export const useAuthStore = create<AuthStore>()((set) => ({...})); pakai: const token = useAuthStore((s) => s.token).
2. WAJIB persist pakai middleware persist + name unik; WAJIB sessionStorage untuk auth/sesi, localStorage untuk preferensi (createJSONStorage).
   - SALAH: persist tanpa name; auth token disimpan di localStorage permanen; preferensi tema disimpan di sessionStorage; localStorage.setItem manual di luar persist.
   - BENAR: import { createJSONStorage, persist } from 'zustand/middleware'; auth: persist(..., { name: 'auth-session', storage: createJSONStorage(() => sessionStorage) }); preferensi: persist(..., { name: 'ui-preferences', storage: createJSONStorage(() => localStorage) }).
3. DILARANG data transient/halaman-spesifik di global store; WAJIB useState/React Query (kecuali diakses lintas halaman/komponen).
   - SALAH: menyimpan search/page/sort tabel satu halaman, baris terpilih, open modal lokal ke useXStore global padahal hanya dipakai satu halaman.
   - BENAR: const [page, setPage] = useState(1); const { data } = useQuery(...); global store HANYA untuk state lintas halaman/komponen (auth, tema, modul aktif).

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
- Jika kode bersih dan memenuhi State Management Standard, jawab TEPAT: PASSED
- Jika ditemukan pelanggaran pada baris baru (+), awali respon dengan REJECTED dan berikan rincian lengkap:
  * File & Potongan Baris Melanggar: (nama file dan baris/kode yang melanggar)
  * Aturan yang Dilanggar: (nama aturan / standar state management yang dilanggar)
  * Alasan Penolakan: (penjelasan detail mengapa kode tersebut melanggar)
  * Solusi / Rekomendasi Perbaikan: (solusi konkrit atau contoh kode perbaikan)
EOF

AI_EXIT_CODE=1
if [ "$AI_ENGINE" != "agy" ] && [ -x "$OPENCODE_BIN" ]; then
    RESULT=$(timeout 45s "$OPENCODE_BIN" run --pure -m "$MODEL" "$(cat "$PROMPT_FILE")" 2>&1)
    AI_EXIT_CODE=$?
fi

if [ $AI_EXIT_CODE -ne 0 ] && command -v agy &> /dev/null; then
    RESULT=$(timeout 30s agy --model gemini-3.8-flash-low --print "$(cat "$PROMPT_FILE")" 2>&1)
    AI_EXIT_CODE=$?
fi

rm -f "$PROMPT_FILE"

if [ $AI_EXIT_CODE -ne 0 ]; then
    echo "❌ [Audit State Management Standard] REJECTED: AI Reviewer gagal/timeout (Exit: $AI_EXIT_CODE)!"
    exit 1
fi

CLEAN_RESULT=$(echo "$RESULT" | sed -e '/^> build/d' -e '/^Loaded config/d' | awk '/./{p=1} p')

if echo "$RESULT" | grep -qi "REJECTED"; then
    echo "❌ [Audit State Management Standard] REJECTED oleh AI (Muse Spark)!"
    echo "================================ DETAIL TEMUAN AUDIT ================================"
    echo "$CLEAN_RESULT"
    echo "===================================================================================="
    echo "💡 Harap perbaiki seluruh pelanggaran di atas sebelum melakukan commit."
    exit 1
elif ! echo "$RESULT" | grep -qi "PASSED"; then
    echo "❌ [Audit State Management Standard] REJECTED: AI tidak memberikan keputusan PASSED yang valid!"
    echo "================================ DETAIL OUTPUT ====================================="
    echo "$CLEAN_RESULT"
    echo "===================================================================================="
    exit 1
else
    echo "✅ [Audit State Management Standard] PASSED (Divalidasi AI Muse Spark 1.3)."
    exit 0
fi
