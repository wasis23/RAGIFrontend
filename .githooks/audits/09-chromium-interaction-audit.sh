#!/bin/bash
# ==============================================================================
# AUDIT 09: Chromium Interaction Audit (FE) — AI Muse Spark Strict (Full Diff)
# Jika staged diff menyentuh form/elemen interaktif (dinilai AI dari full diff),
# perubahan WAJIB diuji langsung dengan chromium headless (playwright, read-only:
# tanpa submit/login/mutasi data) dan hasilnya WAJIB dilaporkan ke
# .agents/laporan/. Laporan ikut ter-commit sebagai bukti; post-commit hook
# menghapus salinan lokalnya (riwayat git tetap menyimpan).
# ==============================================================================

echo "🤖 [Audit 9/9: Chromium Interaction] Memeriksa perubahan dengan AI (AI Muse Spark 1.3)..."

export PATH="$HOME/.opencode/bin:/usr/local/bin:$PATH"
OPENCODE_BIN=$(command -v opencode || echo "$HOME/.opencode/bin/opencode")
MODEL="${OPENCODE_MODEL:-opencode/muse-spark-1.3-contributor-free}"
BASE_URL="${LAPORAN_BASE_URL:-http://localhost:3000}"
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
LAPORAN_DIR="$REPO_ROOT/.agents/laporan"
SHOT_DIR="$LAPORAN_DIR/assets"

if [ -n "$DIFF_TARGET" ]; then
    STAGED_DIFF=$(git diff "$DIFF_TARGET" -- "app/**" "components/**" "hooks/**" "store/**" "services/**" "lib/**")
    CHANGED_FILES=$(git diff "$DIFF_TARGET" --name-only --diff-filter=ACM -- "app/**" "components/**" "hooks/**" "store/**" "services/**" "lib/**")
else
    STAGED_DIFF=$(git diff --cached -- "app/**" "components/**" "hooks/**" "store/**" "services/**" "lib/**")
    CHANGED_FILES=$(git diff --cached --name-only --diff-filter=ACM -- "app/**" "components/**" "hooks/**" "store/**" "services/**" "lib/**")
fi

if [ -z "$STAGED_DIFF" ]; then
    echo "ℹ️ [Audit Chromium Interaction] Tidak ada perubahan UI yang diuji. Skip."
    exit 0
fi

mkdir -p "$SHOT_DIR" "$LAPORAN_DIR"

# ------------------------------------------------------------------------------
# 1. KLASIFIKASI AI: apakah diff menyentuh form / elemen interaktif?
# ------------------------------------------------------------------------------
PROMPT_FILE=$(mktemp)

cat << 'EOF' > "$PROMPT_FILE"
Kamu adalah Code Auditor khusus Interaktivitas UI (Strict Frontend Reviewer, AI Muse Spark 1.3).
Tentukan dari FULL Git Diff berikut apakah perubahan MENYENTUH form atau elemen interaktif. Penilaian MURNI oleh AI dari diff.

Jawab INTERAKTIF: YA bila baris baru (+) menyentuh SALAH SATU:
- form/input/select/textarea/checkbox/radio, react-hook-form (useForm), zodResolver, validasi input
- button/submit, onSubmit, onClick, onChange, event handler apapun
- Modal/Drawer/DropdownMenu/ConfirmDialog/DataTable/filter/sort/pagination
- navigasi/routing (router.push, Link, redirect), state interaktif (useState store UI)

Jawab INTERAKTIF: TIDAK hanya bila perubahan murni non-interaktif (teks statis, style token tanpa perilaku, tipe data tanpa logika, komentar, docs).

Format jawaban WAJIB diawali TEPAT 3 baris ini:
INTERAKTIF: YA atau TIDAK (pilih satu)
ROUTES: daftar route halaman yang terdampak (contoh: /spmb/registrasi, /login) atau - bila TIDAK
ALASAN: satu kalimat alasan klasifikasi

HANYA nilai baris baru (+). Abaikan konteks dan file tak diubah.

Git Diff:
EOF

