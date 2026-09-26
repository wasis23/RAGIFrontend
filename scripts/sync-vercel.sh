#!/usr/bin/env bash
# ============================================================
# sync-vercel.sh — Sinkronkan branch kerja tim (main) ke branch
# deploy Vercel (vercel).
#
# Alur kerja:
#   - Tim mengembangkan fitur di branch `main`.
#   - Vercel men-deploy dari branch `vercel`.
#   - Setiap kali `main` bertambah, jalankan skrip ini agar
#     `vercel` = `main` + fitur khusus deploy.
#
# Pemakaian:
#   bash scripts/sync-vercel.sh
#   bash scripts/sync-vercel.sh --dry   # hanya lihat, tanpa merge/push
# ============================================================
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

DEPLOY_BRANCH="${DEPLOY_BRANCH:-vercel}"
MAIN_BRANCH="${MAIN_BRANCH:-main}"
DRY_RUN=0
[ "${1:-}" = "--dry" ] && DRY_RUN=1

echo "🔁 Sinkronisasi '$MAIN_BRANCH' -> '$DEPLOY_BRANCH' (${REPO_ROOT})"

echo "== 1) fetch origin =="
git fetch origin

echo "== 2) pindah ke branch $DEPLOY_BRANCH =="
current="$(git branch --show-current)"
if [ "$current" != "$DEPLOY_BRANCH" ]; then
    git checkout "$DEPLOY_BRANCH"
fi

echo "== 3) commit '$MAIN_BRANCH' yang belum ada di '$DEPLOY_BRANCH' =="
pending="$(git rev-list "$DEPLOY_BRANCH..origin/$MAIN_BRANCH" || true)"
if [ -z "$pending" ]; then
    echo "✅ Sudah sinkron — tidak ada commit baru di origin/$MAIN_BRANCH."
else
    git --no-pager log --oneline "$DEPLOY_BRANCH..origin/$MAIN_BRANCH"
    if [ "$DRY_RUN" = "1" ]; then
        echo "(dry run) lewati merge & push."
        exit 0
    fi
    echo "== 4) merge origin/$MAIN_BRANCH =="
    git merge "origin/$MAIN_BRANCH" -m "merge: sinkronkan $MAIN_BRANCH ke $DEPLOY_BRANCH"
fi

if [ "$DRY_RUN" = "1" ]; then
    echo "(dry run) selesai."
    exit 0
fi

echo "== 5) push ke semua remote (origin punya >1 push URL) =="
git push origin "$DEPLOY_BRANCH"

echo "✅ Selesai. Vercel akan auto-deploy dari branch '$DEPLOY_BRANCH' (pastikan Production Branch = $DEPLOY_BRANCH)."
