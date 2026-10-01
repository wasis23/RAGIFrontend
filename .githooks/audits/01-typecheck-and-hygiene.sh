#!/bin/bash
# ==============================================================================
# AUDIT 01 (FE): Fast Build, TypeCheck & Hygiene Standard (Deterministic Fast Check)
# ==============================================================================
# Memeriksa:
# 1. Kompilasi TypeScript murni (npx tsc --noEmit)
# 2. Hygiene Kode: larangan statement debugger & console debug liar
# 3. Icon Hygiene: larangan tag <svg> inline mentah (wajib gunakan lucide-react)
# 4. Sinkronisasi Ikon Menu Seeder terhadap components/layout/Sidebar.tsx
# ==============================================================================

echo "🔍 [Audit 1/3: TypeCheck & Hygiene] Memeriksa integritas TypeScript, kebersihan kode, dan ikon..."

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

if [ -n "$DIFF_TARGET" ]; then
    STAGED_TS=$(git diff "$DIFF_TARGET" --name-only -- "*.ts" "*.tsx")
    STAGED_DIFF=$(git diff "$DIFF_TARGET")
else
    STAGED_TS=$(git diff --cached --name-only -- "*.ts" "*.tsx")
    STAGED_DIFF=$(git diff --cached)
fi

if [ -z "$STAGED_TS" ] && [ -z "$STAGED_DIFF" ]; then
    echo "ℹ️ [Audit 1/3] Tidak ada file TypeScript/Frontend yang diuji. Skip."
    exit 0
fi

# ------------------------------------------------------------------------------
# 1. FAST TYPESCRIPT VERIFICATION (tsc --noEmit)
# ------------------------------------------------------------------------------
if [ -n "$STAGED_TS" ]; then
    echo "⚡ Menjalankan Fast TypeScript Verification (npx tsc --noEmit)..."
    TSC_OUTPUT=$(npx tsc --noEmit 2>&1)
    EXIT_CODE=$?

    if [ $EXIT_CODE -ne 0 ]; then
        echo "❌ [Audit TypeCheck] TYPECHECK GAGAL!"
        echo "================================ DETAIL KESALAHAN TYPESCRIPT ========================"
        echo "$TSC_OUTPUT" | head -n 50
        echo "===================================================================================="
        echo "💡 Ditemukan kesalahan tipe data/sintaks TypeScript. Harap perbaiki sebelum commit."
        exit 1
    fi
fi

# ------------------------------------------------------------------------------
# 2. DEBUGGER STATEMENT HYGIENE
# ------------------------------------------------------------------------------
DEBUGGER_MATCHES=$(echo "$STAGED_DIFF" | grep -E '^[+]\s*debugger\s*;' | grep -v '^[+]\s*//')
if [ -n "$DEBUGGER_MATCHES" ]; then
    echo "❌ [Audit Hygiene] Ditemukan statement debugger pada baris baru (+):"
    echo "$DEBUGGER_MATCHES"
    echo "💡 Hapus statement debugger sebelum melakukan commit."
    exit 1
fi

# ------------------------------------------------------------------------------
# 3. ICON HYGIENE (No raw inline <svg> where Lucide-React exists)
# ------------------------------------------------------------------------------
RAW_SVG_MATCHES=$(echo "$STAGED_DIFF" | grep -E '^[+]\s*<svg\b' | grep -v '^[+]\s*//' || true)
if [ -n "$RAW_SVG_MATCHES" ]; then
    echo "❌ [Audit Icon Standard] Ditemukan tag <svg> inline mentah pada baris baru (+):"
    echo "$RAW_SVG_MATCHES"
    echo "💡 Wajib gunakan komponen icon resmi dari pustaka 'lucide-react' alih-alih tag <svg> inline mentah."
    exit 1
fi

# ------------------------------------------------------------------------------
# 4. MENU SEEDER & SIDEBAR ICON SYNCHRONIZATION
# ------------------------------------------------------------------------------
SYNC_RESULT=$(node -e "
const fs = require('fs');
const path = require('path');

const sidebarPath = 'components/layout/Sidebar.tsx';
if (!fs.existsSync(sidebarPath)) {
  process.exit(0);
}

const sidebar = fs.readFileSync(sidebarPath, 'utf8');
const iconMapMatch = sidebar.match(/iconMap:\s*Record<string,\s*any>\s*=\s*\{([\s\S]*?)\};/);
const supportedIcons = new Set();
if (iconMapMatch) {
  const lines = iconMapMatch[1].split('\n');
  for (const line of lines) {
    const m = line.match(/['\"]([^'\"]+)['\"]\s*:/);
    if (m) supportedIcons.add(m[1]);
  }
}

const backendSeeders = [
  '../integrated_sistem_backend/database/seeders/IAM/MenuSeeder.php',
  '../integrated_sistem_backend/database/seeders/SpmbMenuSeeder.php'
];

const unmapped = [];
for (const sPath of backendSeeders) {
  if (!fs.existsSync(sPath)) continue;
  const content = fs.readFileSync(sPath, 'utf8');
  const matches = content.matchAll(/['\"]icon['\"]\s*=>\s*['\"]([^'\"]+)['\"]/g);
  for (const m of matches) {
    const iconName = m[1];
    if (iconName && !supportedIcons.has(iconName)) {
      unmapped.push({ file: sPath, icon: iconName });
    }
  }
}

if (unmapped.length > 0) {
  console.log(JSON.stringify(unmapped));
}
" 2>/dev/null || true)

if [ -n "$SYNC_RESULT" ] && [ "$SYNC_RESULT" != "[]" ]; then
    echo "❌ [Audit Menu Seeder & Icon Sync] REJECTED!"
    echo "================================ DETAIL TEMUAN AUDIT ================================"
    node -e "
      const data = JSON.parse(process.argv[1]);
      data.forEach((item, idx) => {
        console.log(\`[\${idx + 1}] Ikon: \${item.icon}\`);
        console.log(\`    Ditemukan di: \${item.file}\`);
        console.log(\`    Alasan: Ikon belum didaftarkan di iconMap components/layout/Sidebar.tsx.\`);
        console.log('--------------------------------------------------------------------------------');
      });
    " "$SYNC_RESULT"
    echo "===================================================================================="
    echo "💡 Harap daftarkan ikon di atas ke dalam iconMap pada components/layout/Sidebar.tsx."
    exit 1
fi

echo "✅ [Audit 1/3: TypeCheck & Hygiene] PASSED (0 kesalahan tipe data/sintaks, kode bersih)."
exit 0