echo '```diff' >> "$PROMPT_FILE"
echo "$STAGED_DIFF" >> "$PROMPT_FILE"
echo '```' >> "$PROMPT_FILE"

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
    echo "❌ [Audit Chromium Interaction] REJECTED: AI klasifikasi gagal/timeout (Exit: $AI_EXIT_CODE)!"
    exit 1
fi

CLEAN_RESULT=$(echo "$RESULT" | sed -e '/^> build/d' -e '/^Loaded config/d' | awk '/./{p=1} p')

if echo "$CLEAN_RESULT" | grep -qi 'INTERAKTIF:[ ]*YA'; then
    IS_INTERACTIVE=1
elif echo "$CLEAN_RESULT" | grep -qi 'INTERAKTIF:[ ]*TIDAK'; then
    echo "✅ [Audit Chromium Interaction] PASSED (AI menilai perubahan non-interaktif, uji chromium tidak diperlukan)."
    exit 0
else
    echo "❌ [Audit Chromium Interaction] REJECTED: AI tidak memberikan verdict INTERAKTIF yang valid!"
    echo "$CLEAN_RESULT"
    exit 1
fi

echo "🤖 [Audit Chromium Interaction] Perubahan interaktif terdeteksi. Menjalankan uji chromium langsung..."

# ------------------------------------------------------------------------------
# 2. SUSUN DAFTAR ROUTE (AI + pemetaan path page.tsx + root)
# ------------------------------------------------------------------------------
AI_ROUTES=$(echo "$CLEAN_RESULT" | grep -oiP 'ROUTES:\s*\K.*' | head -n 1 | tr ',' '\n' | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' | grep -E '^/' | head -n 6)

MAPPED_ROUTES=$(echo "$CHANGED_FILES" | grep -E 'app/.*(page|layout)\.tsx$' | sed -e 's|^app/||' -e 's|/\(page\|layout\)\.tsx$||' -e 's|([^)]*)/||g' -e 's|^|/|' -e 's|^/$|/|' | sort -u | head -n 6)

ROUTES=$(printf "%s\n/\n%s\n%s" "$AI_ROUTES" "$MAPPED_ROUTES" | sed -e 's/[[:space:]]*$//' | grep -E '^/' | awk '!seen[$0]++' | head -n 6)
[ -z "$ROUTES" ] && ROUTES="/"

echo "   Routes diuji: $(echo "$ROUTES" | tr '\n' ' ')"

# ------------------------------------------------------------------------------
# 3. PASTIKAN DEV SERVER JALAN (fail-closed)
# ------------------------------------------------------------------------------
if ! curl -s -o /dev/null --max-time 5 "$BASE_URL/" 2>/dev/null; then
    echo "❌ [Audit Chromium Interaction] REJECTED: dev server tidak reachable di $BASE_URL/"
    echo "   💡 Jalankan 'npm run dev' lalu commit ulang. Uji chromium wajib jalan."
    exit 1
fi

# ------------------------------------------------------------------------------
# 4. GENERATE + JALANKAN PLAYWRIGHT SPEC (chromium headless, read-only)
# ------------------------------------------------------------------------------
STAMP=$(date +%Y%m%d-%H%M%S)
BRANCH=$(git branch --show-current 2>/dev/null | tr -c 'a-zA-Z0-9_-' '_' | head -c 40)
[ -z "$BRANCH" ] && BRANCH="nobranch"
TMPDIR_AUDIT=$(mktemp -d)
REPORT_MD="$LAPORAN_DIR/chromium-$STAMP-$BRANCH.md"
RESULTS_JSON="$TMPDIR_AUDIT/results.json"

cat << 'SPEC_EOF' > "$TMPDIR_AUDIT/audit.spec.cjs"
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const BASE = process.env.AUDIT_BASE_URL;
const ROUTES = JSON.parse(process.env.AUDIT_ROUTES_JSON || '["/"]');
const RESULTS = process.env.AUDIT_RESULTS_JSON;
const SHOT_DIR = process.env.AUDIT_SHOT_DIR;
const STAMP = process.env.AUDIT_STAMP;

const results = { baseURL: BASE, startedAt: new Date().toISOString(), browser: 'chromium headless (playwright)', routes: [] };
test.describe.configure({ mode: 'serial' });

for (let i = 0; i < ROUTES.length; i++) {
    const route = ROUTES[i];
    test(`route ${route}`, async ({ page }) => {
        const entry = { route, httpStatus: null, finalPath: null, consoleErrors: [], pageErrors: [], shots: [], counts: {}, interactions: [], ok: true };
        page.on('console', (m) => { if (m.type() === 'error') entry.consoleErrors.push(m.text().slice(0, 500)); });
        page.on('pageerror', (e) => entry.pageErrors.push(String(e && e.stack || e).slice(0, 800)));
        let resp = null;
        try {
            resp = await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 30000 });
        } catch (e) {
            entry.pageErrors.push('goto failed: ' + String(e).slice(0, 300));
        }
        entry.httpStatus = resp ? resp.status() : null;
        try { await page.waitForLoadState('networkidle', { timeout: 12000 }); } catch (e) {}
        entry.finalPath = page.url().startsWith(BASE) ? (page.url().slice(BASE.length) || '/') : page.url();
        try {
            entry.counts = await page.evaluate(() => ({
                forms: document.querySelectorAll('form').length,
                inputs: document.querySelectorAll('input,textarea,select').length,
                buttons: document.querySelectorAll('button').length,
                links: document.querySelectorAll('a[href]').length,
            }));
        } catch (e) { entry.counts = { note: 'evaluate failed' }; }
        const shotName = `${STAMP}-${i}.jpg`;
        try {
            await page.screenshot({ path: path.join(SHOT_DIR, shotName), type: 'jpeg', quality: 60 });
            entry.shots.push(`assets/${shotName}`);
        } catch (e) { entry.pageErrors.push('screenshot failed: ' + String(e).slice(0, 200)); }
        // Interaksi aman read-only: buka-tutup Filter drawer bila ada (tanpa submit).
        try {
            const filterBtn = page.getByRole('button', { name: /filter/i }).first();
            if (await filterBtn.isVisible({ timeout: 3000 })) {
                await filterBtn.click({ timeout: 5000 });
                await page.waitForTimeout(1200);
                const panelOpen = await page.evaluate(() => !!document.querySelector('[role="dialog"],[data-state="open"]'));
                const shotD = `${STAMP}-${i}-drawer.jpg`;
                try { await page.screenshot({ path: path.join(SHOT_DIR, shotD), type: 'jpeg', quality: 60 }); entry.shots.push(`assets/${shotD}`); } catch (e) {}
                await page.keyboard.press('Escape');
                await page.waitForTimeout(600);
                entry.interactions.push({ name: 'filter-drawer-open-close', ok: !!panelOpen, note: panelOpen ? 'drawer/dialog terbuka lalu Escape' : 'klik filter tidak membuka panel' });
                if (!panelOpen) entry.pageErrors.push('filter drawer tidak terbuka saat diklik');
            } else {
                entry.interactions.push({ name: 'filter-drawer-open-close', ok: true, note: 'skipped: tidak ada tombol Filter' });
            }
        } catch (e) {
            entry.interactions.push({ name: 'filter-drawer-open-close', ok: false, note: String(e).slice(0, 300) });
        }
        entry.ok = entry.pageErrors.length === 0 && (entry.httpStatus === null ? false : entry.httpStatus < 500);
        if (entry.httpStatus === null) entry.pageErrors.push('no http response');
        results.routes.push(entry);
        expect(entry.ok, JSON.stringify(entry.pageErrors).slice(0, 1000)).toBe(true);
    });
}

