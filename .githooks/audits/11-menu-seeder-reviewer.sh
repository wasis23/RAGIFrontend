#!/bin/bash
# ==============================================================================
# AUDIT 11: Menu Seeder & Frontend Icon Sync Reviewer (FE/Fullstack)
# Memastikan seeder menu terorganisasi rapi dan 100% ikonnya terpetakan di Sidebar.tsx
# ==============================================================================

echo "📋 [Audit 11: Menu Seeder & Icon Synchronization] Memeriksa kerapian menu seeder dan pemetaan ikon..."

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
BACKEND_DIR="$(cd "$REPO_ROOT/../integrated_sistem_backend" 2>/dev/null && pwd)"

# 1. Jalankan audit backend jika direktori backend tersedia
if [ -d "$BACKEND_DIR" ] && [ -x "$BACKEND_DIR/.githooks/audits/08-menu-seeder-reviewer.sh" ]; then
    (cd "$BACKEND_DIR" && ./.githooks/audits/08-menu-seeder-reviewer.sh)
    BACKEND_EXIT_CODE=$?
    if [ $BACKEND_EXIT_CODE -ne 0 ]; then
        exit $BACKEND_EXIT_CODE
    fi
fi

# 2. Verifikasi Pemetaan Ikon di Frontend Sidebar.tsx
SYNC_RESULT=$(node -e "
const fs = require('fs');
const path = require('path');

// Ambil icon yang terdaftar di Sidebar.tsx
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

// Cari seeder menu di backend
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
    if (!supportedIcons.has(iconName)) {
      unmapped.push({ file: sPath, icon: iconName });
    }
  }
}

if (unmapped.length > 0) {
  console.log(JSON.stringify(unmapped));
}
")

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

echo "✅ [Audit Menu Seeder & Icon Sync] PASSED (Seeder menu terorganisasi rapi & seluruh ikon terpetakan di Sidebar)."
exit 0
