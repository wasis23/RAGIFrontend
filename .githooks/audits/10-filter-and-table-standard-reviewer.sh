#!/bin/bash
# ==============================================================================
# AUDIT 10: Filter Button Position & Table Background Standard Reviewer (FE)
# 1. Memastikan tombol Filter WAJIB selalu di sebelah KIRI tombol Tambah Data
#    pada PageHeader action dan container aksi ([Filter] [Tambah Data]).
# 2. Memastikan background tabel/DataTable WAJIB selalu berwarna putih solid
#    (bg-white / #ffffff), DILARANG berwarna abu-abu (bg-slate-50, bg-gray-100, dll).
# ==============================================================================

echo "🤖 [Audit 10: Filter & Table Standard] Memeriksa posisi tombol Filter dan warna background tabel (Wajib Putih)..."

export PATH="$HOME/.local/bin:$HOME/.opencode/bin:/usr/local/bin:$PATH"
AI_ENGINE="${AI_ENGINE:-agy}"
OPENCODE_BIN=$(command -v opencode || echo "$HOME/.opencode/bin/opencode")
MODEL="${OPENCODE_MODEL:-opencode/muse-spark-1.3-contributor-free}"

if [ -n "$DIFF_TARGET" ]; then
    TARGET_FILES=$(git diff "$DIFF_TARGET" --name-only -- "app/**/*.tsx" "components/**/*.tsx" "app/globals.css")
    STAGED_DIFF=$(git diff "$DIFF_TARGET" -- "app/**/*.tsx" "components/**/*.tsx" "app/globals.css")
else
    TARGET_FILES=$(git diff --cached --name-only -- "app/**/*.tsx" "components/**/*.tsx" "app/globals.css")
    STAGED_DIFF=$(git diff --cached -- "app/**/*.tsx" "components/**/*.tsx" "app/globals.css")
fi

# Jika dijalankan manual tanpa git stage / diff target, uji semua file
IS_MANUAL_RUN=false
if [ -z "$TARGET_FILES" ] && [ -z "$STAGED_DIFF" ]; then
    if [ -t 0 ] || [ "$1" == "--all" ] || [ -z "$GIT_INDEX_FILE" ]; then
        IS_MANUAL_RUN=true
        TARGET_FILES=$(find app components -type f \( -name "*.tsx" -o -name "globals.css" \) 2>/dev/null)
    fi
fi

if [ -z "$TARGET_FILES" ] && [ -z "$STAGED_DIFF" ]; then
    echo "ℹ️ [Audit Filter & Table Standard] Tidak ada file Page/Komponen/CSS yang diuji. Skip."
    exit 0
fi