test.afterAll(async () => {
    results.finishedAt = new Date().toISOString();
    fs.writeFileSync(RESULTS, JSON.stringify(results, null, 2));
});
SPEC_EOF

cat << 'CFG_EOF' > "$TMPDIR_AUDIT/pw.config.cjs"
module.exports = {
    testDir: __dirname,
    testMatch: 'audit.spec.cjs',
    timeout: 90000,
    workers: 1,
    fullyParallel: false,
    use: { headless: true, viewport: { width: 1360, height: 900 } },
};
CFG_EOF

export AUDIT_BASE_URL="$BASE_URL"
export AUDIT_ROUTES_JSON=$(printf '%s\n' "$ROUTES" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.stringify(s.split('\n').filter(Boolean))))")
export AUDIT_RESULTS_JSON="$RESULTS_JSON"
export AUDIT_SHOT_DIR="$SHOT_DIR"
export AUDIT_STAMP="$STAMP"

PW_OUT="$TMPDIR_AUDIT/pw.log"
export NODE_PATH="$REPO_ROOT/node_modules${NODE_PATH:+:$NODE_PATH}"
if ! timeout 420s npx playwright test --config "$TMPDIR_AUDIT/pw.config.cjs" > "$PW_OUT" 2>&1; then
    PW_FAILED=1
else
    PW_FAILED=0
fi

# ------------------------------------------------------------------------------
# 5. SUSUN LAPORAN .md DARI results.json
# ------------------------------------------------------------------------------
export REPORT_MD REPORT_BRANCH="$BRANCH" REPORT_FILES="$CHANGED_FILES" REPORT_VERDICT="$CLEAN_RESULT" REPORT_PW_FAILED="$PW_FAILED"
node << 'NODE_EOF'
const fs = require('fs');
const res = JSON.parse(fs.readFileSync(process.env.AUDIT_RESULTS_JSON, 'utf-8'));
const lines = [];
lines.push(`# Laporan Uji Chromium — Interaksi UI`);
lines.push(``);
lines.push(`- Tanggal: ${new Date().toISOString()}`);
lines.push(`- Branch: ${process.env.REPORT_BRANCH}`);
lines.push(`- Base URL: ${res.baseURL} (${res.browser})`);
lines.push(`- File staged yang dinilai:`);
String(process.env.REPORT_FILES || '').split('\n').filter(Boolean).forEach(f => lines.push(`  - ${f}`));
lines.push(`- Verdict AI klasifikasi:`);
String(process.env.REPORT_VERDICT || '').split('\n').filter(Boolean).slice(0, 6).forEach(l => lines.push(`  > ${l}`));
lines.push(``);
let allOk = process.env.REPORT_PW_FAILED === '0';
for (const r of res.routes) {
    lines.push(`## Route ${r.route}`);
    lines.push(`- HTTP: ${r.httpStatus} | Final path: ${r.finalPath} | OK: ${r.ok ? 'YA' : 'TIDAK'}`);
    lines.push(`- Elemen: forms=${r.counts.forms ?? '?'} inputs=${r.counts.inputs ?? '?'} buttons=${r.counts.buttons ?? '?'} links=${r.counts.links ?? '?'}`);
    for (const it of (r.interactions || [])) lines.push(`- Interaksi ${it.name}: ${it.ok ? 'OK' : 'GAGAL'} — ${it.note}`);
    if ((r.consoleErrors || []).length) { lines.push(`- Console errors (${r.consoleErrors.length}):`); r.consoleErrors.slice(0, 5).forEach(e => lines.push(`  - ${e}`)); }
    if ((r.pageErrors || []).length) { lines.push(`- Page errors (${r.pageErrors.length}):`); r.pageErrors.slice(0, 5).forEach(e => lines.push(`  - ${e}`)); }
    for (const s of (r.shots || [])) lines.push(`- Screenshot: ${s}`);
    lines.push(``);
    if (!r.ok) allOk = false;
}
lines.push(`## Verdict: ${allOk ? 'PASSED' : 'REJECTED'}`);
lines.push(`Uji read-only (tanpa submit/login/mutasi data). Screenshot tersimpan di .agents/laporan/assets/.`);
fs.writeFileSync(process.env.REPORT_MD, lines.join('\n'));
NODE_EOF

rm -rf "$TMPDIR_AUDIT"

if [ "$PW_FAILED" -ne 0 ] || ! grep -q '## Verdict: PASSED' "$REPORT_MD"; then
    echo "❌ [Audit Chromium Interaction] REJECTED oleh uji chromium!"
    echo "   Laporan (belum di-stage, pelajari lalu perbaiki): $REPORT_MD"
    sed -n '1,40p' "$REPORT_MD"
    exit 1
fi

git add -- "$REPORT_MD" $SHOT_DIR/*.jpg 2>/dev/null || git add -- "$REPORT_MD"
echo "✅ [Audit Chromium Interaction] PASSED (chromium langsung, laporan: $REPORT_MD ikut ter-commit)."
exit 0