if [ ${#STAGED_DIFF} -gt 80000 ]; then
    STAGED_DIFF="${STAGED_DIFF:0:80000}"$'\n\n[CATATAN: diff dipotong pada 80.000 karakter. Nilai HANYA yang terlihat di atas; JANGAN mengarang pelanggaran pada file/bagian yang tidak tampak.]'
fi

# ------------------------------------------------------------------------------
# 1. DETERMINISTIC STATIC AST/REGEX CHECKER (High Speed & 100% Deterministic)
# ------------------------------------------------------------------------------
STATIC_CHECK_RESULT=$(node -e "
const fs = require('fs');

const fileList = process.argv.slice(1).filter(f => f && fs.existsSync(f));
const violations = [];

// 1. Verifikasi integritas background putih pada DataTable.tsx dan globals.css
if (fs.existsSync('components/ui/DataTable.tsx')) {
  const dt = fs.readFileSync('components/ui/DataTable.tsx', 'utf8');
  if (!dt.includes('table-container bg-white') || !dt.includes('table bg-white') || !dt.includes('tbody className=\"bg-white\"')) {
    violations.push({
      file: 'components/ui/DataTable.tsx',
      line: 46,
      reason: 'DataTable wajib mempertahankan class bg-white pada container, table, dan tbody.',
      snippet: 'table-container bg-white / table bg-white'
    });
  }
}

if (fs.existsSync('app/globals.css')) {
  const css = fs.readFileSync('app/globals.css', 'utf8');
  const match = css.match(/\.table-container\s*\{([\s\S]*?)\}/);
  if (!match || !match[1].includes('background: #ffffff')) {
    violations.push({
      file: 'app/globals.css',
      line: 960,
      reason: 'globals.css: .table-container wajib mempertahankan background: #ffffff.',
      snippet: match ? match[0].trim() : '.table-container {}'
    });
  }
}

// 2. Pemeriksaan per-file untuk posisi tombol & background tabel
function checkFile(file) {
  if (!file.endsWith('.tsx')) return;
  const content = fs.readFileSync(file, 'utf8');

  // A. Periksa Posisi Tombol Filter vs Tambah di PageHeader action
  const regex = /<PageHeader[\s\S]*?action=\{/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    let startIndex = match.index + match[0].length;
    let depth = 1;
    let currentIndex = startIndex;
    while (currentIndex < content.length && depth > 0) {
      if (content[currentIndex] === '{') depth++;
      else if (content[currentIndex] === '}') depth--;
      currentIndex++;
    }
    if (depth === 0) {
      const actionCode = content.slice(startIndex, currentIndex - 1);
      const actionStartLine = content.slice(0, startIndex).split('\n').length;

      const buttonRegex = /<Button[\s\S]*?<\/Button>/g;
      let bMatch;
      const buttons = [];
      while ((bMatch = buttonRegex.exec(actionCode)) !== null) {
        const btnCode = bMatch[0];
        const isFilter = /<Filter|Filter/i.test(btnCode) && !/Tambah|Create|Plus/i.test(btnCode);
        const isTambah = /<Plus|<FilePlus|Tambah|Create|Buat|Susun|Input/i.test(btnCode) && !/Filter/i.test(btnCode);
        buttons.push({ code: btnCode, index: bMatch.index, isFilter, isTambah });
      }

      const firstTambah = buttons.find(b => b.isTambah);
      const firstFilter = buttons.find(b => b.isFilter);

      if (firstTambah && firstFilter && firstTambah.index < firstFilter.index) {
        violations.push({
          file,
          line: actionStartLine,
          reason: 'Tombol Tambah/Create mendahului tombol Filter pada PageHeader action. Filter WAJIB di sebelah kiri Tambah.',
          snippet: actionCode.trim()
        });
      }
    }
  }

  // B. Periksa Posisi Tombol Filter vs Tambah di container flex generik
  const divRegex = /<div[^>]*className=[^>]*flex[^>]*>([\s\S]*?)<\/div>/g;
  let dMatch;
  while ((dMatch = divRegex.exec(content)) !== null) {
    const divBlock = dMatch[1];
    if (divBlock.includes('<Button') && /<Filter|Filter/i.test(divBlock) && (/<Plus|<FilePlus|Tambah|Create/i.test(divBlock))) {
      const line = content.slice(0, dMatch.index).split('\n').length;
      const buttonRegex = /<Button[\s\S]*?<\/Button>/g;
      let bMatch;
      const buttons = [];
      while ((bMatch = buttonRegex.exec(divBlock)) !== null) {
        const btnCode = bMatch[0];
        const isFilter = /<Filter|Filter/i.test(btnCode) && !/Tambah|Create|Plus/i.test(btnCode);
        const isTambah = /<Plus|<FilePlus|Tambah|Create|Buat|Susun|Input/i.test(btnCode) && !/Filter/i.test(btnCode);
        buttons.push({ code: btnCode, index: bMatch.index, isFilter, isTambah });
      }
      const firstTambah = buttons.find(b => b.isTambah);
      const firstFilter = buttons.find(b => b.isFilter);
      if (firstTambah && firstFilter && firstTambah.index < firstFilter.index) {
        if (!violations.some(v => v.file === file && Math.abs(v.line - line) < 5)) {
          violations.push({
            file,
            line,
            reason: 'Tombol Tambah/Create mendahului tombol Filter pada action container. Filter WAJIB di sebelah kiri Tambah.',
            snippet: divBlock.trim()
          });
        }
      }
    }
  }

  // C. Periksa Warna Background Wrapper Tabel (Wajib Putih, Dilarang Abu-abu)
  if (content.includes('<DataTable')) {
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      // Deteksi jika wrapper pembungkus tabel diberi background abu-abu
      if (/(?<!hover:)(bg-slate-(?:50|100|200)|bg-gray-(?:50|100|200)|bg-zinc-(?:50|100)|bg-neutral-(?:50|100))/.test(line)) {
        const forward = lines.slice(idx, Math.min(lines.length, idx + 6)).join('\n');
        if (forward.includes('<DataTable')) {
          violations.push({
            file,
            line: idx + 1,
            reason: 'Dilarang menggunakan background abu-abu sebagai container/wrapper DataTable. Wajib bg-white.',
            snippet: line.trim()
          });
        }
      }
    });
  }
}

fileList.forEach(checkFile);

if (violations.length > 0) {
  console.log(JSON.stringify(violations, null, 2));
}
" $TARGET_FILES)

if [ -n "$STATIC_CHECK_RESULT" ] && [ "$STATIC_CHECK_RESULT" != "[]" ]; then
    echo "❌ [Audit Filter & Table Standard] REJECTED (Static Analysis)!"
    echo "================================ DETAIL TEMUAN AUDIT ================================"
    echo "$STATIC_CHECK_RESULT" | node -e "
      const data = JSON.parse(require('fs').readFileSync(0, 'utf8'));
      data.forEach((item, idx) => {
        console.log(\`[\${idx + 1}] File: \${item.file}:\${item.line}\`);
        console.log(\`    Alasan: \${item.reason}\`);
        console.log(\`    Snippet:\n\${item.snippet.split('\n').map(l => '      ' + l).join('\n')}\`);
        console.log('--------------------------------------------------------------------------------');
      });
    "
    echo "===================================================================================="
    echo "💡 Harap perbaiki pelanggaran di atas sebelum melakukan commit."
    exit 1
fi

# Jika mode manual dan kode statik bersih, langsung pass
if [ "$IS_MANUAL_RUN" = true ] && [ -z "$STAGED_DIFF" ]; then
    echo "✅ [Audit Filter & Table Standard] PASSED (Static Analysis: Posisi Filter benar & background tabel putih bersih)."
    exit 0
fi

# ------------------------------------------------------------------------------
# 2. AI AUDIT (Jika ada staged diff dan tool AI tersedia)
# ------------------------------------------------------------------------------
if [ -n "$STAGED_DIFF" ] && { [ -x "$OPENCODE_BIN" ] || command -v agy &> /dev/null; }; then
    PROMPT_FILE=$(mktemp)

    cat << 'EOF' > "$PROMPT_FILE"
Kamu adalah Code Auditor khusus Frontend UI (Strict Reviewer untuk Filter & Table Standards).
Periksa Git Diff berikut HANYA terhadap 2 aturan baku di bawah:

ATURAN BAKU:
1. POSISI TOMBOL FILTER & TAMBAH:
   - Tombol Filter WAJIB diletakkan di sebelah KIRI tombol Tambah Data / Create / Plus pada prop action <PageHeader /> atau container aksi ([Filter] [Tambah Data]).
   - SALAH: <Button>Tambah Data</Button><Button>Filter</Button> (Tambah mendahului Filter).
   - BENAR: <Button variant="outline"><Filter size={16} /> Filter</Button><Button><Plus size={16} /> Tambah Data</Button> (Filter di sebelah kiri Tambah).

2. BACKGROUND TABEL WAJIB PUTIH (DILARANG ABU-ABU):
   - Seluruh tabel (komponen DataTable, container pembungkus tabel, dan baris tabel) WAJIB berlatar belakang putih solid (bg-white / #ffffff).
   - DILARANG memberi warna latar belakang abu-abu (seperti bg-slate-50, bg-slate-100, bg-gray-50, bg-gray-100, dsb.) pada wrapper tabel atau baris data tabel, atau membiarkan tabel transparan.
   - Pengecualian hanya untuk efek hover baris data (hover:bg-slate-50).

Catatan:
- HANYA periksa baris baru (+) yaitu baris kode baru yang DITAMBAHKAN atau DIUBAH (diawali tanda `+`). JANGAN menolak baris konteks yang tidak diubah (tanpa `+`).

- JANGAN menuduh sebuah simbol/komponen/ikon "tidak di-import" atau "tidak terdefinisi": diff hanya memuat potongan file, sehingga baris import sering berada DI LUAR diff. Validitas import sudah diverifikasi terpisah (tsc --noEmit untuk FE, php -l untuk BE). Laporkan hanya pelanggaran yang benar-benar terlihat pada baris (+).

Git Diff:
EOF

    echo '```diff' >> "$PROMPT_FILE"
    echo "$STAGED_DIFF" >> "$PROMPT_FILE"
    echo '```' >> "$PROMPT_FILE"

    cat << 'EOF' >> "$PROMPT_FILE"
PENTING: Jawab HANYA secara langsung tanpa memanggil tool atau membaca file.
Format Respon:
- Jika kode bersih dan memenuhi kedua aturan (Filter di kiri Tambah dan background tabel putih solid), jawab TEPAT: PASSED
- Jika ditemukan pelanggaran pada baris baru (+), awali respon dengan REJECTED dan berikan rincian lengkap:
  * File & Potongan Baris Melanggar: (nama file dan baris yang melanggar)
  * Aturan yang Dilanggar: (sebutkan aturan 1 atau 2)
  * Alasan Penolakan: (penjelasan detail)
  * Solusi / Rekomendasi Perbaikan: (solusi perbaikan kode)
EOF

    AI_EXIT_CODE=1
    if [ "$AI_ENGINE" != "agy" ] && [ -x "$OPENCODE_BIN" ]; then
        RESULT=$(timeout 120s "$OPENCODE_BIN" run --pure -m "$MODEL" "$(cat "$PROMPT_FILE")" 2>&1)
        AI_EXIT_CODE=$?
    fi

    if [ $AI_EXIT_CODE -ne 0 ] && command -v agy &> /dev/null; then
        RESULT=$(timeout 20s agy --model gemini-3.8-flash-low --print "$(cat "$PROMPT_FILE")" 2>&1)
        AI_EXIT_CODE=$?
    fi

    rm -f "$PROMPT_FILE"

    if [ $AI_EXIT_CODE -eq 0 ]; then
        CLEAN_RESULT=$(echo "$RESULT" | sed -e '/^> build/d' -e '/^Loaded config/d' | awk '/./{p=1} p')
        if echo "$RESULT" | grep -qi "REJECTED"; then
            echo "❌ [Audit Filter & Table Standard] REJECTED oleh AI!"
            echo "================================ DETAIL TEMUAN AUDIT ================================"
            echo "$CLEAN_RESULT"
            echo "===================================================================================="
            exit 1
        fi
    fi
fi

echo "✅ [Audit Filter & Table Standard] PASSED (Tombol Filter di kiri Tambah & Background tabel putih bersih)."
exit 0
